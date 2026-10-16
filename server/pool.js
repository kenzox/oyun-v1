import { POOL_POCKETS, POOL_RADIUS as R, poolMoving } from '../public/arcade-rules.js';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function rack(g) {
  g.balls = [{ number: 0, x: 260, y: 280, vx: 0, vy: 0, sunk: false }];
  for (let row = 0; row < 3; row++) for (let col = 0; col <= row; col++) g.balls.push({ number: g.balls.length, x: 660 + row * 21, y: 280 + (col - row / 2) * 24, vx: 0, vy: 0, sunk: false });
}
function respot(g) {
  const cue = g.balls[0];
  for (let x = 260; x <= 900; x += 30) for (let y = 280; y <= 430; y += 30) {
    if (g.balls.slice(1).every(b => b.sunk || Math.hypot(b.x - x, b.y - y) > R * 2 + 2)) { Object.assign(cue, { x, y, vx: 0, vy: 0, sunk: false }); return; }
  }
}
function next(g, now, connected, retain = false) {
  if (!retain || !connected.includes(g.ids[g.turn])) {
    for (let i = 1; i <= g.ids.length; i++) { const index = (g.turn + i) % g.ids.length; if (connected.includes(g.ids[index])) { g.turn = index; break; } }
  }
  g.round++; g.turnAt = now; g.aim = { angle: 0, power: .6 };
}
export function initPool(g) {
  if (g.id !== 'pool') return;
  rack(g); g.round = 1; g.rolling = false; g.aim = { angle: 0, power: .6 }; g.shotPockets = 0; g.scratch = false;
  g.notice = 'Renkli top +10, beyaz top −5. Top sokarsan sıra sende kalır.';
}
export function inputPool(g, id, input, now) {
  if (g.id !== 'pool' || id !== g.ids[g.turn] || g.rolling || now - g.turnAt >= 20000 || input.round !== g.round) return;
  if (!['pool-aim', 'pool-shot'].includes(input.type) || !Number.isFinite(input.angle) || !Number.isFinite(input.power)) return;
  g.aim = { angle: clamp(input.angle, -180, 180), power: clamp(input.power, .08, 1) };
  if (input.type === 'pool-aim') return;
  const angle = g.aim.angle * Math.PI / 180, speed = 120 + g.aim.power * 680;
  Object.assign(g.balls[0], { vx: Math.cos(angle) * speed, vy: -Math.sin(angle) * speed });
  g.rolling = true; g.shotPockets = 0; g.scratch = false; g.shotAt = now;
}
export function tickPool(g, dt, now, connected) {
  if (g.id !== 'pool') return;
  if (!g.rolling) {
    if (now - g.turnAt >= 20000 || !connected.includes(g.ids[g.turn])) next(g, now, connected);
    return;
  }
  const steps = Math.max(1, Math.ceil(dt * 240)), step = dt / steps;
  for (let s = 0; s < steps; s++) {
    for (const b of g.balls.filter(b => !b.sunk)) {
      b.x += b.vx * step; b.y += b.vy * step;
      const speed = Math.hypot(b.vx, b.vy), factor = speed > 3 ? Math.max(0, speed - 95 * step) / speed : 0;
      b.vx *= factor; b.vy *= factor;
      if (POOL_POCKETS.some(p => Math.hypot(b.x - p.x, b.y - p.y) < 25)) {
        b.sunk = true; b.vx = b.vy = 0;
        if (b.number === 0) g.scratch = true; else g.shotPockets++;
        continue;
      }
      if (b.x < 60 + R || b.x > 940 - R) { b.x = clamp(b.x, 60 + R, 940 - R); b.vx *= -.9; }
      if (b.y < 90 + R || b.y > 470 - R) { b.y = clamp(b.y, 90 + R, 470 - R); b.vy *= -.9; }
    }
    const active = g.balls.filter(b => !b.sunk);
    for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j]; const distance = Math.hypot(b.x - a.x, b.y - a.y);
      if (distance >= R * 2) continue;
      const nx = distance > .001 ? (b.x - a.x) / distance : 1, ny = distance > .001 ? (b.y - a.y) / distance : 0;
      const overlap = (R * 2 - distance) / 2 + .01;
      a.x -= nx * overlap; a.y -= ny * overlap; b.x += nx * overlap; b.y += ny * overlap;
      const impact = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (impact > 0) { a.vx -= nx * impact * .98; a.vy -= ny * impact * .98; b.vx += nx * impact * .98; b.vy += ny * impact * .98; }
    }
  }
  if (!poolMoving(g) || now - g.shotAt >= 12000) {
    g.balls.forEach(b => { b.vx = b.vy = 0; }); g.rolling = false;
    const owner = g.ids[g.turn]; g.scores[owner] = Math.max(0, g.scores[owner] + g.shotPockets * 10 - (g.scratch ? 5 : 0));
    g.notice = g.scratch ? 'Beyaz top cepte: −5 puan ve sıra değişir.' : g.shotPockets ? `+${g.shotPockets * 10} puan! Bir vuruş daha.` : 'Sıra sonraki oyuncuda.';
    if (g.scratch) respot(g);
    if (g.balls.slice(1).every(b => b.sunk)) { rack(g); g.notice += ' Yeni masa hazır!'; }
    next(g, now, connected, g.shotPockets > 0 && !g.scratch);
  }
}
