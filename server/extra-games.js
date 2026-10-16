import { riverBanks } from '../public/game-geometry.js';
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const tile = () => Math.floor(Math.random() * 4);

function memoryRound(g, now) {
  const length = Math.min(8, g.round + 1);
  g.pattern = Array.from({ length }, tile);
  g.sequenceLength = length;
  g.stage = 'show';
  g.stageAt = now;
  g.stageEnd = now + 800 + length * 850;
  g.activeTile = -1;
  g.progress = Object.fromEntries(g.ids.map(id => [id, 0]));
  g.outcomes = {};
  g.notice = 'Gözler TV’de! Renklerin sırasını aklında tut.';
}

function riverWave(g) {
  const count = Math.min(30, 6 + g.ids.length * 2 + g.wave * 2);
  g.enemies = Array.from({ length: count }, (_, i) => ({
    x: 500, lane: i % 3, kind: i % 3 === 0 ? 'tank' : 'plane',
    y: -30 - i * 85, alive: true,
  }));
  g.enemyShots = [];
  g.waveTime = 0;
  g.enemyCooldown = 2;
  g.notice = `${g.wave}. etap! Kıyılardan kaçın, hedefleri vurun.`;
}

export function initExtraGame(g, now) {
  if (g.id === 'memory') {
    g.round = 1;
    memoryRound(g, now);
  }
  if (g.id === 'river') {
    Object.assign(g, { wave: 1, distance: 0, shields: 6, teamScore: 0, shots: [], finished: false });
    g.ships = g.ids.map((id, i) => ({ id, x: 300 + (i + 1) * 400 / (g.ids.length + 1), target: 300 + (i + 1) * 400 / (g.ids.length + 1), cooldown: .15 + i * .07, protection: 0 }));
    riverWave(g);
  }
}

export function inputExtraGame(g, id, input, now) {
  if (g.id === 'river' && input.type === 'steer') {
    g.ships.find(s => s.id === id).target = clamp(input.x, .04, .96) * 1000;
  }
  if (g.id === 'memory' && input.type === 'memory-tap' && input.round === g.round && g.stage === 'answer' && now < g.stageEnd && !g.outcomes[id]) {
    if (!Number.isInteger(input.tile) || input.tile < 0 || input.tile > 3) return;
    if (g.pattern[g.progress[id]] !== input.tile) {
      g.outcomes[id] = 'miss';
      return;
    }
    g.progress[id]++;
    if (g.progress[id] === g.pattern.length) {
      g.outcomes[id] = 'correct';
      g.scores[id] += g.pattern.length * 10;
    }
  }
}

export function tickExtraGame(g, dt, now, connected) {
  if (g.id === 'memory') {
    if (g.stage === 'show') {
      const elapsed = now - g.stageAt - 500;
      const index = Math.floor(elapsed / 850);
      g.activeTile = elapsed >= 0 && index < g.pattern.length && elapsed % 850 < 600 ? g.pattern[index] : -1;
      if (now >= g.stageEnd) {
        g.stage = 'answer'; g.stageAt = now; g.stageEnd = now + 6000 + g.pattern.length * 2000;
        g.activeTile = -1; g.notice = 'Şimdi telefondan aynı sıraya dokun.';
      }
    } else if (g.stage === 'answer') {
      const active = g.ids.filter(id => connected.includes(id));
      if (now >= g.stageEnd || (active.length > 0 && active.every(id => g.outcomes[id]))) {
        for (const id of g.ids) if (!g.outcomes[id]) g.outcomes[id] = 'timeout';
        g.stage = 'reveal'; g.stageAt = now; g.stageEnd = now + 2500;
        g.notice = 'Yeni sıra birazdan! Herkes yeniden deneyebilir.';
      }
    } else if (now >= g.stageEnd) {
      g.round++;
      memoryRound(g, now);
    }
  }
  if (g.id !== 'river') return;
  g.waveTime += dt;
  const speed = Math.min(160, 80 + g.wave * 8);
  g.distance += speed * dt;
  const active = g.ships.filter(s => connected.includes(s.id));
  for (const s of active) {
    s.x += clamp(s.target - s.x, -420 * dt, 420 * dt);
    s.protection = Math.max(0, s.protection - dt);
    const banks = riverBanks(g.distance, 488);
    if (s.protection <= 0 && (s.x - 20 < banks.left || s.x + 20 > banks.right)) {
      g.shields = Math.max(0, g.shields - 1); s.protection = 2;
      s.x = clamp(s.x, banks.left + 35, banks.right - 35); s.target = s.x;
      g.notice = 'Kıyıya çarptınız! Nehrin içinde kalın.';
    }
    s.cooldown -= dt;
    if (s.cooldown <= 0) {
      g.shots.push({ x: s.x, y: 470, owner: s.id });
      s.cooldown = .42;
    }
  }
  for (const enemy of g.enemies.filter(e => e.alive)) {
    enemy.y += dt * speed;
    const banks = riverBanks(g.distance, enemy.y);
    enemy.x = enemy.kind === 'tank' ? banks.left + 35 : banks.left + (banks.right - banks.left) * (enemy.lane + 1) / 4 + Math.sin(g.waveTime * 1.3) * 25;
    if (enemy.y >= 560) enemy.alive = false;
  }
  for (const shot of g.shots) {
    const previousY = shot.y;
    shot.y -= dt * 680;
    const hit = g.enemies.find(e => e.alive && Math.abs(e.x - shot.x) < 28 && e.y + 20 >= shot.y && e.y - 20 <= previousY);
    if (hit) { hit.alive = false; shot.y = -100; g.scores[shot.owner] += 10; g.teamScore += 10; }
  }
  g.shots = g.shots.filter(s => s.y > -30);
  g.enemyCooldown -= dt;
  const visible = g.enemies.filter(e => e.alive && e.y > 30 && e.y < 400);
  if (g.enemyCooldown <= 0 && visible.length) {
    const e = visible[Math.floor(Math.random() * visible.length)];
    g.enemyShots.push({ x: e.x, y: e.y + 20 });
    g.enemyCooldown = Math.max(.5, 1.7 - g.wave * .1);
  }
  for (const shot of g.enemyShots) {
    const previousY = shot.y;
    shot.y += dt * 210;
    const hit = active.find(s => s.protection <= 0 && Math.abs(s.x - shot.x) < 24 && shot.y >= 465 && previousY <= 510);
    if (hit) { shot.y = 600; hit.protection = 2; g.shields = Math.max(0, g.shields - 1); g.notice = 'Kalkan vuruldu! Pembe atışlardan kaçının.'; }
  }
  g.enemyShots = g.enemyShots.filter(s => s.y < 550);
  if (g.shields === 0) { g.finished = true; g.notice = 'Kalkanlar bitti. Güzel takım çalışması!'; }
  else if (g.enemies.every(e => !e.alive)) {
    g.wave++; g.shields = Math.min(6, g.shields + 1); riverWave(g);
  }
}
