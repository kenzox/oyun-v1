export const GAMES = [
  { id: 'sling', name: 'Sapan Savaşları', category: 'Nişan & fizik', min: 1, max: 8, duration: 120, icon: '◉', color: '#b9ec72', description: 'Ger, nişan al, kaleyi dağıt!', control: 'Çek ve bırak', instruction: 'Sıran geldiğinde telefondaki topu geriye çekip bırak. Ahşap bloklar 10, yıldızlar 30 puan. Her atıştan sonra sıra değişir.' },
  { id: 'archery', name: 'Okçu Arenası', category: 'Nişan & fizik', min: 2, max: 8, duration: 90, icon: '➶', color: '#c5b4fa', description: 'Biraz açı, biraz güç, tam isabet.', control: 'Çek ve bırak', instruction: 'Sıran geldiğinde yayı çekip bırak. Okun rakibine değerse 25 puan! Karakterler her atıştan sonra yer değiştirir; kimse elenmez.' },
  { id: 'snake', name: 'Yılan Yarışı', category: 'Nostalji', min: 1, max: 8, duration: 90, icon: '⌁', color: '#f4b96b', description: 'Klasik yılan, kalabalık sofra.', control: 'Yön tuşları', instruction: 'Yön tuşlarıyla elmalara ulaş. Her elma 10 puan. Duvara veya bir yılana çarparsan kısalıp yeniden başlarsın.' },
  { id: 'pong', name: 'Raket Kapışması', category: 'Nostalji', min: 1, max: 8, duration: 90, icon: '▰', color: '#89c7f4', description: 'Topu yakala, tuğlaları patlat.', control: 'Parmağınla kaydır', instruction: 'Herkes kendi renkli sahasında yarışır. Parmağını kaydırıp raketini hareket ettir. Her tuğla 10 puan. Kaçan top yeniden gelir.' },
  { id: 'draw', name: 'Karalama Kapışması', category: 'Parti', min: 2, max: 8, duration: 180, icon: '✎', color: '#f5a7bb', description: 'Bir çizgi, bin komik tahmin.', control: 'Çiz & tahmin et', instruction: 'Çizer gizli görevi telefonunda görür. Diğerleri telefonlarından tahmin yazar. Doğru tahmin 30, çizere 15 puan. Her çizim için 40 saniyeniz var.' },
  { id: 'balance', name: 'Denge Ekibi', category: 'Birlikte', min: 1, max: 8, duration: 90, icon: '◎', color: '#8bdbc6', description: 'Hep birlikte, aynı dengede.', control: 'Dokun veya eğ', instruction: 'Herkesin kumandası topun hareketine katkıda bulunur. Topu yeşil hedefe götürün, kırmızı deliklerden uzak tutun. Ortak hedef: mümkün olduğunca çok yıldız!' },
];

export const COLORS = ['#b9ec72', '#c5b4fa', '#f4b96b', '#89c7f4', '#f5a7bb', '#8bdbc6', '#f9df77', '#fda28b'];
const clamp = (n, a, b) => Math.max(a, Math.min(b, Number(n) || 0));
const rand = (a, b) => a + Math.random() * (b - a);
const words = ['kedi', 'roket', 'dondurma', 'bisiklet', 'zürafa', 'robot', 'şemsiye', 'ağaç', 'balık', 'uçak', 'pizza', 'kelebek', 'gitar', 'güneş', 'penguen', 'korsan'];
const normal = s => String(s).toLocaleLowerCase('tr').normalize('NFC').trim().replace(/\s+/g, ' ');
const targets = () => Array.from({ length: 12 }, (_, i) => ({ x: 650 + (i % 4) * 58, y: 475 - Math.floor(i / 4) * 55, w: 48, h: 48, alive: true, star: i >= 8 }));

export function createGame(id, players, now = Date.now()) {
  const meta = GAMES.find(g => g.id === id);
  if (!meta) throw new Error('Bilinmeyen oyun');
  const ids = players.map(p => p.id);
  const g = { id, ids, start: now, end: now + meta.duration * 1000, scores: Object.fromEntries(ids.map(id => [id, 0])), turn: 0, turnAt: now, notice: 'Hazır, başla!', tick: 0 };
  if (id === 'sling') Object.assign(g, { blocks: targets(), projectile: null, trail: [], lastShot: 0 });
  if (id === 'archery') Object.assign(g, { archers: ids.map((id, i) => ({ id, x: 110 + i * 780 / Math.max(1, ids.length - 1), y: 470 - (i % 2) * 65 })), projectile: null, trail: [], lastShot: 0 });
  if (id === 'snake') Object.assign(g, { snakes: ids.map((id, i) => ({ id, body: [{ x: 3 + (i % 4) * 7, y: 4 + Math.floor(i / 4) * 10 }], dir: { x: 1, y: 0 }, next: { x: 1, y: 0 } })), apples: Array.from({ length: 12 }, () => ({ x: Math.floor(rand(0, 32)), y: Math.floor(rand(0, 18)) })), step: 0 });
  if (id === 'pong') g.lanes = ids.map(id => ({ id, paddle: .5, ball: { x: .5, y: .65, vx: .22, vy: -.4 }, bricks: Array.from({ length: 15 }, (_, i) => ({ x: (i % 5) * .18 + .05, y: Math.floor(i / 5) * .08 + .12, alive: true })) }));
  if (id === 'draw') Object.assign(g, { word: words[Math.floor(rand(0, words.length))], strokes: [], roundEnd: now + 40000, guessed: [], guesses: [], round: 1 });
  if (id === 'balance') Object.assign(g, { ball: { x: 500, y: 300, vx: 0, vy: 0 }, target: { x: 800, y: 180 }, holes: [{ x: 340, y: 200 }, { x: 650, y: 390 }, { x: 220, y: 400 }], inputs: {}, stars: 0 });
  return g;
}

function nextTurn(g, now) { g.turn = (g.turn + 1) % g.ids.length; g.turnAt = now; }
export function currentPlayer(g) { return g.ids[g.turn]; }

export function inputGame(g, id, input, now = Date.now()) {
  if (!g.ids.includes(id) || !input || typeof input !== 'object') return;
  if (['sling', 'archery'].includes(g.id) && input.type === 'shoot' && currentPlayer(g) === id && !g.projectile) {
    const angle = clamp(input.angle, 12, 82) * Math.PI / 180;
    const power = clamp(input.power, .15, 1);
    const source = g.id === 'sling' ? { x: 145, y: 430 } : g.archers[g.turn];
    const direction = g.id === 'sling' || source.x < 500 ? 1 : -1;
    g.projectile = { x: source.x, y: source.y - 25, vx: Math.cos(angle) * (300 + power * 600) * direction, vy: -Math.sin(angle) * (300 + power * 600), owner: id, age: 0 };
    g.trail = []; g.lastShot = now;
  }
  if (g.id === 'snake' && input.type === 'direction') {
    const dirs = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
    const s = g.snakes.find(s => s.id === id); const d = dirs[input.direction];
    if (d && (s.body.length === 1 || d.x !== -s.dir.x || d.y !== -s.dir.y)) s.next = d;
  }
  if (g.id === 'pong' && input.type === 'paddle') g.lanes.find(l => l.id === id).paddle = clamp(input.x, .12, .88);
  if (g.id === 'balance' && input.type === 'tilt') g.inputs[id] = { x: clamp(input.x, -1, 1), y: clamp(input.y, -1, 1), at: now };
  if (g.id === 'draw') {
    if (currentPlayer(g) === id && input.type === 'stroke' && g.strokes.length < 4000) {
      g.strokes.push({ x: clamp(input.x, 0, 1), y: clamp(input.y, 0, 1), start: !!input.start });
    }
    if (currentPlayer(g) === id && input.type === 'clear') g.strokes = [];
    if (currentPlayer(g) !== id && input.type === 'guess' && !g.guessed.includes(id)) {
      const guess = String(input.text || '').trim().slice(0, 50);
      if (!guess) return;
      if (normal(guess) === normal(g.word)) { g.scores[id] += 30; g.scores[currentPlayer(g)] += 15; g.guessed.push(id); g.guesses.push({ id, text: 'Doğru bildi! ✨', correct: true }); }
      else g.guesses.push({ id, text: guess, correct: false });
      g.guesses = g.guesses.slice(-5);
    }
  }
}

export function tickGame(g, dt, now = Date.now(), connected = g.ids) {
  g.tick++;
  if (['sling', 'archery'].includes(g.id)) {
    if (!g.projectile && (now - g.turnAt > 16000 || !connected.includes(currentPlayer(g)))) nextTurn(g, now);
    const p = g.projectile;
    if (p) {
      p.age += dt; p.vy += 460 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (g.tick % 2 === 0) { g.trail.push({ x: p.x, y: p.y }); if (g.trail.length > 35) g.trail.shift(); }
      let hit = false;
      if (g.id === 'sling') {
        const block = g.blocks.find(b => b.alive && p.x > b.x - 14 && p.x < b.x + b.w + 14 && p.y > b.y - 14 && p.y < b.y + b.h + 14);
        if (block) {
          const destroyed = g.blocks.filter(b => b.alive && Math.hypot(b.x - block.x, b.y - block.y) < 90);
          const points = destroyed.reduce((s, b) => { b.alive = false; return s + (b.star ? 30 : 10); }, 0);
          g.scores[p.owner] += points; g.notice = `Harika atış! +${points}`; hit = true;
        }
      } else {
        const target = g.archers.find(a => a.id !== p.owner && Math.hypot(a.x - p.x, a.y - 22 - p.y) < 33);
        if (target) { g.scores[p.owner] += 25; g.notice = 'Tam isabet! +25'; hit = true; }
      }
      if (hit || p.y > 530 || p.x < -30 || p.x > 1030 || p.age > 5) {
        if (!hit) g.notice = 'Bir sonraki atışta!';
        g.projectile = null; nextTurn(g, now);
        if (g.id === 'sling' && !g.blocks.some(b => b.alive)) { g.blocks = targets(); g.notice = 'Yeni kale hazır!'; }
        if (g.id === 'archery') g.archers.forEach(a => { a.y = rand(360, 480); });
      }
    }
  }
  if (g.id === 'snake') {
    g.step += dt;
    if (g.step >= .14) {
      g.step = 0;
      const heads = g.snakes.map(s => ({ x: s.body[0].x + s.next.x, y: s.body[0].y + s.next.y }));
      const occupied = g.snakes.flatMap(s => s.body.map(b => ({ ...b })));
      g.snakes.forEach((s, i) => {
        s.dir = { ...s.next }; const head = heads[i];
        const dead = head.x < 0 || head.x >= 32 || head.y < 0 || head.y >= 18 || occupied.some(b => b.x === head.x && b.y === head.y) || heads.some((h, j) => j !== i && h.x === head.x && h.y === head.y);
        if (dead) { s.body = [{ x: 3 + (i % 4) * 7, y: 4 + Math.floor(i / 4) * 10 }]; s.dir = s.next = { x: 1, y: 0 }; return; }
        s.body.unshift(head);
        const ai = g.apples.findIndex(a => a.x === head.x && a.y === head.y);
        if (ai >= 0) { g.scores[s.id] += 10; g.apples[ai] = { x: Math.floor(rand(0, 32)), y: Math.floor(rand(0, 18)) }; }
        else if (s.body.length > 3) s.body.pop();
      });
    }
  }
  if (g.id === 'pong') g.lanes.forEach(l => {
    const b = l.ball; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < .025 || b.x > .975) { b.x = clamp(b.x, .025, .975); b.vx *= -1; }
    if (b.y < .04) { b.y = .04; b.vy = Math.abs(b.vy); }
    if (b.vy > 0 && b.y >= .86 && b.y <= .92 && Math.abs(b.x - l.paddle) < .145) { b.vy = -Math.abs(b.vy); b.vx = (b.x - l.paddle) * 2.8; }
    const brick = l.bricks.find(t => t.alive && b.x > t.x - .02 && b.x < t.x + .16 && b.y > t.y - .02 && b.y < t.y + .065);
    if (brick) { brick.alive = false; b.vy *= -1; l.brickHit = now; g.scores[l.id] += 10; }
    if (b.y > 1) l.ball = { x: .5, y: .65, vx: rand(-.2, .2), vy: -.4 };
    if (l.bricks.every(t => !t.alive)) l.bricks.forEach(t => { t.alive = true; });
  });
  if (g.id === 'draw' && (now > g.roundEnd || g.guessed.length >= g.ids.length - 1 || !connected.includes(currentPlayer(g)))) {
    g.notice = `Cevap: ${g.word}`; nextTurn(g, now); g.word = words[Math.floor(rand(0, words.length))]; g.roundEnd = now + 40000; g.strokes = []; g.guessed = []; g.guesses = []; g.round++;
  }
  if (g.id === 'balance') {
    const inputs = Object.entries(g.inputs).filter(([id, v]) => connected.includes(id) && now - v.at < 1000).map(([, v]) => v);
    const n = Math.max(1, connected.length); const b = g.ball;
    b.vx = (b.vx + inputs.reduce((s, v) => s + v.x, 0) / n * dt * 450) * .985;
    b.vy = (b.vy + inputs.reduce((s, v) => s + v.y, 0) / n * dt * 450) * .985;
    b.x = clamp(b.x + b.vx * dt, 35, 965); b.y = clamp(b.y + b.vy * dt, 35, 505);
    if (b.x <= 35 || b.x >= 965) b.vx *= -.5;
    if (b.y <= 35 || b.y >= 505) b.vy *= -.5;
    if (Math.hypot(b.x - g.target.x, b.y - g.target.y) < 35) { g.stars++; g.ids.forEach(id => { g.scores[id] += 20; }); g.target = { x: rand(100, 900), y: rand(80, 450) }; if (g.holes.some(h => Math.hypot(h.x - g.target.x, h.y - g.target.y) < 80)) g.target = { x: 800, y: 100 }; g.notice = 'Birlikte başardınız! +20'; }
    if (g.holes.some(h => Math.hypot(b.x - h.x, b.y - h.y) < 27)) { Object.assign(b, { x: 500, y: 300, vx: 0, vy: 0 }); g.notice = 'Birlikte tekrar deneyelim!'; }
  }
}

export function publicGame(g) {
  if (!g) return null;
  const { word, inputs, ...safe } = g;
  return safe;
}
