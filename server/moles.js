function spawn(g, now, forcedTile) {
  const empty = g.moles.map((m, i) => m.kind === 'empty' ? i : -1).filter(i => i >= 0);
  if (!empty.length) return;
  const index = forcedTile ?? empty[Math.floor(Math.random() * empty.length)];
  const roll = Math.random();
  g.moles[index] = { kind: forcedTile !== undefined ? 'mole' : roll < .15 ? 'star' : roll < .35 ? 'flower' : 'mole', serial: ++g.moleSerial, expiresAt: now + Math.max(850, 1500 - (now - g.start) / 150) };
}

export function initMoles(g, now) {
  if (g.id !== 'moles') return;
  g.moleSerial = 0; g.spawnAt = now + 700;
  g.moles = Array.from({ length: 9 }, () => ({ kind: 'empty', serial: 0, expiresAt: 0 }));
  g.claims = Object.fromEntries(g.ids.map(id => [id, Array(9).fill(0)]));
  g.feedback = {};
  g.notice = 'Köstebeğe dokun, çiçeği koru. Altın köstebek bonus!';
  spawn(g, now, 4);
}

export function inputMoles(g, id, input, now) {
  if (g.id !== 'moles' || input.type !== 'whack' || !Number.isInteger(input.tile) || input.tile < 0 || input.tile >= 9) return;
  const m = g.moles[input.tile];
  if (m.kind === 'empty' || input.serial !== m.serial || now >= m.expiresAt || g.claims[id][input.tile] === m.serial) return;
  g.claims[id][input.tile] = m.serial;
  const points = m.kind === 'flower' ? -5 : m.kind === 'star' ? 25 : 10;
  g.scores[id] = Math.max(0, g.scores[id] + points);
  g.feedback[id] = { serial: m.serial, points, kind: m.kind };
}

export function tickMoles(g, _dt, now) {
  if (g.id !== 'moles') return;
  g.moles.forEach(m => { if (now >= m.expiresAt) m.kind = 'empty'; });
  if (now >= g.spawnAt) {
    spawn(g, now);
    g.spawnAt = now + Math.max(450, 800 - (now - g.start) / 250);
  }
}
