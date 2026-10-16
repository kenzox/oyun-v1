import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, inputGame, tickGame, publicGame } from '../server/games.js';
import { advanceRoom } from '../server/session.js';
import { raceObstacle, RACE_LENGTH } from '../public/arcade-rules.js';
const players = [{ id: 'ada' }, { id: 'ege' }];
const make = id => createGame(id, players, 0);
const run = (g, ms, from = 0, connected = g.ids) => { for (let t = from + 10; t <= from + ms; t += 10) tickGame(g, .01, t, connected); };
const shot = (g, id = 'ada', fields = {}, now = 1) => inputGame(g, id, { type: 'pool-shot', angle: 0, power: .6, round: g.round, ...fields }, now);

test('race steering is bounded, belongs to its sender and rejects invalid values', () => {
  const g = make('race'); inputGame(g, 'ada', { type: 'race-steer', x: 10 }, 1);
  assert.equal(g.racers[0].target, .92); assert.equal(g.racers[1].target, .5);
  inputGame(g, 'ada', { type: 'race-steer', x: NaN }, 2); inputGame(g, 'guest', { type: 'race-steer', x: 0 }, 2);
  assert.equal(g.racers[0].target, .92); assert.equal(g.racers.length, 2);
});
test('race turbo cannot be spammed and braking slows a car', () => {
  const g = make('race'), r = g.racers[0]; inputGame(g, 'ada', { type: 'race-boost' }, 1);
  inputGame(g, 'ada', { type: 'race-boost' }, 1000); assert.equal(r.boostReady, 6001);
  run(g, 1300); assert.ok(r.speed > 76);
  inputGame(g, 'ada', { type: 'race-brake', on: true }, 1301); run(g, 500, 1300); assert.equal(r.speed, 32);
  inputGame(g, 'ada', { type: 'race-brake', on: false }, 1801); run(g, 100, 1800); assert.ok(r.speed > 32);
});
test('race collision slows only the car in that lane, with a recovery window', () => {
  const g = make('race'), o = raceObstacle(0, g.seed);
  for (const r of g.racers) { r.distance = o.distance - 1; r.speed = 76; }
  g.racers[0].x = g.racers[0].target = o.lane;
  g.racers[1].x = g.racers[1].target = o.lane < .5 ? .9 : .1;
  tickGame(g, .03, 30);
  assert.equal(g.racers[0].speed, 18); assert.equal(g.racers[0].crashUntil, 1230); assert.equal(g.racers[1].speed, 76);
  assert.equal(g.racers[0].nextRow, 1);
});
test('disconnected racers freeze, and crossing time decides finishing order', () => {
  const g = make('race'); run(g, 500, 0, ['ada']); assert.equal(g.racers[1].distance, 0);
  Object.assign(g.racers[0], { distance: 2999, speed: 76, nextRow: 100 });
  Object.assign(g.racers[1], { distance: 2999.5, speed: 76, nextRow: 100 });
  tickGame(g, .03, 530);
  assert.deepEqual(g.finishOrder, ['ege', 'ada']); assert.equal(g.scores.ege, 4000); assert.equal(g.scores.ada, 3900); assert.equal(g.finished, true);
});
test('simultaneous race finishes tie; a sole finisher starts a bounded grace period', () => {
  const tied = make('race'); tied.racers.forEach(r => Object.assign(r, { distance: 2999, speed: 76, nextRow: 100 }));
  tickGame(tied, .03, 30); assert.equal(tied.scores.ada, tied.scores.ege); assert.equal(tied.racers[1].place, 1);
  const g = make('race'); Object.assign(g.racers[0], { distance: 2999, speed: 76, nextRow: 100 }); tickGame(g, .03, 30);
  assert.equal(g.raceEnd, 12030); assert.ok(!g.finished); tickGame(g, .03, 12030); assert.equal(g.finished, true);
  assert.ok(g.scores.ada > g.scores.ege); assert.equal(g.racers[0].distance, RACE_LENGTH);
});
test('pool rejects out-of-turn, stale, expired and non-finite shots', () => {
  const g = make('pool'); shot(g, 'ege'); shot(g, 'ada', { round: 99 }); shot(g, 'ada', { angle: NaN }); shot(g, 'ada', {}, 20000);
  assert.equal(g.rolling, false); shot(g); assert.equal(g.rolling, true);
  const vx = g.balls[0].vx; shot(g, 'ada', { angle: 90 }); assert.equal(g.balls[0].vx, vx);
});
test('pool fast cue transfers momentum to a ball instead of tunneling through it', () => {
  const g = make('pool'); g.balls = [g.balls[0], { number: 1, x: 295, y: 280, vx: 0, vy: 0, sunk: false }];
  shot(g, 'ada', { power: 1 }); tickGame(g, .06, 60);
  assert.ok(g.balls[1].vx > 650); assert.ok(g.balls[0].vx < 50);
});
test('pool pocket awards once and retains the turn only after balls settle', () => {
  const g = make('pool'); shot(g); g.balls.forEach(b => { b.vx = b.vy = 0; });
  Object.assign(g.balls[1], { x: 500, y: 101, vy: -10 }); tickGame(g, .03, 30);
  assert.equal(g.scores.ada, 10); assert.equal(g.turn, 0); assert.equal(g.round, 2); assert.equal(g.rolling, false);
  tickGame(g, .03, 60); assert.equal(g.scores.ada, 10);
});
test('pool scratch subtracts five, floors zero, respots clear of balls and passes turn', () => {
  for (const initial of [0, 20]) {
    const g = make('pool'); g.scores.ada = initial; shot(g);
    Object.assign(g.balls[0], { x: 500, y: 101, vx: 0, vy: -10 }); Object.assign(g.balls[1], { x: 260, y: 280 });
    tickGame(g, .03, 30); assert.equal(g.scores.ada, Math.max(0, initial - 5)); assert.equal(g.turn, 1);
    assert.equal(g.balls[0].sunk, false); assert.ok(Math.hypot(g.balls[0].x - g.balls[1].x, g.balls[0].y - g.balls[1].y) > 22);
  }
});
test('pool skips disconnected turns, expires idle turns, and waits for rolling shots', () => {
  const g = make('pool'); tickGame(g, .03, 1, ['ege']); assert.equal(g.turn, 1);
  tickGame(g, .03, 20001); assert.equal(g.turn, 0);
  shot(g, 'ada', {}, 20002); tickGame(g, .03, 20003, ['ege']); assert.equal(g.turn, 0);
  run(g, 12000, 20003, ['ege']); assert.equal(g.turn, 1);
});
test('pool reracks after the final colored ball and remains playable', () => {
  const g = make('pool'); g.balls.slice(2).forEach(b => { b.sunk = true; }); shot(g);
  Object.assign(g.balls[0], { vx: 0, vy: 0 }); Object.assign(g.balls[1], { x: 500, y: 101, vy: -10 });
  tickGame(g, .03, 30); assert.equal(g.scores.ada, 10); assert.equal(g.balls.filter(b => !b.sunk).length, 7);
  assert.equal(g.round, 2); shot(g, 'ada', {}, 31); assert.equal(g.rolling, true);
});
test('tennis creates balanced teams and permits movement during the serve countdown', () => {
  const g = createGame('tennis', Array.from({ length: 8 }, (_, i) => ({ id: `p${i}` })), 0);
  assert.equal(Object.values(g.teams).filter(t => t === 0).length, 4);
  const x = g.ball.x; inputGame(g, 'p0', { type: 'tennis-move', y: 100 }, 1); run(g, 500);
  assert.equal(g.ball.x, x); assert.equal(g.tennists[0].target, 470); assert.ok(g.tennists[0].y > g.tennists[0].homeY);
});
test('tennis returns a fast ball and a timed swing gives additional speed', () => {
  for (const strong of [false, true]) {
    const g = make('tennis'); g.serveAt = 0; const p = g.tennists[1];
    g.ball = { x: p.x - 8, y: p.y, vx: 500, vy: 0, lastTeam: 0 };
    if (strong) inputGame(g, 'ege', { type: 'tennis-swing' }, 1);
    tickGame(g, .04, 40); assert.ok(g.ball.vx < 0); assert.equal(Math.abs(g.ball.vx), strong ? 640 : 525); assert.equal(g.ball.lastTeam, 1);
  }
});
test('tennis disconnected players cannot return balls and missed balls score', () => {
  const g = make('tennis'); g.serveAt = 0; g.ball = { x: 830, y: 280, vx: 500, vy: 0, lastTeam: 0 };
  run(g, 250, 0, ['ada']); assert.equal(g.teamScores[0], 1); assert.equal(g.scores.ada, 1);
});
test('tennis out awards the opponent of the last hitter and ends at seven', () => {
  const g = make('tennis'); g.teamScores[1] = 6; g.serveAt = 0; g.ball = { x: 600, y: 71, vx: 300, vy: -250, lastTeam: 0 };
  tickGame(g, .03, 30); assert.equal(g.teamScores[1], 7); assert.equal(g.scores.ege, 7); assert.equal(g.finished, true);
  tickGame(g, .03, 60); assert.equal(g.teamScores[1], 7);
});
test('tennis validates direction and limits swing repeat rate', () => {
  const g = make('tennis'); g.serveAt = 0;
  inputGame(g, 'ada', { type: 'tennis-aim', angle: Infinity }, 1); assert.equal(g.tennists[0].aim, 0);
  inputGame(g, 'ada', { type: 'tennis-aim', angle: -5 }, 1); assert.equal(g.tennists[0].aim, -1);
  inputGame(g, 'ada', { type: 'tennis-swing' }, 1); inputGame(g, 'ada', { type: 'tennis-swing' }, 500); assert.equal(g.tennists[0].swingReady, 901);
});
const aimAt = (g, id, t, now) => inputGame(g, id, { type: 'laser-aim', x: t.x, y: t.y }, now);
test('laser target rewards each player once, and duplicate hits still consume ammo', () => {
  const g = make('laser'), t = g.targets[0]; t.kind = 'drone';
  for (const p of players) { aimAt(g, p.id, t, 1); inputGame(g, p.id, { type: 'laser-fire' }, 1); inputGame(g, p.id, { type: 'laser-fire' }, 301); }
  assert.deepEqual(g.scores, { ada: 10, ege: 10 }); assert.equal(t.hitBy.length, 2); assert.equal(g.shooters[0].ammo, 3);
});
test('laser fire cooldown and automatic reload enforce five-shot magazines', () => {
  const g = make('laser'), p = g.shooters[0]; inputGame(g, 'ada', { type: 'laser-fire' }, 1); inputGame(g, 'ada', { type: 'laser-fire' }, 2); assert.equal(p.ammo, 4);
  for (const now of [301, 601, 901, 1201]) inputGame(g, 'ada', { type: 'laser-fire' }, now);
  assert.equal(p.ammo, 0); assert.equal(p.reloadAt, 2401); inputGame(g, 'ada', { type: 'laser-fire' }, 2000); assert.equal(p.shots, 5);
  tickGame(g, .03, 2401); assert.equal(p.ammo, 5); assert.equal(p.reloadAt, 0);
});
test('laser manual reload blocks shots; repeated reload does not extend its timer', () => {
  const g = make('laser'), p = g.shooters[0]; inputGame(g, 'ada', { type: 'laser-fire' }, 1);
  inputGame(g, 'ada', { type: 'laser-reload' }, 2); inputGame(g, 'ada', { type: 'laser-reload' }, 200); assert.equal(p.reloadAt, 1202);
  inputGame(g, 'ada', { type: 'laser-fire' }, 500); assert.equal(p.ammo, 4);
});
test('laser gold, shield penalties and expiration use server state', () => {
  const g = make('laser'), t = g.targets[0]; aimAt(g, 'ada', t, 1); t.kind = 'gold'; inputGame(g, 'ada', { type: 'laser-fire' }, 1); assert.equal(g.scores.ada, 25);
  t.hitBy = []; t.kind = 'shield'; inputGame(g, 'ada', { type: 'laser-fire' }, 301); assert.equal(g.scores.ada, 20);
  aimAt(g, 'ege', t, 301); inputGame(g, 'ege', { type: 'laser-fire' }, 301); assert.equal(g.scores.ege, 0);
  t.hitBy = []; t.expiresAt = 600; t.kind = 'gold'; inputGame(g, 'ada', { type: 'laser-fire' }, 601); assert.equal(g.scores.ada, 20);
});
test('laser aim is bounded and a full eight-player round keeps targets bounded', () => {
  const g = createGame('laser', Array.from({ length: 8 }, (_, i) => ({ id: `p${i}` })), 0);
  inputGame(g, 'p0', { type: 'laser-aim', x: -1, y: 1000 }, 1); assert.equal(g.shooters[0].x, 60); assert.equal(g.shooters[0].y, 460);
  inputGame(g, 'p0', { type: 'laser-aim', x: NaN, y: 200 }, 2); assert.equal(g.shooters[0].x, 60);
  for (let now = 30; now <= 90000; now += 30) { tickGame(g, .03, now); assert.ok(g.targets.length <= 5); for (const id of g.ids) { aimAt(g, id, g.targets[0], now); inputGame(g, id, { type: 'laser-fire' }, now); } }
  assert.ok(g.scores.p0 > 0); assert.equal(g.scores.p0, g.scores.p7);
});
test('pauses preserve race boosts, billiards shot deadlines, tennis swings and laser reloads', () => {
  for (const id of ['race', 'pool', 'tennis', 'laser']) {
    const g = make(id); inputGame(g, 'ada', { type: 'race-boost' }, 1); if (id === 'pool') shot(g);
    if (id === 'tennis') { g.serveAt = 0; inputGame(g, 'ada', { type: 'tennis-swing' }, 1); }
    if (id === 'laser') { inputGame(g, 'ada', { type: 'laser-fire' }, 1); inputGame(g, 'ada', { type: 'laser-reload' }, 2); }
    const before = structuredClone(publicGame(g));
    const room = { game: g, host: 'tv', phase: 'playing', paused: true, lastTick: 10, players: players.map(p => ({ ...p, socket: p.id })) };
    advanceRoom(room, 5010); assert.equal(g.end, before.end + 5000);
    if (id === 'race') { assert.equal(g.racers[0].distance, 0); assert.equal(g.racers[0].boostUntil, before.racers[0].boostUntil + 5000); assert.equal(g.raceEnd, null); }
    if (id === 'pool') { assert.equal(g.balls[0].x, before.balls[0].x); assert.equal(g.shotAt, before.shotAt + 5000); }
    if (id === 'tennis') { assert.equal(g.ball.x, before.ball.x); assert.equal(g.tennists[0].swingUntil, before.tennists[0].swingUntil + 5000); }
    if (id === 'laser') { assert.equal(g.shooters[0].reloadAt, before.shooters[0].reloadAt + 5000); assert.equal(g.targets[0].expiresAt, before.targets[0].expiresAt + 5000); }
  }
});
