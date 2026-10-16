const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function spawn(g, now) {
  const serial = ++g.targetSerial, roll = Math.random();
  g.targets.push({ serial, x: 130 + Math.random() * 740, y: 110 + Math.random() * 270, vx: (serial % 2 ? 1 : -1) * (30 + (now - g.start) / 1200), radius: roll < .2 ? 22 : 34, kind: roll < .2 ? 'gold' : roll < .35 ? 'shield' : 'drone', expiresAt: now + 2600, hitBy: [] });
}
export function initLaser(g, now) {
  if (g.id !== 'laser') return;
  g.shooters = g.ids.map(id => ({ id, x: 500, y: 280, ammo: 5, readyAt: now, reloadAt: 0, flashUntil: now, hits: 0, shots: 0 }));
  g.targetSerial = 0; g.targets = []; g.spawnAt = now + 650; spawn(g, now);
  g.notice = 'Drone +10, altın +25; yeşil kalkan −5. Nişan al, lazeri ateşle!';
}
export function inputLaser(g, id, input, now) {
  if (g.id !== 'laser') return;
  const p = g.shooters.find(p => p.id === id);
  if (input.type === 'laser-aim' && Number.isFinite(input.x) && Number.isFinite(input.y)) { p.x = clamp(input.x, 60, 940); p.y = clamp(input.y, 60, 460); }
  if (input.type === 'laser-reload' && !p.reloadAt && p.ammo < 5) p.reloadAt = now + 1200;
  if (input.type !== 'laser-fire' || p.reloadAt || now < p.readyAt || p.ammo === 0) return;
  p.ammo--; p.shots++; p.readyAt = now + 300; p.flashUntil = now + 150;
  const target = g.targets.filter(t => now < t.expiresAt && !t.hitBy.includes(id) && Math.hypot(t.x - p.x, t.y - p.y) <= t.radius).sort((a, b) => b.serial - a.serial)[0];
  if (target) { target.hitBy.push(id); const points = target.kind === 'shield' ? -5 : target.kind === 'gold' ? 25 : 10; g.scores[id] = Math.max(0, g.scores[id] + points); if (points > 0) p.hits++; }
  if (p.ammo === 0) p.reloadAt = now + 1200;
}
export function tickLaser(g, dt, now) {
  if (g.id !== 'laser') return;
  g.shooters.forEach(p => { if (p.reloadAt && now >= p.reloadAt) { p.ammo = 5; p.reloadAt = 0; } });
  g.targets = g.targets.filter(t => now < t.expiresAt);
  for (const t of g.targets) { t.x += t.vx * dt; if (t.x < 100 || t.x > 900) { t.x = clamp(t.x, 100, 900); t.vx *= -1; } }
  if (now >= g.spawnAt) { spawn(g, now); g.spawnAt = now + 650; }
}
