import { RAPIER, attachPhysics, physicsFor, stepPhysics, pose } from './physics.js';
import { TABLE, TABLE_FLOOR, TABLE_RAILS } from '../public/three-rules.js';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const zero = { x: 0, y: 0, z: 0 };
function rack(g) {
  const rt = physicsFor(g);
  for (const body of rt.bodies.values()) rt.world.removeRigidBody(body);
  rt.bodies.clear();
  const starts = [{ x: -2.4, z: 0 }];
  for (let row = 0; row < 3; row++) for (let col = 0; col <= row; col++) starts.push({ x: 1.6 + row * .198, z: (col - row / 2) * .23 });
  g.balls3d = starts.map((p, number) => {
    const body = rt.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, TABLE.radius + .005, p.z).setLinearDamping(.35).setAngularDamping(.45).setCcdEnabled(true));
    rt.world.createCollider(RAPIER.ColliderDesc.ball(TABLE.radius).setMass(.17).setFriction(.22).setRestitution(.94).setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min), body);
    rt.bodies.set(number, body);
    return { number, sunk: false, ...pose(body) };
  });
  g.rack = (g.rack || 0) + 1;
}
function nextTurn(g, now, connected, retain) {
  if (!retain || !connected.includes(g.ids[g.turn])) {
    for (let offset = 1; offset <= g.ids.length; offset++) {
      const turn = (g.turn + offset) % g.ids.length;
      if (connected.includes(g.ids[turn])) { g.turn = turn; break; }
    }
  }
  g.round++; g.turnAt = now; g.aim = { angle: 0, power: .6 };
}
function respot(g) {
  const rt = physicsFor(g), cue = g.balls3d[0], body = rt.bodies.get(0);
  for (let x = -2.4; x < 3.8; x += .3) for (let z = 0; z < 1.4; z += .3) {
    if (g.balls3d.slice(1).some(b => !b.sunk && Math.hypot(b.position.x - x, b.position.z - z) < .25)) continue;
    body.setEnabled(true); body.setTranslation({ x, y: TABLE.radius + .005, z }, true); body.setLinvel(zero, true); body.setAngvel(zero, true);
    cue.sunk = false; Object.assign(cue, pose(body)); return;
  }
}
export function initPool3D(g) {
  if (g.id !== 'pool3d') return;
  const rt = attachPhysics(g);
  for (const p of TABLE_FLOOR) rt.world.createCollider(RAPIER.ColliderDesc.cuboid(p.hx, .12, p.hz).setTranslation(p.x, -.12, p.z).setFriction(.22).setRestitution(0));
  for (const p of TABLE_RAILS) rt.world.createCollider(RAPIER.ColliderDesc.cuboid(p.hx, .16, p.hz).setTranslation(p.x, .12, p.z).setFriction(.16).setRestitution(.82));
  g.round = 1; g.rolling = false; g.aim = { angle: 0, power: .6 }; g.shotPockets = 0; g.scratch = false; g.restSince = null;
  rack(g); g.notice = '3D masa hazır. Renkli top +10; beyaz top −5. Top sokarsan tekrar vur!';
}
export function inputPool3D(g, id, input, now) {
  if (g.id !== 'pool3d' || g.rolling || id !== g.ids[g.turn] || input.round !== g.round || now - g.turnAt >= 20000) return;
  if (!['pool-aim', 'pool-shot'].includes(input.type) || !Number.isFinite(input.angle) || !Number.isFinite(input.power)) return;
  g.aim = { angle: clamp(input.angle, -180, 180), power: clamp(input.power, .08, 1) };
  if (input.type === 'pool-aim') return;
  const body = physicsFor(g)?.bodies.get(0); if (!body || g.balls3d[0].sunk) return;
  const a = g.aim.angle * Math.PI / 180, speed = 1 + 6 * g.aim.power;
  body.applyImpulse({ x: Math.cos(a) * speed * body.mass(), y: 0, z: -Math.sin(a) * speed * body.mass() }, true);
  g.rolling = true; g.shotAt = now; g.shotPockets = 0; g.scratch = false; g.restSince = null;
}
export function tickPool3D(g, dt, now, connected) {
  if (g.id !== 'pool3d' || !physicsFor(g)) return;
  if (!g.rolling) {
    if (now - g.turnAt >= 20000 || !connected.includes(g.ids[g.turn])) nextTurn(g, now, connected, false);
    return;
  }
  stepPhysics(g, dt, rt => {
    // Rolling resistance dissipates energy that contact friction alone cannot.
    for (const [number, b] of rt.bodies) {
      if (g.balls3d[number].sunk) continue;
      const v = b.linvel(), speed = Math.hypot(v.x, v.z);
      b.resetForces(false);
      if (speed > .001 && b.translation().y >= .08) b.addForce({ x: -v.x / speed * b.mass() * .16, y: 0, z: -v.z / speed * b.mass() * .16 }, true);
    }
  }, rt => {
    for (const ball of g.balls3d) {
      if (ball.sunk) continue;
      const body = rt.bodies.get(ball.number);
      if (body.translation().y < -.35) { ball.sunk = true; body.setEnabled(false); if (ball.number === 0) g.scratch = true; else g.shotPockets++; }
    }
  });
  const rt = physicsFor(g);
  for (const ball of g.balls3d) Object.assign(ball, pose(rt.bodies.get(ball.number)));
  const moving = g.balls3d.some(b => !b.sunk && (b.position.y < .07 || Math.hypot(...Object.values(rt.bodies.get(b.number).linvel())) > .045));
  if (moving) g.restSince = null; else if (g.restSince === null) g.restSince = now;
  if ((g.restSince !== null && now - g.restSince >= 250) || now - g.shotAt >= 16000) {
    for (const b of rt.bodies.values()) { b.resetForces(false); b.setLinvel(zero, true); b.setAngvel(zero, true); }
    g.rolling = false;
    const owner = g.ids[g.turn]; g.scores[owner] = Math.max(0, g.scores[owner] + g.shotPockets * 10 - (g.scratch ? 5 : 0));
    g.notice = g.scratch ? 'Beyaz top cepte: −5 ve sıra değişir.' : g.shotPockets ? `+${g.shotPockets * 10}! Bir vuruş daha.` : 'Sıra sonraki oyuncuda.';
    if (g.scratch) respot(g);
    if (g.balls3d.slice(1).every(b => b.sunk)) { rack(g); g.notice += ' Yeni masa hazır.'; }
    nextTurn(g, now, connected, g.shotPockets > 0 && !g.scratch);
  }
}
