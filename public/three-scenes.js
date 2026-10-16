import * as THREE from 'three';
import { createPoolScene, createRaceScene, disposeScene } from './three-models.js';
import { trackHeading, WHEEL_POINTS } from './three-rules.js';
import { SnapshotBuffer } from './three-snapshots.js';
export function createThreeView(container, initialState) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  const canvas = renderer.domElement; canvas.id = 'board'; canvas.dataset.renderer = 'three'; canvas.setAttribute('aria-label', initialState.game.id === 'pool3d' ? '3D bilardo masası' : '3D yarış takip kameraları');
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = initialState.game.id === 'pool3d'; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const players = initialState.game.ids.map(id => initialState.players.find(p => p.id === id));
  const pool = initialState.game.id === 'pool3d', model = pool ? createPoolScene() : createRaceScene(players);
  const buffer = new SnapshotBuffer(); let latest = initialState, frame, disposed = false, contextFailed = false, width = 1000, height = 560;
  const overlay = document.createElement('div'); overlay.className = 'three-overlay'; overlay.setAttribute('role', 'status');
  const labels = document.createElement('div'); labels.className = 'race-views';
  const cols = players.length <= 2 ? players.length : players.length <= 4 ? 2 : 4, rows = Math.ceil(players.length / cols);
  const panels = pool ? [] : players.map((p, i) => { const div = document.createElement('div'); div.className = 'race-view-label'; div.style.cssText = `left:${i % cols * 100 / cols}%;top:${Math.floor(i / cols) * 100 / rows}%;width:${100 / cols}%;height:${100 / rows}%;--pcolor:${p.color}`; const span = document.createElement('span'); div.append(span); labels.append(div); return span; });
  container.replaceChildren(canvas, labels, overlay); container.dataset.state = 'ready';
  const resize = () => { const rect = container.getBoundingClientRect(); width = Math.max(1, Math.round(rect.width)); height = Math.max(1, Math.round(rect.height)); renderer.setSize(width, height, false); };
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  const contextLost = event => { event.preventDefault(); contextFailed = true; cancelAnimationFrame(frame); overlay.hidden = false; overlay.textContent = '3D görüntü bağlantısı kesildi. Oyun rafına dönüp yeniden açın.'; container.dataset.state = 'error'; };
  canvas.addEventListener('webglcontextlost', contextLost);
  function transform(object, before, after, alpha, snap = false) {
    if (!before || snap) before = after;
    object.position.set(before.position.x, before.position.y, before.position.z).lerp(new THREE.Vector3(after.position.x, after.position.y, after.position.z), alpha);
    object.quaternion.set(before.rotation.x, before.rotation.y, before.rotation.z, before.rotation.w).slerp(new THREE.Quaternion(after.rotation.x, after.rotation.y, after.rotation.z, after.rotation.w), alpha);
  }
  function update(state) {
    latest = state; buffer.push(state, performance.now());
    if (!contextFailed) { overlay.hidden = !state.pauseReason; overlay.textContent = state.pauseReason ? 'Kısa bir mola · Süre ve oyun korunuyor' : ''; }
    if (!pool) state.game.racers.forEach((r, i) => { panels[i].textContent = `${players[i].name} · ${r.finished ? `${r.place}. sıra — FİNİŞ` : !r.connected ? 'Bağlantı bekleniyor' : `${Math.round(r.speed * 3.6)} km/sa · ${Math.min(4, r.checkpoint + 1)}/4 etap`}`; });
  }
  function draw(now) {
    if (disposed) return;
    const sample = buffer.sample(now), { before, after, alpha } = sample, a = before.game, b = after.game;
    if (pool) {
      b.balls3d.forEach((ball, i) => { model.balls[i].visible = !ball.sunk; transform(model.balls[i], a.balls3d[i], ball, alpha, a.rack !== b.rack || a.balls3d[i].sunk !== ball.sunk); });
      model.cue.visible = model.aim.visible = !latest.game.rolling && !latest.game.balls3d[0].sunk;
      const cue = model.balls[0].position, angle = latest.game.aim.angle * Math.PI / 180;
      model.cue.position.copy(cue); model.cue.rotation.y = angle; model.aim.position.copy(cue); model.aim.position.y += .01; model.aim.rotation.y = angle;
      model.camera.aspect = width / height; model.camera.updateProjectionMatrix(); renderer.setScissorTest(false); renderer.setViewport(0, 0, width, height); renderer.render(model.scene, model.camera);
    } else {
      b.racers.forEach(r => {
        const prior = a.racers.find(p => p.id === r.id), car = model.cars.get(r.id);
        transform(car.group, prior, r, alpha, prior?.teleport !== r.teleport); car.group.visible = r.connected || r.finished;
        car.wheels.forEach(({ pivot, wheel }, i) => { const w = r.wheels[i], old = prior?.teleport === r.teleport ? prior.wheels[i] : w; pivot.position.y = -THREE.MathUtils.lerp(old.suspension, w.suspension, alpha) + WHEEL_POINTS[i].y; pivot.rotation.y = THREE.MathUtils.lerp(old.steering, w.steering, alpha); wheel.rotation.x = THREE.MathUtils.lerp(old.rotation, w.rotation, alpha); });
      });
      renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
      b.racers.forEach((r, i) => {
        const camera = model.cameras[i], p = model.cars.get(r.id).group.position, yaw = trackHeading(p.z);
        const x = Math.round(i % cols * width / cols), y = Math.round(height - (Math.floor(i / cols) + 1) * height / rows);
        const w = Math.round(width / cols), h = Math.round(height / rows);
        camera.position.set(p.x - Math.sin(yaw) * 11, p.y + 6, p.z - Math.cos(yaw) * 11); camera.lookAt(p.x + Math.sin(yaw) * 8, p.y + .5, p.z + Math.cos(yaw) * 8);
        camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setViewport(x, y, w, h); renderer.setScissor(x, y, w, h); renderer.render(model.scene, camera);
      });
    }
    frame = requestAnimationFrame(draw);
  }
  update(initialState); frame = requestAnimationFrame(draw);
  return { update, dispose() { if (disposed) return; disposed = true; cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener('webglcontextlost', contextLost); disposeScene(model.scene); renderer.dispose(); renderer.forceContextLoss(); } };
}
