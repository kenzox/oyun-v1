const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
export const COURT_GAMES = ['volley', 'hockey'];

function resetRally(g, now) {
  g.serveAt = now + 1800;
  g.controls = {};
  g.athletes.forEach(p => { p.x = p.homeX; p.y = p.homeY; p.vx = p.vy = 0; p.target = p.homeX; });
  g.ball = g.id === 'volley'
    ? { x: g.serveTeam === 0 ? 250 : 750, y: 210, vx: g.serveTeam === 0 ? 300 : -300, vy: -180, touchCooldown: 0 }
    : { x: 500, y: 280, vx: g.serveTeam === 0 ? 220 : -220, vy: 60, touchCooldown: 0 };
}

export function initCourtGame(g, now) {
  if (!COURT_GAMES.includes(g.id)) return;
  g.teams = Object.fromEntries(g.ids.map((id, i) => [id, i % 2]));
  g.teamScores = [0, 0]; g.serveTeam = 0; g.finished = false;
  const seats = [0, 0];
  g.athletes = g.ids.map(id => {
    const team = g.teams[id], seat = seats[team]++;
    const count = g.ids.filter(id => g.teams[id] === team).length;
    const x = g.id === 'volley' ? 35 + (seat + 1) * 430 / (count + 1) + team * 500 : team === 0 ? 180 + seat % 2 * 80 : 820 - seat % 2 * 80;
    const y = g.id === 'volley' ? 472 : 80 + (seat + 1) * 400 / (count + 1);
    return { id, team, x, y, homeX: x, homeY: y, target: x, vx: 0, vy: 0 };
  });
  resetRally(g, now);
  g.notice = 'Mavi ve mercan takımlar hazır! İlk 7 sayıya ulaşan kazanır.';
}

export function inputCourtGame(g, id, input, now) {
  if (!COURT_GAMES.includes(g.id)) return;
  const p = g.athletes.find(p => p.id === id);
  if (g.id === 'volley') {
    if (input.type === 'position') p.target = 35 + clamp(input.x, 0, 1) * 430 + p.team * 500;
    if (input.type === 'jump' && p.y >= 471) p.vy = -480;
  }
  if (g.id === 'hockey' && input.type === 'skate') g.controls[id] = { x: clamp(input.x, -1, 1), y: clamp(input.y, -1, 1), at: now };
}

function point(g, team, now) {
  g.teamScores[team]++;
  g.ids.forEach(id => { g.scores[id] = g.teamScores[g.teams[id]]; });
  g.notice = `${team === 0 ? 'Mavi' : 'Mercan'} takım sayı aldı!`;
  g.serveTeam = 1 - team;
  resetRally(g, now);
  if (g.teamScores[team] >= 7) g.finished = true;
}

export function tickCourtGame(g, dt, now, connected) {
  if (!COURT_GAMES.includes(g.id) || now < g.serveAt) return;
  // Small physics steps keep fast pucks and balls from passing through players.
  const steps = Math.max(1, Math.ceil(dt / (1 / 120))), step = dt / steps;
  for (let i = 0; i < steps; i++) {
    if (g.finished || now < g.serveAt) break;
    const b = g.ball; b.touchCooldown = Math.max(0, b.touchCooldown - step);
    const active = g.athletes.filter(p => connected.includes(p.id));
    if (g.id === 'volley') {
      for (const p of active) {
        p.x += clamp(p.target - p.x, -300 * step, 300 * step);
        p.vy += 1000 * step; p.y += p.vy * step;
        if (p.y >= 472) { p.y = 472; p.vy = 0; }
      }
      const oldX = b.x, oldY = b.y;
      b.vy += 700 * step; b.x += b.vx * step; b.y += b.vy * step;
      if (b.x < 16 || b.x > 984) { b.x = clamp(b.x, 16, 984); b.vx *= -1; }
      if (b.y < 16) { b.y = 16; b.vy = Math.abs(b.vy); }
      if (Math.abs(b.x - 500) < 22 && b.y + 16 > 330) {
        if (oldY + 16 <= 330) { b.y = 314; b.vy = -Math.abs(b.vy) * .8; }
        else { b.x = oldX < 500 ? 478 : 522; b.vx = oldX < 500 ? -Math.abs(b.vx) : Math.abs(b.vx); }
      }
      const hit = active.find(p => Math.hypot(b.x - p.x, b.y - p.y) < 41 && b.y < p.y + 10);
      if (hit && b.touchCooldown <= 0) {
        b.vx = (hit.team === 0 ? 270 : -270) + clamp((b.x - hit.x) * 3, -100, 100);
        b.vy = -580; b.y = hit.y - 42; b.touchCooldown = .15;
      }
      if (b.y > 484) point(g, b.x < 500 ? 1 : 0, now);
    } else {
      for (const p of active) {
        const control = g.controls[p.id];
        const fresh = control && now - control.at < 350;
        const x = fresh ? control.x : 0, y = fresh ? control.y : 0;
        const length = Math.max(1, Math.hypot(x, y));
        p.vx = (p.vx + x / length * 900 * step) * Math.exp(-3 * step);
        p.vy = (p.vy + y / length * 900 * step) * Math.exp(-3 * step);
        p.x = clamp(p.x + p.vx * step, 42, 958); p.y = clamp(p.y + p.vy * step, 78, 482);
      }
      b.x += b.vx * step; b.y += b.vy * step;
      b.vx *= Math.exp(-.12 * step); b.vy *= Math.exp(-.12 * step);
      if (b.y < 68 || b.y > 492) { b.y = clamp(b.y, 68, 492); b.vy *= -1; }
      if (b.x < 28 || b.x > 972) {
        if (b.y > 222 && b.y < 338) { point(g, b.x < 500 ? 1 : 0, now); continue; }
        b.x = clamp(b.x, 28, 972); b.vx *= -1;
      }
      const hit = active.find(p => Math.hypot(b.x - p.x, b.y - p.y) < 35);
      if (hit && b.touchCooldown <= 0) {
        let dx = b.x - hit.x, dy = b.y - hit.y;
        const length = Math.hypot(dx, dy);
        if (length < .01) { dx = hit.team === 0 ? 1 : -1; dy = 0; } else { dx /= length; dy /= length; }
        const speed = Math.min(650, Math.max(260, Math.hypot(hit.vx, hit.vy) * 1.8));
        b.x = hit.x + dx * 36; b.y = hit.y + dy * 36;
        b.vx = dx * speed; b.vy = dy * speed; b.touchCooldown = .1;
      }
    }
  }
}
