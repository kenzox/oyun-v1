const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function serve(g, now) {
  g.serveAt = now + 1600;
  g.ball = { x: g.serveTeam === 0 ? 220 : 780, y: 280, vx: g.serveTeam === 0 ? 340 : -340, vy: 0, lastTeam: g.serveTeam };
  g.tennists.forEach(p => { p.swingUntil = now; p.swingReady = now; });
}
function point(g, team, now) {
  g.teamScores[team]++;
  g.ids.forEach(id => { g.scores[id] = g.teamScores[g.teams[id]]; });
  g.notice = `${team === 0 ? 'Mavi' : 'Mercan'} takım sayı aldı!`;
  g.serveTeam = 1 - team; serve(g, now);
  if (g.teamScores[team] >= 7) g.finished = true;
}
export function initTennis(g, now) {
  if (g.id !== 'tennis') return;
  g.teams = Object.fromEntries(g.ids.map((id, i) => [id, i % 2])); g.teamScores = [0, 0]; g.serveTeam = 0;
  const seats = [0, 0];
  g.tennists = g.ids.map(id => { const team = g.teams[id], seat = seats[team]++, count = g.ids.filter(id => g.teams[id] === team).length;
    const y = 80 + (seat + 1) * 400 / (count + 1);
    return { id, team, x: team === 0 ? 155 + seat * 55 : 845 - seat * 55, y, homeY: y, target: y, aim: 0, swingUntil: now, swingReady: now };
  });
  serve(g, now); g.notice = 'Topun hizasına geç. Vuruş otomatik; güçlü vuruş için zamanında dokun!';
}
export function inputTennis(g, id, input, now) {
  if (g.id !== 'tennis') return;
  const p = g.tennists.find(p => p.id === id);
  if (input.type === 'tennis-move' && Number.isFinite(input.y)) p.target = 90 + clamp(input.y, 0, 1) * 380;
  if (input.type === 'tennis-aim' && Number.isFinite(input.angle)) p.aim = clamp(input.angle, -1, 1);
  if (input.type === 'tennis-swing' && now >= g.serveAt && now >= p.swingReady) { p.swingUntil = now + 400; p.swingReady = now + 900; }
}
export function tickTennis(g, dt, now, connected) {
  if (g.id !== 'tennis') return;
  const active = g.tennists.filter(p => connected.includes(p.id));
  const steps = Math.max(1, Math.ceil(dt * 120)), step = dt / steps;
  for (let i = 0; i < steps; i++) {
    for (const p of active) p.y += clamp(p.target - p.y, -step * 360, step * 360);
    if (now < g.serveAt || g.finished) continue;
    const b = g.ball, oldX = b.x;
    b.x += b.vx * step; b.y += b.vy * step;
    const receiver = b.vx < 0 ? 0 : 1;
    const hit = active.filter(p => p.team === receiver).find(p => (oldX - p.x) * (b.x - p.x) <= 0 && Math.abs(b.y - p.y) < (now < p.swingUntil ? 64 : 44));
    if (hit) {
      const strong = now < hit.swingUntil, speed = strong ? 640 : Math.min(530, Math.abs(b.vx) + 25);
      b.vx = hit.team === 0 ? speed : -speed; b.vy = hit.aim * speed * .5; b.lastTeam = hit.team;
      b.x = hit.x + (hit.team === 0 ? 2 : -2); hit.swingUntil = now;
    }
    if (b.y < 70 || b.y > 490) { point(g, 1 - b.lastTeam, now); break; }
    if (b.x < 65 || b.x > 935) { point(g, b.x < 500 ? 1 : 0, now); break; }
  }
}
