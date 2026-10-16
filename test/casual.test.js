import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, inputGame, tickGame } from '../server/games.js';
import { advanceRoom } from '../server/session.js';
import { GOLF_COURSES, GOLF_LIMIT } from '../public/golf-courses.js';

const players = [{ id: 'ada', socket: 'a' }, { id: 'ege', socket: 'b' }];
const putt = (g, id = 'ada', overrides = {}, now = 1) => inputGame(g, id, { type: 'putt', angle: 0, power: .75, round: g.round, ...overrides }, now);
const whack = (g, id = 'ada', overrides = {}, now = 1) => inputGame(g, id, { type: 'whack', tile: 4, serial: g.moles[4].serial, ...overrides }, now);

test('golf default shot can finish the introductory hole and awards 80 points', () => {
  const g = createGame('golf', players, 0); putt(g);
  for (let i = 1; i <= 150; i++) tickGame(g, 1 / 30, i * 1000 / 30);
  assert.equal(g.golfers[0].sunk, true); assert.equal(g.scores.ada, 80); assert.equal(g.scores.ege, 0);
  assert.equal(g.round, 1); assert.equal(g.stage, 'putting');
});
test('golf allows simultaneous independent shots but no extra shot while moving', () => {
  const g = createGame('golf', players, 0); putt(g); putt(g, 'ege', { angle: 90 });
  const vx = g.golfers[0].vx;
  putt(g, 'ada', { angle: 180 });
  assert.equal(g.golfers[0].strokes, 1); assert.equal(g.golfers[0].vx, vx);
  assert.ok(g.golfers[1].vy < 0); assert.equal(g.golfers[1].strokes, 1);
});
test('golf rejects spectators, invalid numeric inputs, stale rounds and expired holes', () => {
  const g = createGame('golf', players, 0);
  putt(g, 'guest'); putt(g, 'ada', { angle: NaN }); putt(g, 'ada', { power: Infinity });
  putt(g, 'ada', { power: '0.75' }); putt(g, 'ada', { round: 0 }); putt(g, 'ada', {}, g.stageEnd);
  assert.equal(g.golfers[0].strokes, 0); assert.equal(g.scores.guest, undefined);
});
test('golf boundaries and course walls reflect fast balls without tunneling', () => {
  const g = createGame('golf', players, 0), b = g.golfers[0];
  Object.assign(b, { x: 950, y: 300, vx: 500, vy: 0, strokes: 1 });
  tickGame(g, .06, 60); assert.ok(b.vx < 0); assert.ok(b.x <= 951);
  g.round = 2;
  Object.assign(b, { x: 420, y: 300, vx: 1000, vy: 0 });
  tickGame(g, .06, 120); assert.ok(b.vx < 0); assert.ok(b.x <= 421);
});
test('golf fast balls pass over the hole; slow balls sink only once', () => {
  const g = createGame('golf', players, 0), b = g.golfers[0], cup = GOLF_COURSES[0].cup;
  Object.assign(b, { x: cup.x - 10, y: cup.y, vx: 600, vy: 0, strokes: 2 });
  tickGame(g, .03, 30); assert.equal(b.sunk, false); assert.equal(g.scores.ada, 0);
  Object.assign(b, { x: cup.x - 10, y: cup.y, vx: 30, vy: 0 });
  tickGame(g, .03, 60); assert.equal(b.sunk, true); assert.equal(g.scores.ada, 70);
  putt(g, 'ada', {}, 61); tickGame(g, .03, 90); assert.equal(g.scores.ada, 70); assert.equal(b.strokes, 2);
});
test('golf does not accept a ninth stroke but the eighth can still score', () => {
  const g = createGame('golf', players, 0), b = g.golfers[0], cup = GOLF_COURSES[0].cup;
  b.strokes = GOLF_LIMIT; putt(g); assert.equal(b.vx, 0); assert.equal(b.strokes, GOLF_LIMIT);
  Object.assign(b, { x: cup.x - 10, y: cup.y, vx: 30, vy: 0 });
  tickGame(g, .03, 30); assert.equal(g.scores.ada, 10);
});
test('golf timeout moves all players to the next hole and records missed holes', () => {
  const g = createGame('golf', players, 0); putt(g);
  tickGame(g, .03, 45000); assert.equal(g.stage, 'break'); assert.deepEqual(g.golfers[0].history[0], { strokes: 1, sunk: false, points: 0 });
  putt(g, 'ege', {}, 45001); assert.equal(g.golfers[1].strokes, 0);
  tickGame(g, .03, g.stageEnd); assert.equal(g.round, 2); assert.equal(g.stage, 'putting'); assert.equal(g.golfers[0].strokes, 0);
});
test('golf advances when all connected golfers finish, without waiting for disconnected phones', () => {
  const g = createGame('golf', players, 0), b = g.golfers[0], cup = GOLF_COURSES[0].cup;
  Object.assign(b, { x: cup.x - 10, y: cup.y, vx: 30, vy: 0, strokes: 1 });
  tickGame(g, .03, 30, ['ada']); assert.equal(g.stage, 'break'); assert.equal(b.history.length, 1);
});
test('golf ends after exactly three holes and cannot award more points afterwards', () => {
  const g = createGame('golf', players, 0);
  for (let hole = 1; hole <= 3; hole++) {
    tickGame(g, .03, g.stageEnd);
    if (hole < 3) tickGame(g, .03, g.stageEnd);
  }
  assert.equal(g.finished, true); assert.equal(g.round, 3); assert.equal(g.golfers[0].history.length, 3);
  const frozen = JSON.stringify(g); putt(g); tickGame(g, .03, 150000); assert.equal(JSON.stringify(g), frozen);
});
test('the same mole rewards each player independently, only once per appearance', () => {
  const g = createGame('moles', players, 0);
  whack(g); whack(g); whack(g, 'ege');
  assert.equal(g.scores.ada, 10); assert.equal(g.scores.ege, 10);
  assert.equal(g.moles[4].kind, 'mole');
});
test('golden moles reward 25, flowers subtract five with a floor of zero', () => {
  const g = createGame('moles', players, 0); g.moles[4].kind = 'star'; whack(g);
  assert.equal(g.scores.ada, 25);
  g.moles[4] = { kind: 'flower', serial: 99, expiresAt: 1000 };
  whack(g); whack(g, 'ege'); assert.equal(g.scores.ada, 20); assert.equal(g.scores.ege, 0);
});
test('moles reject expired appearances, old serial numbers and invalid cells', () => {
  const g = createGame('moles', players, 0);
  whack(g, 'ada', {}, g.moles[4].expiresAt);
  whack(g, 'ada', { serial: 0 }); whack(g, 'guest');
  for (const tile of [-1, 9, 1.1, '4', null]) whack(g, 'ada', { tile });
  assert.equal(g.scores.ada, 0); assert.equal(g.scores.guest, undefined);
  g.moles[4] = { kind: 'mole', serial: 20, expiresAt: 3000 };
  whack(g, 'ada', { serial: 1 }); assert.equal(g.scores.ada, 0);
  whack(g); assert.equal(g.scores.ada, 10);
});
test('moles retire expired targets and keep claim state bounded for eight players', () => {
  const group = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}` }));
  const g = createGame('moles', group, 0); const serial = g.moles[4].serial;
  for (let now = 100; now <= 90000; now += 100) {
    tickGame(g, .1, now);
    g.moles.forEach((m, tile) => group.forEach(p => inputGame(g, p.id, { type: 'whack', tile, serial: m.serial }, now)));
  }
  assert.equal(g.moles.length, 9); assert.ok(g.moleSerial > serial);
  for (const claims of Object.values(g.claims)) assert.equal(claims.length, 9);
  assert.ok(Object.values(g.scores).every(score => score === g.scores.p0));
});
test('pausing preserves golf flight and both games’ deadlines', () => {
  const room = id => ({ host: 'tv', paused: true, phase: 'playing', players, game: createGame(id, players, 0), lastTick: 0 });
  const golf = room('golf'); putt(golf.game); const x = golf.game.golfers[0].x;
  advanceRoom(golf, 20000); assert.equal(golf.game.golfers[0].x, x); assert.equal(golf.game.stageEnd, 65000);
  const moles = room('moles'), expiresAt = moles.game.moles[4].expiresAt;
  advanceRoom(moles, 20000); assert.equal(moles.game.moles[4].expiresAt, expiresAt + 20000); assert.equal(moles.game.spawnAt, 20700);
  moles.paused = false; advanceRoom(moles, 20030); assert.equal(moles.game.moles[4].kind, 'mole');
});
