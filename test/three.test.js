import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GAMES, createGame, inputGame, tickGame, publicGame, disposeGame } from '../server/games.js';
import { physicsFor, pose } from '../server/physics.js';
import { advanceRoom } from '../server/session.js';
import { TABLE_POCKETS, trackCenter, trackHeading, yawRotation, TRACK_OBSTACLES } from '../public/three-rules.js';
import { createPoolScene, createRaceScene, disposeScene } from '../public/three-models.js';
import { SnapshotBuffer } from '../public/three-snapshots.js';
const players = [{ id: 'ada', name: 'Ada', color: '#b9ec72' }, { id: 'ege', name: 'Ege', color: '#c5b4fa' }];
const games = [];
const make = (id, group = players) => { const g = createGame(id, group, 0); games.push(g); return g; };
afterEach(() => { games.splice(0).forEach(disposeGame); });
const run = (g, seconds, start = 0, connected = g.ids) => { for (let i = 1; i <= Math.round(seconds * 120); i++) tickGame(g, 1 / 120, start + i * 1000 / 120, connected); };
const shoot = (g, id = 'ada', fields = {}) => inputGame(g, id, { type: 'pool-shot', round: g.round, angle: 0, power: .6, ...fields }, 1);
const reposition = (g, id, p, velocity = { x: 0, y: 0, z: 0 }) => { const b = physicsFor(g).bodies.get(id); b.setTranslation(p, true); b.setLinvel(velocity, true); b.setAngvel({ x: 0, y: 0, z: 0 }, true); return b; };

test('3D games are additional catalogue entries and do not replace classic rules', () => {
  assert.equal(GAMES.length, 18); assert.ok(GAMES.find(g => g.id === 'pool')); assert.ok(GAMES.find(g => g.id === 'race'));
  const old = make('pool'), modern = make('pool3d'); assert.ok(old.balls); assert.ok(!old.balls3d); assert.ok(modern.balls3d); assert.equal(physicsFor(old), undefined);
});
test('Rapier worlds and rigid body handles never enter network snapshots', () => {
  for (const id of ['pool3d', 'race3d']) {
    const g = make(id), snapshot = JSON.parse(JSON.stringify(publicGame(g)));
    assert.ok(physicsFor(g).world); assert.equal(snapshot.world, undefined); assert.equal(snapshot.bodies, undefined);
    assert.ok(JSON.stringify(snapshot).length < 12000);
  }
});
test('3D pool validates turn, finite inputs, round token and one shot at a time', () => {
  const g = make('pool3d'); shoot(g, 'ege'); shoot(g, 'guest'); shoot(g, 'ada', { angle: Infinity }); shoot(g, 'ada', { round: 999 });
  assert.equal(g.rolling, false); shoot(g); const b = physicsFor(g).bodies.get(0), vx = b.linvel().x;
  shoot(g, 'ada', { angle: 90 }); assert.equal(b.linvel().x, vx); assert.ok(vx > 4);
});
test('3D billiard balls exchange momentum through Rapier contacts', () => {
  const g = make('pool3d'); reposition(g, 1, { x: -2, y: .115, z: 0 }); shoot(g);
  run(g, .15); assert.ok(physicsFor(g).bodies.get(1).linvel().x > .5); assert.ok(physicsFor(g).bodies.get(0).linvel().x < 2);
});
test('3D pool cushions rebound a fast ball without tunneling', () => {
  const g = make('pool3d'); shoot(g);
  reposition(g, 0, { x: 4.15, y: .115, z: 0 }, { x: 6, y: 0, z: 0 }); run(g, .15);
  const b = physicsFor(g).bodies.get(0); assert.ok(b.translation().x < 4.4); assert.ok(b.linvel().x < 0);
});
test('3D pool holes let a colored ball fall under gravity and score once', () => {
  const g = make('pool3d'); shoot(g); reposition(g, 0, { x: -2.4, y: .115, z: 0 });
  const pocket = TABLE_POCKETS[1]; reposition(g, 1, { ...pocket, y: .115 }); run(g, 1.2);
  assert.equal(g.balls3d[1].sunk, true); assert.equal(g.scores.ada, 10); assert.equal(g.turn, 0); assert.equal(g.round, 2);
  run(g, .5, 1200); assert.equal(g.scores.ada, 10);
});
test('3D pool cue scratch costs five, respots the cue and changes turn', () => {
  const g = make('pool3d'); g.scores.ada = 10; shoot(g); reposition(g, 0, { ...TABLE_POCKETS[1], y: .115 }); run(g, 1.2);
  assert.equal(g.scores.ada, 5); assert.equal(g.turn, 1); assert.equal(g.balls3d[0].sunk, false); assert.ok(g.balls3d[0].position.y > 0);
});
test('3D pool rolling resistance settles a break and passes the turn', () => {
  const g = make('pool3d'); shoot(g); run(g, 12);
  assert.equal(g.rolling, false); assert.equal(g.round, 2); assert.equal(g.turn, 1);
  for (const b of physicsFor(g).bodies.values()) assert.equal(b.linvel().x, 0);
});
test('3D pool skips disconnected idle turns without interrupting a moving shot', () => {
  const g = make('pool3d'); shoot(g); run(g, .1, 0, ['ege']); assert.equal(g.turn, 0);
  run(g, 12, 100, ['ege']); assert.equal(g.turn, 1);
  const idle = make('pool3d'); tickGame(idle, .03, 1, ['ege']); assert.equal(idle.turn, 1);
});
test('3D pool fixed substeps give the same trajectory at different server tick rates', () => {
  const a = make('pool3d'), b = make('pool3d'); shoot(a); shoot(b);
  for (let i = 1; i <= 30; i++) tickGame(a, 1 / 30, i * 1000 / 30);
  for (let i = 1; i <= 60; i++) tickGame(b, 1 / 60, i * 1000 / 60);
  a.balls3d.forEach((ball, i) => assert.ok(Math.abs(ball.position.x - b.balls3d[i].position.x) < .001));
});
test('raycast wheels settle on the ground and propel the 3D car after countdown', () => {
  const g = make('race3d', [players[0]]); inputGame(g, 'ada', { type: 'race-steer', x: .5 }, 0);
  run(g, 2.5); assert.ok(g.racers[0].position.z < -6); const vehicle = physicsFor(g).vehicles.get('ada');
  assert.equal(vehicle.numWheels(), 4); assert.ok(vehicle.wheelIsInContact(0));
  run(g, 3, 2500); assert.ok(g.racers[0].position.z > -2); assert.ok(g.racers[0].speed > 8); assert.ok(g.racers[0].position.y > .4);
});
test('3D car braking reduces velocity and steering input is constrained', () => {
  const g = make('race3d', [players[0]]); inputGame(g, 'ada', { type: 'race-steer', x: .5 }, 0); run(g, 6);
  const before = g.racers[0].speed; inputGame(g, 'ada', { type: 'race-brake', on: true }, 6000); run(g, .5, 6000);
  assert.ok(g.racers[0].speed < before / 2);
  inputGame(g, 'ada', { type: 'race-steer', x: 100 }, 6500); assert.equal(g.racers[0].target, .92);
  inputGame(g, 'ada', { type: 'race-steer', x: NaN }, 6500); assert.equal(g.racers[0].target, .92);
});
test('3D car turbo and reverse timers reject repeated activation', () => {
  const g = make('race3d'); inputGame(g, 'ada', { type: 'race-boost' }, 1); assert.equal(g.racers[0].boostReady, 0);
  inputGame(g, 'ada', { type: 'race-boost' }, 3000); inputGame(g, 'ada', { type: 'race-boost' }, 3001); assert.equal(g.racers[0].boostReady, 9000);
  inputGame(g, 'ada', { type: 'race-reverse' }, 3000); inputGame(g, 'ada', { type: 'race-reverse' }, 3001); assert.equal(g.racers[0].reverseUntil, 5000);
});
test('parked obstacles block a moving 3D chassis through physics contacts', () => {
  const g = make('race3d', [players[0]]), obstacle = TRACK_OBSTACLES[0]; g.serveAt = 0;
  const body = reposition(g, 'ada', { x: obstacle.x, y: .6, z: obstacle.z - 5 }, { x: 0, y: 0, z: 15 }); body.setRotation(yawRotation(0), true);
  Object.assign(g.racers[0], pose(body)); g.racers[0].target = .5 - (obstacle.x - trackCenter(obstacle.z)) / 11;
  run(g, .8); assert.ok(body.translation().z < obstacle.z - 2.5); assert.ok(g.racers[0].speed < 3);
});
test('3D cars physically exchange impulses on contact', () => {
  const g = make('race3d'); g.serveAt = 99999;
  const a = reposition(g, 'ada', { x: 0, y: .6, z: 10 }, { x: 0, y: 0, z: 14 });
  const b = reposition(g, 'ege', { x: 0, y: .6, z: 14 }); a.setRotation(yawRotation(0), true); b.setRotation(yawRotation(0), true);
  const rt = physicsFor(g); for (let i = 0; i < 20; i++) rt.world.step();
  assert.ok(b.linvel().z > 1); assert.ok(a.linvel().z < 14);
});
test('disconnected 3D cars freeze and recover on reconnect', () => {
  const g = make('race3d'); run(g, 5); const before = { ...g.racers[0].position }; run(g, 1, 5000, ['ege']);
  assert.deepEqual(g.racers[0].position, before); assert.equal(physicsFor(g).bodies.get('ada').isEnabled(), false);
  run(g, .1, 6000); assert.equal(physicsFor(g).bodies.get('ada').isEnabled(), true);
});
test('3D checkpoints cannot be skipped and recovery returns to the last checkpoint', () => {
  const g = make('race3d', [players[0]]); g.serveAt = 0; const r = g.racers[0];
  let body = reposition(g, 'ada', { x: trackCenter(449), y: .6, z: 449 }, { x: 0, y: 0, z: 20 }); Object.assign(r, pose(body));
  run(g, .1); assert.equal(r.checkpoint, 0); assert.ok(!r.finished);
  r.checkpoint = 2; inputGame(g, 'ada', { type: 'race-reset' }, 200); body = physicsFor(g).bodies.get('ada'); assert.equal(body.translation().z, 295); assert.equal(r.checkpoint, 2); assert.equal(r.teleport, 1);
  inputGame(g, 'ada', { type: 'race-reset' }, 201); assert.equal(r.teleport, 1);
});
test('3D finish ranks use crossing time, then stop the race', () => {
  const g = make('race3d'); g.serveAt = 0;
  g.racers.forEach((r, i) => { const z = i ? 599.8 : 599.5; const body = reposition(g, r.id, { x: trackCenter(z) + (i ? 2 : -2), y: .6, z }, { x: 0, y: 0, z: 20 }); body.setRotation(yawRotation(trackHeading(z)), true); Object.assign(r, pose(body)); r.checkpoint = 3; });
  tickGame(g, .06, 60); assert.deepEqual(g.finishOrder, ['ege', 'ada']); assert.equal(g.scores.ege, 1000); assert.equal(g.scores.ada, 990); assert.equal(g.finished, true);
});
test('3D pauses freeze physics, reverse/boost clocks and pending billiard settling', () => {
  for (const id of ['pool3d', 'race3d']) {
    const g = make(id); if (id === 'pool3d') shoot(g); else inputGame(g, 'ada', { type: 'race-reverse' }, 3000);
    const rt = physicsFor(g), body = rt.bodies.values().next().value, before = pose(body);
    const room = { game: g, phase: 'playing', host: 'tv', paused: true, lastTick: 3000, players: players.map(p => ({ ...p, socket: p.id })) };
    advanceRoom(room, 8000); assert.deepEqual(pose(body), before);
    if (id === 'race3d') assert.equal(g.racers[0].reverseUntil, 10000); else assert.equal(g.shotAt, 5001);
    assert.equal(g.restSince ?? null, null);
  }
});
test('finished rooms free WASM resources; disposal is safe to repeat', () => {
  const g = make('pool3d'); const room = { game: g, phase: 'playing', host: 'tv', paused: false, lastTick: 0, players: players.map(p => ({ ...p, socket: p.id })) };
  advanceRoom(room, g.end); assert.equal(room.phase, 'results'); assert.equal(physicsFor(g), undefined); assert.doesNotThrow(() => disposeGame(g));
});
test('eight-player 3D snapshots stay finite and bounded with active physics', () => {
  const group = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}` }));
  for (const id of ['pool3d', 'race3d']) { const g = make(id, group); if (id === 'pool3d') shoot(g, 'p0'); run(g, 10);
    JSON.stringify(publicGame(g), (_key, value) => { if (typeof value === 'number') assert.ok(Number.isFinite(value)); return value; });
    assert.equal(Object.keys(g.scores).length, 8); assert.ok(JSON.stringify(publicGame(g)).length < 16000);
  }
});
test('Three.js pool camera contains the table; both scenes contain finite geometry and dispose it', () => {
  const pool = createPoolScene(), race = createRaceScene(players); pool.camera.updateMatrixWorld();
  for (const x of [-4.85, 4.85]) for (const z of [-2.45, 2.45]) { const p = new THREE.Vector3(x, .18, z).project(pool.camera); assert.ok(Math.abs(p.x) < 1 && Math.abs(p.y) < 1, JSON.stringify(p)); }
  for (const model of [pool, race]) { let geometries = 0, disposed = 0; const unique = new Set();
    model.scene.traverse(object => { if (!object.geometry || unique.has(object.geometry)) return; unique.add(object.geometry); geometries++; object.geometry.addEventListener('dispose', () => disposed++); for (const n of object.geometry.attributes.position.array) assert.ok(Number.isFinite(n)); });
    disposeScene(model.scene); assert.ok(geometries > 10); assert.equal(disposed, geometries); assert.equal(model.scene.children.length, 0);
  }
});
test('snapshot interpolation buffers packets, freezes on pause and rejects older data', () => {
  const buffer = new SnapshotBuffer(), state = t => ({ serverNow: t, pauseReason: null, game: { id: 'pool3d' } });
  buffer.push(state(1000), 0); buffer.push(state(1100), 100);
  let sample = buffer.sample(150); assert.equal(sample.before.serverNow, 1000); assert.equal(sample.after.serverNow, 1100); assert.equal(sample.alpha, .5);
  buffer.push(state(900), 200); assert.equal(buffer.frames.length, 2);
  buffer.push({ ...state(1200), pauseReason: 'manual' }, 200); sample = buffer.sample(210); assert.equal(sample.before.serverNow, 1200); assert.equal(sample.alpha, 1);
  for (let i = 0; i < 20; i++) buffer.push(state(1300 + i * 100), 300 + i * 100); assert.equal(buffer.frames.length, 8);
});
