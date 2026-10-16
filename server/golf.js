import { GOLF_COURSES, GOLF_LIMIT, golfMoving } from '../public/golf-courses.js';
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

function beginHole(g, now) {
  const course = GOLF_COURSES[g.round - 1];
  g.stage = 'putting'; g.stageEnd = now + 45000;
  g.golfers.forEach((b, i) => Object.assign(b, { x: course.tee.x, y: course.tee.y + (i - (g.ids.length - 1) / 2) * 12, vx: 0, vy: 0, strokes: 0, sunk: false }));
  g.notice = `${g.round}. parkur: ${course.name}. Herkes kendi topuyla oynar!`;
}

export function initGolf(g, now) {
  if (g.id !== 'golf') return;
  g.round = 1; g.finished = false;
  g.golfers = g.ids.map(id => ({ id, history: [] }));
  beginHole(g, now);
}

export function inputGolf(g, id, input, now) {
  if (g.id !== 'golf' || input.type !== 'putt' || g.stage !== 'putting' || input.round !== g.round || now >= g.stageEnd) return;
  if (!Number.isFinite(input.angle) || !Number.isFinite(input.power)) return;
  const b = g.golfers.find(b => b.id === id);
  if (b.sunk || b.strokes >= GOLF_LIMIT || golfMoving(b)) return;
  const angle = clamp(input.angle, -180, 180) * Math.PI / 180;
  const speed = 125 + clamp(input.power, .08, 1) * 900;
  b.vx = Math.cos(angle) * speed; b.vy = -Math.sin(angle) * speed; b.strokes++;
}

function wallCollision(b, wall) {
  const nearestX = clamp(b.x, wall.x, wall.x + wall.w), nearestY = clamp(b.y, wall.y, wall.y + wall.h);
  let dx = b.x - nearestX, dy = b.y - nearestY;
  const distance = Math.hypot(dx, dy);
  if (distance >= 9) return;
  if (distance > .001) {
    dx /= distance; dy /= distance;
    b.x += dx * (9 - distance); b.y += dy * (9 - distance);
  } else {
    const sides = [
      { d: b.x - wall.x, x: -1, y: 0 }, { d: wall.x + wall.w - b.x, x: 1, y: 0 },
      { d: b.y - wall.y, x: 0, y: -1 }, { d: wall.y + wall.h - b.y, x: 0, y: 1 },
    ];
    const side = sides.sort((a, b) => a.d - b.d)[0]; dx = side.x; dy = side.y;
    b.x += dx * (side.d + 9); b.y += dy * (side.d + 9);
  }
  const normalSpeed = b.vx * dx + b.vy * dy;
  if (normalSpeed < 0) { b.vx -= 1.8 * normalSpeed * dx; b.vy -= 1.8 * normalSpeed * dy; }
}

function endHole(g, now) {
  g.golfers.forEach(b => b.history.push({ strokes: b.strokes, sunk: b.sunk, points: b.sunk ? Math.max(10, 90 - b.strokes * 10) : 0 }));
  if (g.round === GOLF_COURSES.length) { g.stage = 'complete'; g.finished = true; g.notice = 'Üç parkur tamamlandı!'; }
  else { g.stage = 'break'; g.stageEnd = now + 2500; g.notice = 'Parkur bitti! Yeni parkur birazdan.'; }
}

export function tickGolf(g, dt, now, connected) {
  if (g.id !== 'golf') return;
  if (g.stage === 'break') {
    if (now >= g.stageEnd) { g.round++; beginHole(g, now); }
    return;
  }
  if (now >= g.stageEnd) { endHole(g, now); return; }
  const course = GOLF_COURSES[g.round - 1];
  const steps = Math.max(1, Math.ceil(dt * 120)), step = dt / steps;
  for (const b of g.golfers) {
    if (b.sunk || !golfMoving(b)) continue;
    for (let i = 0; i < steps; i++) {
      b.x += b.vx * step; b.y += b.vy * step;
      b.vx *= Math.exp(-1.2 * step); b.vy *= Math.exp(-1.2 * step);
      if (b.x < 49 || b.x > 951) { b.x = clamp(b.x, 49, 951); b.vx *= -.8; }
      if (b.y < 69 || b.y > 501) { b.y = clamp(b.y, 69, 501); b.vy *= -.8; }
      for (const wall of course.walls) wallCollision(b, wall);
      if (Math.hypot(b.x - course.cup.x, b.y - course.cup.y) < 17 && Math.hypot(b.vx, b.vy) < 200) {
        Object.assign(b, { x: course.cup.x, y: course.cup.y, vx: 0, vy: 0, sunk: true });
        g.scores[b.id] += Math.max(10, 90 - b.strokes * 10);
        break;
      }
      if (!golfMoving(b)) { b.vx = b.vy = 0; break; }
    }
  }
  const active = g.golfers.filter(b => connected.includes(b.id));
  if (active.length && active.every(b => b.sunk || b.strokes >= GOLF_LIMIT && !golfMoving(b))) endHole(g, now);
}
