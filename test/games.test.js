import test from 'node:test';
import assert from 'node:assert/strict';
import { GAMES, createGame, inputGame, tickGame, currentPlayer, publicGame } from '../server/games.js';

const players = [{ id: 'ada' }, { id: 'ege' }];
test('six games initialize and remain serializable through an entire round', () => {
  for (const meta of GAMES) {
    const g = createGame(meta.id, players, 0);
    for (let i = 0; i < meta.duration * 30; i++) tickGame(g, 1 / 30, i * 1000 / 30);
    JSON.stringify(publicGame(g), (_key, value) => {
      if (typeof value === 'number') assert.ok(Number.isFinite(value), `${meta.id}: non-finite state`);
      return value;
    });
    assert.equal(Object.keys(g.scores).length, 2);
  }
});
test('sling permits only the active player and one projectile at a time', () => {
  const g = createGame('sling', players, 0);
  inputGame(g, 'ege', { type: 'shoot', angle: 45, power: .35 }, 1);
  assert.equal(g.projectile, null);
  inputGame(g, 'ada', { type: 'shoot', angle: 45, power: .35 }, 1);
  const p = g.projectile;
  inputGame(g, 'ada', { type: 'shoot', angle: 80, power: 1 }, 2);
  assert.equal(g.projectile, p);
});
test('sling hits destroy blocks, award points and pass the turn', () => {
  const g = createGame('sling', players, 0);
  inputGame(g, 'ada', { type: 'shoot', angle: 45, power: .35 }, 1);
  for (let i = 1; i < 160; i++) tickGame(g, 1 / 30, i * 1000 / 30);
  assert.ok(g.scores.ada > 0);
  assert.ok(g.blocks.some(b => !b.alive));
  assert.equal(currentPlayer(g), 'ege');
});
test('shot angle and power are clamped for malformed inputs', () => {
  const g = createGame('sling', players, 0);
  inputGame(g, 'ada', { type: 'shoot', angle: 'nonsense', power: Infinity }, 1);
  assert.ok(Number.isFinite(g.projectile.vx));
  assert.ok(Number.isFinite(g.projectile.vy));
});
test('inactive turns and disconnected players do not hold the game', () => {
  const g = createGame('sling', players, 0);
  tickGame(g, .03, 16001);
  assert.equal(currentPlayer(g), 'ege');
  tickGame(g, .03, 16002, ['ada']);
  assert.equal(currentPlayer(g), 'ada');
});
test('archery gives points on a hit without eliminating the target', () => {
  const g = createGame('archery', players, 0); const target = g.archers[1];
  g.projectile = { x: target.x, y: target.y - 22, vx: 0, vy: 0, owner: 'ada', age: 0 };
  tickGame(g, .001, 1);
  assert.equal(g.scores.ada, 25); assert.equal(g.archers.length, 2); assert.equal(g.projectile, null);
});
test('snake collects apples and awards points', () => {
  const g = createGame('snake', players, 0); g.apples = [{ x: 4, y: 4 }];
  tickGame(g, .15, 150);
  assert.equal(g.scores.ada, 10);
});
test('snake cannot reverse into its body and respawns on collision', () => {
  const g = createGame('snake', players, 0); const s = g.snakes[0];
  s.body = [{ x: 31, y: 4 }, { x: 30, y: 4 }, { x: 29, y: 4 }];
  inputGame(g, 'ada', { type: 'direction', direction: 'left' });
  assert.deepEqual(s.next, { x: 1, y: 0 });
  tickGame(g, .15, 150);
  assert.deepEqual(s.body, [{ x: 3, y: 4 }]);
});
test('pong removes hit bricks and returns missed balls to play', () => {
  const g = createGame('pong', players, 0); const l = g.lanes[0];
  l.ball = { x: .1, y: .14, vx: 0, vy: -.1 }; tickGame(g, .01, 10);
  assert.equal(g.scores.ada, 10); assert.equal(l.bricks[0].alive, false);
  l.ball.y = 1.1; tickGame(g, .01, 20); assert.equal(l.ball.y, .65);
});
test('pong paddle input affects only its owner and stays in bounds', () => {
  const g = createGame('pong', players, 0);
  inputGame(g, 'ada', { type: 'paddle', x: 50 });
  assert.equal(g.lanes[0].paddle, .88); assert.equal(g.lanes[1].paddle, .5);
});
test('drawing word and private controller data never enter public snapshots', () => {
  const g = createGame('draw', players, 0);
  const snapshot = publicGame(g);
  assert.equal(snapshot.word, undefined); assert.equal(snapshot.inputs, undefined);
  assert.ok(typeof g.word === 'string');
});
test('only the drawer can add or clear strokes; coordinates are constrained', () => {
  const g = createGame('draw', players, 0);
  inputGame(g, 'ege', { type: 'stroke', x: 1, y: 1 }); assert.equal(g.strokes.length, 0);
  inputGame(g, 'ada', { type: 'stroke', x: -4, y: 30, start: true });
  assert.deepEqual(g.strokes[0], { x: 0, y: 1, start: true });
  inputGame(g, 'ege', { type: 'clear' }); assert.equal(g.strokes.length, 1);
  inputGame(g, 'ada', { type: 'clear' }); assert.equal(g.strokes.length, 0);
});
test('correct guesses normalize Turkish case and award points once', () => {
  const g = createGame('draw', players, 0); g.word = 'şemsiye';
  inputGame(g, 'ada', { type: 'guess', text: 'şemsiye' }); assert.equal(g.scores.ada, 0);
  inputGame(g, 'ege', { type: 'guess', text: ' ŞEMSİYE ' });
  inputGame(g, 'ege', { type: 'guess', text: 'şemsiye' });
  assert.equal(g.scores.ege, 30); assert.equal(g.scores.ada, 15); assert.equal(g.guesses[0].text, 'Doğru bildi! ✨');
});
test('drawing advances when everyone guesses, resets strokes and rotates drawer', () => {
  const g = createGame('draw', players, 0);
  inputGame(g, 'ege', { type: 'guess', text: g.word }); tickGame(g, .03, 500);
  assert.equal(currentPlayer(g), 'ege'); assert.equal(g.round, 2); assert.deepEqual(g.guessed, []);
});
test('new spectators cannot control an active game', () => {
  const g = createGame('draw', players, 0);
  inputGame(g, 'guest', { type: 'guess', text: g.word }); assert.equal(g.scores.guest, undefined);
});
test('balance rewards the entire team and resets a fallen ball', () => {
  const g = createGame('balance', players, 0);
  Object.assign(g.ball, g.target); tickGame(g, .01, 1);
  assert.equal(g.stars, 1); assert.deepEqual(g.scores, { ada: 20, ege: 20 });
  Object.assign(g.ball, g.holes[0]); tickGame(g, .01, 2);
  assert.equal(g.ball.x, 500); assert.equal(g.ball.y, 300);
});
test('balance ignores stale inputs and disconnected controllers', () => {
  const g = createGame('balance', players, 0);
  inputGame(g, 'ada', { type: 'tilt', x: 1, y: 0 }, 0); tickGame(g, .03, 1500);
  assert.equal(g.ball.vx, 0);
  inputGame(g, 'ada', { type: 'tilt', x: 1, y: 0 }, 1500); tickGame(g, .03, 1501, ['ege']);
  assert.equal(g.ball.vx, 0);
});
test('all game engines support eight players', () => {
  const group = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}` }));
  for (const meta of GAMES) { const g = createGame(meta.id, group, 0); for (let i = 0; i < 60; i++) tickGame(g, 1 / 30, i * 1000 / 30); assert.equal(Object.keys(g.scores).length, 8); }
});
