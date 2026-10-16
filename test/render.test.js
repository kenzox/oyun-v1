import test from 'node:test';
import assert from 'node:assert/strict';
import { GAMES, createGame, publicGame } from '../server/games.js';
import { art, renderBoard } from '../public/render.js';

test('each game has complete shelf artwork and its public state can be drawn', () => {
  const players = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, color: '#b9ec72', avatar: i, name: `Oyuncu ${i}`, connected: true }));
  const context = new Proxy({}, {
    get: (_target, key) => key === 'createLinearGradient' ? () => ({ addColorStop() {} }) : (...args) => {
      for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), `${String(key)} received a non-finite coordinate`);
    },
    set: () => true,
  });
  const canvas = { width: 1000, height: 560, getContext: () => context };
  for (const meta of GAMES) {
    const svg = art(meta.id, meta.color);
    assert.ok(svg.startsWith('<svg')); assert.ok(svg.endsWith('</svg>')); assert.ok(!svg.includes('undefined'));
    const state = { players, game: publicGame(createGame(meta.id, players, 0)), serverNow: 0, pauseReason: null };
    renderBoard(canvas, state);
    state.pauseReason = 'manual'; renderBoard(canvas, state);
  }
});
