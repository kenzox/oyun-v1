import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, inputGame, tickGame, publicGame } from '../server/games.js';
import { advanceRoom, pauseReason } from '../server/session.js';
import { riverBanks } from '../public/game-geometry.js';

const players = [{ id: 'ada', socket: 'a' }, { id: 'ege', socket: 'b' }];
const memory = () => {
  const g = createGame('memory', players, 0);
  const now = g.stageEnd;
  tickGame(g, .03, now);
  return { g, now };
};

test('memory reveals individual tiles during preview, never the complete pattern', () => {
  const g = createGame('memory', players, 0);
  tickGame(g, .03, 550);
  assert.equal(g.activeTile, g.pattern[0]);
  assert.equal(publicGame(g).pattern, undefined);
  inputGame(g, 'ada', { type: 'memory-tap', tile: g.pattern[0], round: 1 }, 600);
  assert.equal(g.progress.ada, 0);
});
test('memory credits a correct sequence only once and does not reveal answers', () => {
  const { g, now } = memory();
  for (const tile of g.pattern) inputGame(g, 'ada', { type: 'memory-tap', tile, round: 1 }, now + 1);
  assert.equal(g.outcomes.ada, 'correct'); assert.equal(g.scores.ada, g.sequenceLength * 10);
  inputGame(g, 'ada', { type: 'memory-tap', tile: g.pattern[0], round: 1 }, now + 2);
  assert.equal(g.scores.ada, g.sequenceLength * 10); assert.equal(publicGame(g).pattern, undefined);
});
test('memory mistakes lock only the current series, then everyone can play again', () => {
  const { g, now } = memory();
  inputGame(g, 'ada', { type: 'memory-tap', tile: (g.pattern[0] + 1) % 4, round: 1 }, now + 1);
  inputGame(g, 'ada', { type: 'memory-tap', tile: g.pattern[0], round: 1 }, now + 2);
  assert.equal(g.outcomes.ada, 'miss'); assert.equal(g.progress.ada, 0);
  tickGame(g, .03, g.stageEnd + 1); tickGame(g, .03, g.stageEnd + 1);
  assert.equal(g.round, 2); assert.equal(g.sequenceLength, 3); assert.deepEqual(g.outcomes, {});
});
test('memory ignores invalid, expired, spectator and previous-round inputs', () => {
  const { g, now } = memory();
  for (const tile of [-1, 4, .5, '0', null]) inputGame(g, 'ada', { type: 'memory-tap', tile, round: 1 }, now);
  inputGame(g, 'ada', { type: 'memory-tap', tile: g.pattern[0], round: 0 }, now);
  inputGame(g, 'guest', { type: 'memory-tap', tile: g.pattern[0], round: 1 }, now);
  inputGame(g, 'ada', { type: 'memory-tap', tile: g.pattern[0], round: 1 }, g.stageEnd);
  assert.equal(g.progress.ada, 0); assert.equal(g.progress.guest, undefined);
});
test('memory advances after connected players finish without waiting for disconnected players', () => {
  const { g, now } = memory();
  for (const tile of g.pattern) inputGame(g, 'ada', { type: 'memory-tap', tile, round: 1 }, now + 1);
  tickGame(g, .03, now + 2, ['ada']); assert.equal(g.stage, 'reveal'); assert.equal(g.outcomes.ege, 'timeout');
});
test('river course remains passable and changes as the level scrolls', () => {
  for (let distance = 0; distance < 20000; distance += 100) {
    const b = riverBanks(distance, 488);
    assert.ok(b.left > 0 && b.right < 1000); assert.ok(b.right - b.left >= 500);
  }
  assert.notDeepEqual(riverBanks(0, 488), riverBanks(1000, 488));
});
test('river steering is constrained and cannot control another player', () => {
  const g = createGame('river', players, 0), other = g.ships[1].target;
  inputGame(g, 'ada', { type: 'steer', x: 500 });
  assert.equal(g.ships[0].target, 960); assert.equal(g.ships[1].target, other);
  inputGame(g, 'guest', { type: 'steer', x: 0 }); assert.equal(g.ships[0].target, 960);
});
test('river bank collisions cost one shared shield and grant temporary protection', () => {
  const g = createGame('river', players, 0); g.ships[0].x = g.ships[0].target = 10;
  tickGame(g, .01, 10); assert.equal(g.shields, 5); assert.equal(g.ships[0].protection, 2);
  g.ships[0].x = g.ships[0].target = 10;
  tickGame(g, .01, 20); assert.equal(g.shields, 5);
});
test('river shots hit targets and award both individual and team points', () => {
  const g = createGame('river', players, 0);
  g.enemies = [{ x: 0, lane: 0, kind: 'tank', y: 150, alive: true }, { x: 500, lane: 1, kind: 'plane', y: -100, alive: true }];
  const banks = riverBanks(g.distance, 150);
  g.shots = [{ x: banks.left + 35, y: 175, owner: 'ada' }];
  tickGame(g, .04, 40);
  assert.equal(g.enemies[0].alive, false); assert.equal(g.scores.ada, 10); assert.equal(g.teamScore, 10);
});
test('river finishing a stage restores one shield; running out ends the game', () => {
  const g = createGame('river', players, 0); g.enemies.forEach(e => { e.alive = false; }); g.shields = 4;
  tickGame(g, .01, 10); assert.equal(g.wave, 2); assert.equal(g.shields, 5);
  g.shields = 1; g.ships[0].x = g.ships[0].target = 10;
  tickGame(g, .01, 20); assert.equal(g.finished, true); assert.equal(g.shields, 0);
  const frozen = JSON.stringify(g); tickGame(g, .05, 100); inputGame(g, 'ada', { type: 'steer', x: .9 }, 100);
  assert.equal(JSON.stringify(g), frozen);
});
test('river disconnected ships do not fire or consume shields', () => {
  const g = createGame('river', players, 0); const s = g.ships[0]; s.x = s.target = 10; s.cooldown = 0;
  tickGame(g, .05, 50, ['ege']); assert.equal(g.shields, 6); assert.ok(g.shots.every(b => b.owner !== 'ada'));
});
test('court games split guests into balanced teams for two through eight players', () => {
  for (const id of ['volley', 'hockey']) for (let count = 2; count <= 8; count++) {
    const g = createGame(id, Array.from({ length: count }, (_, i) => ({ id: `p${i}` })), 0);
    const blue = Object.values(g.teams).filter(t => t === 0).length;
    assert.ok(Math.abs(blue - (count - blue)) <= 1);
  }
});
test('volleyball awards the opposing side a point and prepares a new serve', () => {
  const g = createGame('volley', players, 0); g.ball = { x: 80, y: 490, vx: 0, vy: 10, touchCooldown: 0 };
  tickGame(g, .01, 2000);
  assert.deepEqual(g.teamScores, [0, 1]); assert.equal(g.scores.ege, 1); assert.equal(g.serveAt, 3800);
});
test('volleyball jump cannot be repeated in mid-air, positions stay in own half', () => {
  const g = createGame('volley', players, 0);
  inputGame(g, 'ada', { type: 'position', x: 50 }, 2000); assert.equal(g.athletes[0].target, 465);
  inputGame(g, 'ada', { type: 'jump' }, 2000); tickGame(g, .05, 2050);
  const velocity = g.athletes[0].vy;
  inputGame(g, 'ada', { type: 'jump' }, 2050); assert.equal(g.athletes[0].vy, velocity);
});
test('volleyball net reflects balls instead of letting them pass through', () => {
  const g = createGame('volley', players, 0); g.ball = { x: 477, y: 390, vx: 300, vy: 0, touchCooldown: 0 };
  tickGame(g, .03, 2000); assert.ok(g.ball.vx < 0); assert.ok(g.ball.x < 500);
});
test('hockey goal mouth scores, side boards outside the goal reflect the puck', () => {
  const g = createGame('hockey', players, 0); g.ball = { x: 970, y: 280, vx: 300, vy: 0, touchCooldown: 0 };
  tickGame(g, .02, 2000); assert.deepEqual(g.teamScores, [1, 0]);
  g.ball = { x: 970, y: 150, vx: 300, vy: 0, touchCooldown: 0 };
  tickGame(g, .02, 4000); assert.deepEqual(g.teamScores, [1, 0]); assert.ok(g.ball.vx < 0);
});
test('hockey player contact hits the puck and joystick input expires', () => {
  const g = createGame('hockey', players, 0); const p = g.athletes[0];
  g.ball = { x: p.x + 30, y: p.y, vx: 0, vy: 0, touchCooldown: 0 };
  tickGame(g, .01, 2000); assert.ok(g.ball.vx > 0);
  inputGame(g, 'ada', { type: 'skate', x: 1, y: 0 }, 2000); tickGame(g, .05, 2050);
  const vx = p.vx; tickGame(g, .05, 2500); assert.ok(p.vx < vx);
  assert.equal(publicGame(g).controls, undefined);
});
test('court games stop at seven points and scores apply to every teammate', () => {
  const group = [...players, { id: 'guest' }, { id: 'guest2' }];
  const g = createGame('hockey', group, 0); g.teamScores[0] = 6;
  g.ball = { x: 970, y: 280, vx: 300, vy: 0, touchCooldown: 0 };
  tickGame(g, .02, 2000); assert.equal(g.finished, true);
  assert.equal(g.scores.ada, 7); assert.equal(g.scores.guest, 7); assert.equal(g.scores.ege, 0);
});

function room(id) { return { host: 'tv', paused: false, phase: 'playing', players: players.map(p => ({ ...p })), game: createGame(id, players, 0), lastTick: 0 }; }
test('manual pause freezes physics, game clock and memory preview deadlines', () => {
  const r = room('memory'); const end = r.game.end, previewEnd = r.game.stageEnd;
  r.paused = true; advanceRoom(r, 30000);
  assert.equal(pauseReason(r), 'manual'); assert.equal(r.game.tick, 0);
  assert.equal(r.game.end, end + 30000); assert.equal(r.game.stageEnd, previewEnd + 30000); assert.equal(r.game.activeTile, -1);
  r.paused = false; advanceRoom(r, 30030); assert.equal(r.game.tick, 1);
});
test('TV disconnect and loss of all participating phones pause the round', () => {
  const r = room('sling'); r.host = null; advanceRoom(r, 10000);
  assert.equal(pauseReason(r), 'host'); assert.equal(r.game.tick, 0);
  r.host = 'tv'; r.players.forEach(p => { p.socket = null; }); r.players.push({ id: 'spectator', socket: 'c' });
  advanceRoom(r, 20000); assert.equal(pauseReason(r), 'players'); assert.equal(r.game.tick, 0);
  r.players[0].socket = 'a'; advanceRoom(r, 20030); assert.equal(pauseReason(r), null); assert.equal(r.game.tick, 1);
});
test('pause extends court serve time and discards stale joystick input', () => {
  const r = room('hockey'); inputGame(r.game, 'ada', { type: 'skate', x: 1, y: 0 }, 0);
  r.paused = true; advanceRoom(r, 1000);
  assert.equal(r.game.serveAt, 2800); assert.deepEqual(r.game.controls, {});
});
test('finished rounds and expired clocks transition to results', () => {
  const r = room('river'); r.game.finished = true; advanceRoom(r, 10); assert.equal(r.phase, 'results');
  const other = room('memory'); advanceRoom(other, other.game.end + 1); assert.equal(other.phase, 'results');
});
