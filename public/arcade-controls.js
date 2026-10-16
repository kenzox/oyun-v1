import { renderLaserScene } from './arcade-render.js';
import { TRACK_LENGTH } from './three-rules.js';
import { RACE_LENGTH } from './arcade-rules.js';
const $ = selector => document.querySelector(selector);
const range = (id, label, min, max, value, step = 1) => `<label for="${id}">${label}</label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"/>`;
export function arcadeControls(g, id) {
  if (['race', 'race3d'].includes(g.id)) {
    const r = g.racers.find(r => r.id === id);
    return `<div class="control-info" id="race-status" role="status"></div><div class="shot-settings">${range('race-steer', 'Direksiyon · sol ↔ sağ', .08, .92, r.target, .01)}</div><div class="arcade-buttons"><button class="secondary" data-action="race-brake" aria-pressed="false">Fren: kapalı</button><button class="primary" data-action="race-boost">Turbo ⚡</button></div><p class="pad-label">Gaz otomatik. Fren düğmesine tekrar dokunarak hızlan. Turbo 6 saniyede dolar.</p>${g.id === 'race3d' ? '<button class="secondary reset-car" data-action="race-reverse">2 saniye geri git ↓</button><button class="secondary reset-car" data-action="race-reset">Son etaba dön ↻</button><p class="pad-label">Viraj desteği açık. Takılırsan son kontrol noktasına dönersin.</p>' : ''}`;
  }
  if (['pool', 'pool3d'].includes(g.id)) return `<div class="control-info" id="pool-status" role="status"></div><div class="shot-settings">${range('pool-angle', 'Yön · 0° sağ, 90° yukarı', -180, 180, g.aim.angle)}<output id="pool-angle-value">${g.aim.angle}°</output>${range('pool-power', 'Vuruş gücü', 8, 100, Math.round(g.aim.power * 100))}<output id="pool-power-value">${Math.round(g.aim.power * 100)}%</output><button class="primary" data-action="pool-shot">Istakayla vur ●</button></div><p class="pad-label">TV’deki kesikli çizgi yönünü gösterir. Renkli top +10, beyaz top −5. Top sokarsan yeniden vurursun.</p>`;
  if (g.id === 'tennis') {
    const p = g.tennists.find(p => p.id === id);
    return `<div class="shot-settings">${range('tennis-position', 'Sahadaki konum · üst ↔ alt', 0, 1, (p.target - 90) / 380, .01)}${range('tennis-aim', 'Vuruş yönü · yukarı ↔ aşağı', -1, 1, p.aim, .05)}</div><button class="primary jump-button" data-action="tennis-swing">Güçlü vuruş 🎾</button><p class="pad-label">Topla aynı hizaya gel; yakındaki topa otomatik vurursun. Güçlü vuruşu top yaklaşırken kullan.</p>`;
  }
  if (g.id === 'laser') return `<div class="control-info" id="laser-status" role="status"></div><canvas id="laser-pad" class="laser-pad" width="1000" height="560" aria-label="Hedeflere dokunarak nişan al"></canvas><p class="pad-label">Hedefe dokun, sonra ateşle. Klavyeyle nişan almak için kaydırıcıları kullan.</p><div class="arcade-buttons"><button class="primary" data-action="laser-fire">Lazeri ateşle ⊕</button><button class="secondary" data-action="laser-reload">Doldur ↻</button></div><details class="aim-alternative"><summary>Hassas nişan</summary><div class="shot-settings">${range('laser-x', 'Yatay nişan', 60, 940, 500)}${range('laser-y', 'Dikey nişan', 60, 460, 280)}</div></details>`;
  return '';
}
export function updateArcadeControls(state, id, online) {
  const g = state.game, blocked = !online || !state.hostOnline || !!state.pauseReason;
  if ($('#race-status')) {
    const r = g.racers.find(r => r.id === id), length = g.id === 'race3d' ? TRACK_LENGTH : RACE_LENGTH, remaining = Math.max(0, Math.ceil((r.boostReady - state.serverNow) / 1000));
    $('#race-status').textContent = r.finished ? `Finiş! ${r.place}. sıradasın.` : `${g.id === 'race3d' ? `${Math.min(4, r.checkpoint + 1)}/4 etap` : `${Math.min(3, Math.floor(r.distance / 1000) + 1)}/3 tur`} · ${Math.floor(r.distance)}/${length} m · ${g.id === 'race3d' ? `${Math.round(r.speed * 3.6)} km/sa` : `${Math.round(r.speed)} m/sn`}${state.serverNow < r.crashUntil ? ' · Çarpışma! Yeniden hızlanıyorsun.' : ''}`;
    $('#race-steer').disabled = blocked || r.finished;
    if (g.id === 'race3d' && $('#race-steer').dataset.teleport !== String(r.teleport)) { $('#race-steer').value = String(r.target); $('#race-steer').dataset.teleport = String(r.teleport); }
    if ($('[data-action="race-reverse"]')) $('[data-action="race-reverse"]').disabled = blocked || r.finished || state.serverNow < r.reverseUntil || state.serverNow < g.serveAt;
    if ($('[data-action="race-reset"]')) $('[data-action="race-reset"]').disabled = blocked || r.finished || state.serverNow < r.resetReady;
    const brake = $('[data-action="race-brake"]'), boost = $('[data-action="race-boost"]');
    brake.disabled = blocked || r.finished; brake.setAttribute('aria-pressed', String(r.braking)); brake.textContent = `Fren: ${r.braking ? 'açık' : 'kapalı'}`;
    boost.disabled = blocked || r.finished || remaining > 0 || state.serverNow < r.crashUntil || state.serverNow < g.serveAt; boost.textContent = remaining ? `Turbo: ${remaining} sn` : 'Turbo ⚡';
  }
  if ($('#pool-status')) {
    const turn = g.ids[g.turn] === id, name = state.players.find(p => p.id === g.ids[g.turn])?.name || 'Oyuncu';
    $('#pool-status').textContent = g.rolling ? 'Toplar hareket ediyor. TV’ye bak!' : `${turn ? 'Sıra sende!' : `Sıra ${name} adlı oyuncuda.`} ${Math.max(0, Math.ceil((20000 - state.serverNow + g.turnAt) / 1000))} sn`;
    document.querySelectorAll('#pool-angle, #pool-power, [data-action="pool-shot"]').forEach(el => { el.disabled = blocked || !turn || g.rolling; });
  }
  if ($('#tennis-position')) {
    const p = g.tennists.find(p => p.id === id);
    $('#tennis-position').disabled = blocked; $('#tennis-aim').disabled = blocked;
    $('[data-action="tennis-swing"]').disabled = blocked || state.serverNow < g.serveAt || state.serverNow < p.swingReady;
  }
  if ($('#laser-status')) {
    const p = g.shooters.find(p => p.id === id);
    $('#laser-status').textContent = p.reloadAt ? 'Lazer doluyor…' : `${p.ammo}/5 enerji · ${p.hits} isabet / ${p.shots} atış`;
    $('[data-action="laser-fire"]').disabled = blocked || !!p.reloadAt || state.serverNow < p.readyAt;
    $('[data-action="laser-reload"]').disabled = blocked || !!p.reloadAt || p.ammo === 5;
    $('#laser-x').disabled = $('#laser-y').disabled = blocked;
    renderLaserScene($('#laser-pad').getContext('2d'), state, id);
  }
}
function poolInput(type, state) { return { type, angle: Number($('#pool-angle').value), power: Number($('#pool-power').value) / 100, round: state.game.round }; }
export function arcadeClick(button, state, id, send) {
  const action = button.dataset.action;
  if (action === 'race-brake') send({ type: action, on: !state.game.racers.find(r => r.id === id).braking });
  else if (['race-boost', 'race-reset', 'race-reverse', 'tennis-swing', 'laser-fire', 'laser-reload'].includes(action)) send({ type: action });
  else if (action === 'pool-shot') send(poolInput(action, state));
  else return false;
  return true;
}
export function arcadeInput(target, state, send) {
  const id = target.id, n = Number(target.value);
  if (id === 'race-steer') send({ type: id, x: n });
  else if (id === 'tennis-position') send({ type: 'tennis-move', y: n });
  else if (id === 'tennis-aim') send({ type: id, angle: n });
  else if (id === 'pool-angle' || id === 'pool-power') {
    $(`#${id}-value`).textContent = `${n}${id === 'pool-angle' ? '°' : '%'}`;
    send(poolInput('pool-aim', state));
  } else if (id === 'laser-x' || id === 'laser-y') send({ type: 'laser-aim', x: Number($('#laser-x').value), y: Number($('#laser-y').value) });
  else return false;
  return true;
}
export function bindArcadeControls(listen, getState, send) {
  const canvas = $('#laser-pad'); if (!canvas) return;
  let active = false, lastAt = -Infinity;
  const aim = (e, force = false) => {
    if (!active || getState().pauseReason || !getState().hostOnline) return;
    const now = performance.now(); if (!force && now - lastAt < 35) return; lastAt = now;
    const rect = canvas.getBoundingClientRect(), x = Math.max(60, Math.min(940, (e.clientX - rect.left) / rect.width * 1000)), y = Math.max(60, Math.min(460, (e.clientY - rect.top) / rect.height * 560));
    $('#laser-x').value = String(Math.round(x)); $('#laser-y').value = String(Math.round(y)); send({ type: 'laser-aim', x, y });
  };
  listen(canvas, 'pointerdown', e => { active = true; canvas.setPointerCapture(e.pointerId); aim(e, true); });
  listen(canvas, 'pointermove', e => aim(e));
  listen(canvas, 'pointerup', e => { aim(e, true); active = false; });
  listen(canvas, 'pointercancel', () => { active = false; });
}
