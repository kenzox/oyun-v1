import { art, avatars, memoryTiles, renderBoard } from './render.js';
import { TEAM_COLORS, TEAM_NAMES } from './game-geometry.js';
import { GOLF_COURSES, GOLF_LIMIT, golfMoving } from './golf-courses.js';
import { MOLE_SYMBOLS, MOLE_NAMES } from './casual-render.js';

const $ = s => document.querySelector(s);
const root = $('#app');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing can disable storage. */ } };
const query = new URLSearchParams(location.search);
const role = query.has('room') || query.has('join') ? 'player' : 'host';
let config, state = null, socket, credentials, myId, selectedAvatar = 0, category = 'Tümü', viewKey = '', secret = null, cleanControl = () => {}, base, online = false;
let toastTimer;
function toast(message) { const box = $('#toast'); box.textContent = message; box.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => box.classList.remove('visible'), 4000); }
const brand = `<div class="brand"><i class="brandmark"></i>salon<small>Ailece oyun zamanı.</small></div>`;
const meta = () => config.games.find(g => g.id === (state?.game?.id || state?.selected || 'sling'));
const me = () => state?.players.find(p => p.id === myId);
const name = id => state?.players.find(p => p.id === id)?.name || 'Oyuncu';
const joinUrl = () => `${base}/?room=${state.code}`;
const time = ms => `${Math.floor(Math.max(0, ms) / 60000)}:${String(Math.floor(Math.max(0, ms) / 1000) % 60).padStart(2, '0')}`;

function playerHTML(p, score, rank) {
  return `<div class="player" style="--pcolor:${p.color}">${rank ? `<span class="rank">${rank}</span>` : ''}<span class="avatar">${avatars[p.avatar]}</span><div><div class="player-name">${esc(p.name)}</div><div class="player-status">${p.connected ? 'Oyuna hazır' : 'Bağlantı bekleniyor'}</div></div>${score !== undefined ? `<span class="score">${score}</span>` : (!p.connected && state?.phase === 'lobby' ? `<button class="quiet" data-remove="${p.id}" aria-label="${esc(p.name)} adlı oyuncuyu çıkar">×</button>` : '')}</div>`;
}

function sidebar() {
  if (!state) return `<aside class="sidebar"><div class="sidebar-title"><h2>Herkes burada mı?</h2><span>1–8 KİŞİ</span></div><div class="join-box"><div style="font-size:65px;margin:18px">🎮</div><h3>Salon sizin.</h3><p>Bir oda açın.<br>Telefonları kapın. Eğlence başlasın.</p></div><div class="welcome-join"><button class="primary" data-action="create">Oda oluştur <span>↗</span></button><p>Telefonlar bilgisayarla aynı Wi-Fi ağına bağlı olmalı. Uygulama indirmeye gerek yok.</p></div><div class="sidebar-tip"><strong>Bir telefon, iki oyuncu.</strong><br>Telefonunu paylaşarak takım olabilirsin. Misafirler de her an katılabilir.</div></aside>`;
  return `<aside class="sidebar"><div class="sidebar-title"><h2>Oyun odanız</h2><span>● AÇIK</span></div><div class="join-box"><h3>Telefonunu kap, katıl.</h3><p>Kameranı QR koda tut.<br>Bilgisayarla aynı Wi-Fi ağına bağlan.</p><img class="qr" alt="${esc(state.code)} numaralı odaya katılım QR kodu" src="/api/qr?room=${state.code}&base=${encodeURIComponent(base)}"/><div class="tiny">ODA KODU</div><div class="room-code">${state.code}</div><button class="quiet tiny" data-action="copy">♧ Katılım bağlantısını kopyala</button><a class="join-url" href="${esc(joinUrl())}" target="_blank" rel="noopener">${esc(joinUrl())}</a>${config.addresses.length ? `<select class="network-select" id="network" aria-label="Telefonların bağlanacağı ağ adresi">${config.addresses.map(a => `<option value="${esc(a)}" ${a === base ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select>` : '<p>Yerel ağ adresi bulunamadı. Bilgisayarı Wi-Fi ağına bağlayın.</p>'}</div><div><div class="players-title">Oyuncular <span id="player-count"></span></div><div id="player-list" class="player-list"></div></div><div class="sidebar-tip"><strong>Birlikte daha eğlenceli.</strong><br>Yeni katılanlar devam eden turu izler, sonraki oyunda aranıza katılır.</div></aside>`;
}

function cards() {
  return config.games.filter(g => category === 'Tümü' || g.category === category).map(g => `<button class="game-card ${g.id === (state?.selected || 'sling') ? 'selected' : ''}" data-game="${g.id}" style="--accent:${g.color}" aria-label="${g.name} oyununu seç"><div class="card-art"><span class="card-index">${String(config.games.indexOf(g) + 1).padStart(2, '0')}</span><span class="card-badge">${g.category}</span>${art(g.id, g.color)}</div><div class="card-copy"><h3>${g.name}</h3><p>${g.description}</p><div class="card-bottom"><span>♙ ${g.min}–${g.max} kişi · ${(g.duration / 60).toLocaleString('tr')} dk</span><span>${g.control} ↗</span></div></div></button>`).join('');
}

function lobby() {
  const g = meta();
  return `<div class="intro"><div><div class="eyebrow">Ekran büyük, eğlence daha büyük.</div><h1>Bu akşam ne oynuyoruz?</h1><p>Bir TV. Birkaç telefon. Bir sürü güzel anı.</p></div><span class="pill">✦ Her yaşa bir oyun</span></div><section class="hero" style="background:${g.color}"><div class="hero-copy"><div class="hero-label"><span>✦</span> ${state ? 'SIRADAKİ OYUNUNUZ' : 'BU AKŞAMIN İLK OYUNU'}</div><h2>${g.name}</h2><p>${g.description} ${g.id === 'sling' ? 'Açını bul, gücünü ayarla. Bakalım kaleyi kim devirecek?' : g.instruction.split('. ')[0] + '.'}</p><div class="hero-actions"><button class="primary" data-action="${state ? 'start' : 'create'}">${state ? 'Oyunu başlat' : 'Hadi başlayalım'} <span>↗</span></button><span class="meta">${g.min}–${g.max} kişi · ${(g.duration / 60).toLocaleString('tr')} dakika</span></div></div><div class="hero-art">${art(g.id, g.color)}</div></section><section><div class="section-heading"><h2>Oyun rafı <span class="tiny">/ ${String(config.games.length).padStart(2, '0')}</span></h2><nav class="tabs" aria-label="Oyun kategorileri">${['Tümü', ...new Set(config.games.map(g => g.category))].map(t => `<button class="tab ${category === t ? 'active' : ''}" data-category="${t}" aria-pressed="${category === t}">${t}</button>`).join('')}</nav></div><div class="cards">${cards()}</div></section><div class="bottom-note"><span>◉ Kurulum yok. Kumanda yok. Telefonun yeter.</span><span>Biraz rekabet, bolca kahkaha. ✳</span></div>`;
}

function results(mobile = false) {
  const g = state.game; const ranking = [...state.players].filter(p => g.ids.includes(p.id)).sort((a, b) => g.scores[b.id] - g.scores[a.id]);
  const best = ranking[0]; const ties = ranking.filter(p => g.scores[p.id] === g.scores[best.id]);
  const cooperative = ['balance', 'river'].includes(g.id);
  const title = g.teams ? g.teamScores[0] === g.teamScores[1] ? 'Berabere! Rövanşa hazır mısınız?' : `${TEAM_NAMES[g.teamScores[0] > g.teamScores[1] ? 0 : 1]} kazandı!` : g.id === 'river' ? `Birlikte ${g.teamScore} puan!` : g.id === 'balance' ? `Birlikte ${g.stars} yıldız!` : ties.length > 1 ? 'Zirveyi paylaştınız!' : `${esc(best.name)} kazandı!`;
  return `<div class="results"><div class="eyebrow">Güzel oyundu!</div><div class="trophy">${cooperative ? '🌟' : '🏆'}</div><h2>${title}</h2><p>${g.teams ? `Mavi ${g.teamScores[0]} — ${g.teamScores[1]} Mercan` : g.id === 'river' ? `${g.wave}. etaba ulaştınız. ${g.shields ? 'Süre tamamlandı!' : 'Kalkanlar bitti; yeniden deneyebilirsiniz.'}` : cooperative ? 'En iyi takım, sizin takımınız.' : 'Rövanş için hâlâ vaktimiz var.'}</p><div class="leaderboard">${ranking.map((p, i) => playerHTML(p, g.scores[p.id], cooperative || g.teams ? undefined : i + 1)).join('')}</div>${mobile ? '<p>Sıradaki oyunu TV’den seçin.</p>' : '<div class="results-actions"><button class="primary" data-action="start">Bir daha oyna ↻</button><button class="secondary" data-action="lobby">Oyun rafına dön</button></div>'}</div>`;
}

function gameView() {
  const g = meta();
  return `<div class="game-top"><button class="secondary" data-action="exit-game" aria-label="Oyundan çık">←</button><div><div class="eyebrow">${g.category}</div><h1>${g.name}</h1></div><div class="timer" id="timer"></div><button class="secondary" data-action="pause" id="pause-button">${state.paused ? '▶ Devam et' : 'Ⅱ Duraklat'}</button></div><div class="game-message"><strong id="turn-message"></strong><span id="notice"></span></div><canvas class="board" id="board" aria-label="${g.name} ortak oyun ekranı"></canvas><p class="instruction">${g.instruction}</p><div class="scores" id="scores"></div>${g.id === 'draw' ? '<div class="guess-list" id="guesses"></div>' : ''}`;
}

function renderHost() {
  root.innerHTML = `<header>${brand}<div class="top-actions"><span class="connection"><i class="dot ${online || !state ? '' : 'off'}"></i><span id="connection-text">${state ? online ? 'Oda bağlantısı açık' : 'Yeniden bağlanıyor…' : 'Aile oyun salonu'}</span></span><button class="quiet" data-action="help">Nasıl oynanır?</button><button class="secondary" data-action="fullscreen" aria-label="Tam ekran">⛶</button></div></header><div class="shell"><main class="main">${state?.phase === 'playing' ? gameView() : state?.phase === 'results' ? results() : lobby()}</main>${sidebar()}</div>`;
}

function mobileShell(content) { return `<main class="mobile"><div class="mobile-header"><div class="brand"><i class="brandmark"></i>salon</div><span class="pill">${esc(state?.code || query.get('room') || 'Kumanda')}</span></div>${!online && state ? '<div class="reconnect">Bağlantı kesildi. Yeniden bağlanıyoruz…</div>' : ''}${state?.pauseReason ? `<div class="reconnect" role="status">${state.pauseReason === 'host' ? 'TV bağlantısı bekleniyor.' : state.pauseReason === 'players' ? 'Oyuncuların bağlantısı bekleniyor.' : 'Mola zamanı. TV’den devam edilecek.'} Süre durduruldu.</div>` : ''}${content}</main>`; }

function joinForm(error = '') {
  root.innerHTML = mobileShell(`<div class="eyebrow">Kumandan hazır.</div><h1>Sen de oyuna katıl.</h1><p class="sub">Bir isim ve bir yüz seç.<br>Gerisi bolca kahkaha.</p>${error ? `<div class="reconnect">${esc(error)}</div>` : ''}<form id="join-form"><label for="room-code">Oda kodu</label><input id="room-code" name="code" value="${esc(query.get('room') || '')}" placeholder="TV’deki 6 haneli kod" minlength="6" maxlength="6" required autocapitalize="characters" autocomplete="off"/><label for="player-name">Sana ne diyelim?</label><input id="player-name" name="name" placeholder="Oyuncu adı" maxlength="16" autocomplete="nickname" required/><label>Karakterini seç</label><div class="avatar-picker">${avatars.map((a, i) => `<button type="button" class="avatar-option ${i === selectedAvatar ? 'active' : ''}" data-avatar="${i}" aria-label="${['Kurbağa', 'Tilki', 'Panda', 'Ahtapot', 'Kaplan', 'Koala', 'Maymun', 'Tavşan'][i]}" aria-pressed="${i === selectedAvatar}">${a}</button>`).join('')}</div><button class="primary" type="submit">Ben de varım! ↗</button></form><p class="game-preview">Bilgisayarla aynı Wi-Fi ağında olmalısın.</p>`);
}

function renderMobile() {
  if (!state) { joinForm(); return; }
  if (state.phase === 'results') { root.innerHTML = mobileShell(results(true)); return; }
  const p = me();
  if (state.phase === 'lobby' || !state.game?.ids.includes(myId)) {
    root.innerHTML = mobileShell(`<div class="waiting"><div class="waiting-art">${avatars[p?.avatar || 0]}</div><div class="eyebrow">${esc(p?.name)}, hoş geldin!</div><h2>${state.phase === 'lobby' ? 'Herkes hazır mı?' : 'Sıradaki tur senin.'}</h2><p class="sub">${state.phase === 'lobby' ? 'Gözler TV’de! Oyun oradan başlayacak.<br>Telefonun artık senin kumandan.' : 'Bu tur devam ediyor. Yeni oyunda otomatik olarak katılacaksın.'}</p><div class="mobile-players">${state.players.map(p => `<span class="avatar" style="--pcolor:${p.color}" title="${esc(p.name)}">${avatars[p.avatar]}</span>`).join('')}</div><div class="control-info">Sıradaki oyun: <strong>${meta().name}</strong></div></div>`); return;
  }
  const g = state.game, isTurn = g.ids[g.turn] === myId;
  let controls = '';
  if (g.id === 'golf') controls = `<div class="control-info" id="golf-status" role="status" aria-live="polite"></div><canvas class="control-pad" id="golf-pad" aria-label="Topu gitmesini istediğin yönün tersine çekip bırak"></canvas><p class="pad-label">Topu ters yöne çekip bırak veya aşağıdan nişan al.</p><div class="shot-settings"><label for="golf-angle">Yön: <output id="golf-angle-value">0°</output></label><input id="golf-angle" type="range" min="-180" max="180" value="0"/><p class="pad-label">0° sağ · 90° yukarı · −90° aşağı · 180° sol</p><label for="golf-power">Güç: <output id="golf-power-value">75%</output></label><input id="golf-power" type="range" min="8" max="100" value="75"/><button class="primary" data-action="putt">Topa vur ⚑</button></div>`;
  if (g.id === 'moles') controls = `<div class="control-info">🐹 +10 · 🌟 +25 · 🌼 −5<br>Her hedefe herkes bir kez puan alabilir.</div><div id="mole-feedback" class="mole-feedback" role="status" aria-live="polite">Köstebekleri bekle, çiçekleri koru.</div><div class="mole-controls">${Array.from({ length: 9 }, (_, i) => `<button class="mole-button" data-mole="${i}" data-serial="0" aria-label="${i + 1}: Boş yuva" disabled><span class="mole-symbol"></span><small>${i + 1}</small></button>`).join('')}</div>`;
  if (g.id === 'river') {
    const ship = g.ships.find(s => s.id === myId);
    controls = `<div class="control-info active">Kendi rengindeki uçağı yönet. Ateş otomatik; kıyılara ve pembe atışlara dikkat!</div><div class="team-hud" id="river-hud"></div><label for="ship-position">Uçak konumu</label><input class="paddle-input" id="ship-position" type="range" min="0.04" max="0.96" step="0.01" value="${ship.target / 1000}"/><p class="pad-label">← Sola kaydır · Nehrin içinde kal · Sağa kaydır →</p>`;
  }
  if (g.id === 'memory') controls = `<div class="control-info" id="memory-status" role="status" aria-live="polite"></div><div class="memory-controls">${memoryTiles.map((t, i) => `<button class="memory-tile" data-tile="${i}" style="--tile:${t.color}" aria-label="${i + 1}: ${t.name}"><span>${t.symbol}</span><small>${i + 1} · ${t.name}</small></button>`).join('')}</div><p class="pad-label">Şekiller ve sayılar da renkleri ayırt etmene yardımcı olur.</p>`;
  if (g.teams) {
    const team = g.teams[myId];
    controls = `<div class="team-identity" style="--team:${TEAM_COLORS[team]}">${TEAM_NAMES[team]} · ${team === 0 ? 'Sol saha' : 'Sağ saha'}</div><div class="team-hud" id="court-hud"></div>`;
    if (g.id === 'volley') {
      const athlete = g.athletes.find(p => p.id === myId);
      controls += `<label for="court-position">Sahadaki konumun</label><input class="paddle-input" id="court-position" type="range" min="0" max="1" step="0.01" value="${(athlete.target - 35 - team * 500) / 430}"/><button class="primary jump-button" data-action="jump">↑ Zıpla!</button><p class="pad-label">Top yaklaşınca altına geç ve zıpla. Klavyede boşluk tuşunu da kullanabilirsin.</p>`;
    } else controls += `<canvas class="control-pad" id="hockey-pad" aria-label="Hokey oyuncusunu hareket ettirmek için istediğin yöne sürükle"></canvas><p class="pad-label">Çubuğu sürükle. Diske dokunarak rakip kaleye vur!</p>`;
  }
  if (['sling', 'archery'].includes(g.id)) controls = `<div class="control-info ${isTurn ? 'active' : ''}" id="mobile-turn"></div><canvas class="control-pad" id="aim-pad" aria-label="Topu geriye çekip bırakarak atış yap"></canvas><p class="pad-label">Topu aşağı ve sola çekip bırak veya açı ve gücü aşağıdan ayarla.</p><div class="shot-settings"><label for="shot-angle">Açı: <output id="angle-value">45°</output></label><input id="shot-angle" type="range" min="12" max="82" value="45"/><label for="shot-power">Güç: <output id="power-value">35%</output></label><input id="shot-power" type="range" min="15" max="100" value="35"/><button class="primary" data-action="accessible-shot">Atış yap ↗</button></div>`;
  if (g.id === 'snake') controls = `<div class="control-info">Elmalara koş! Duvara çarpsan da oyun devam eder.</div><div class="dpad"><button class="up" data-direction="up" aria-label="Yukarı">↑</button><button class="left" data-direction="left" aria-label="Sol">←</button><button class="right" data-direction="right" aria-label="Sağ">→</button><button class="down" data-direction="down" aria-label="Aşağı">↓</button></div><p class="pad-label">Gözün TV’de, parmakların burada.</p>`;
  if (g.id === 'pong') controls = `<div class="control-info">Raketini kaydır, topu oyunda tut!</div><label for="paddle">Raket konumu</label><input class="paddle-input" id="paddle" type="range" min="0.12" max="0.88" step="0.01" value="0.5"/><p class="pad-label">← Sola &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Sağa →</p>`;
  if (g.id === 'balance') controls = `<div class="control-info active">Birlikte yönlendirin. Yeşil yıldız sizin!</div><canvas class="control-pad" id="balance-pad" aria-label="Parmağını istediğin yöne kaydırarak topu yönlendir"></canvas><p class="pad-label">Parmağını gitmek istediğin yöne kaydır.</p><button class="secondary" data-action="motion" style="width:100%">Telefonu eğerek oyna</button><p class="pad-label" id="motion-status">Dokunmatik kumanda her telefonda çalışır.</p>`;
  if (g.id === 'draw') controls = isTurn ? `<p class="sub">Çizme sırası sende. Kelimeyi kimseye gösterme!</p><div class="secret-word" id="secret-word">Görev geliyor…</div><canvas class="control-pad draw-pad" id="draw-pad" aria-label="Çizim alanı"></canvas><div class="control-tools"><button class="secondary" data-action="clear">Çizimi temizle</button></div>` : `<div class="control-info">${esc(name(g.ids[g.turn]))} çiziyor. TV’ye bak ve tahmin et!</div><form class="guess-form" id="guess-form"><label for="guess">Sence bu ne?</label><input id="guess" name="guess" maxlength="50" placeholder="Tahminini yaz…" autocomplete="off" required/><button type="submit" class="primary">Tahmin et ↗</button></form><div class="guess-list" id="guesses"></div>`;
  root.innerHTML = mobileShell(`<div class="eyebrow">${esc(p?.name)} · <span id="my-score">0</span> puan</div><div class="game-top"><h1 class="control-title">${meta().name}</h1><span class="timer" id="timer"></span></div>${controls}`);
  bindControls();
}

function render(force = false) {
  const g = state?.game;
  const key = `${role}|${state?.code}|${state?.phase}|${state?.selected}|${state?.pauseReason}|${role === 'player' ? `${g?.turn}|${g?.round}|${g?.stage}|${g?.ids.includes(myId)}|${state?.players.map(p => p.id).join()}|${state?.hostOnline}` : ''}|${online}`;
  if (force || key !== viewKey) { cleanControl(); cleanControl = () => {}; viewKey = key; role === 'host' ? renderHost() : renderMobile(); }
  update();
}

function update() {
  if (!state) return;
  if ($('#player-count')) $('#player-count').textContent = `${state.players.filter(p => p.connected).length} / 8 bağlı`;
  if ($('#player-list')) {
    const signature = JSON.stringify(state.players);
    if ($('#player-list').dataset.signature !== signature) { $('#player-list').innerHTML = state.players.map(p => playerHTML(p)).join('') + (state.players.length < 8 ? '<div class="empty-slot"><span>+</span> Yeni bir oyuncu bekleniyor…</div>' : ''); $('#player-list').dataset.signature = signature; }
  }
  const g = state.game; if (!g || state.phase !== 'playing') return;
  if ($('#timer')) $('#timer').textContent = time((g.id === 'draw' ? Math.min(g.roundEnd, g.end) : ['memory', 'golf'].includes(g.id) ? Math.min(g.stageEnd, g.end) : g.end) - state.serverNow);
  if ($('#notice')) $('#notice').textContent = g.notice;
  const isTurn = g.ids[g.turn] === myId;
  if ($('#turn-message')) $('#turn-message').textContent = ['sling', 'archery'].includes(g.id) ? `Sıra ${name(g.ids[g.turn])} adlı oyuncuda · ${Math.max(0, 16 - Math.floor((state.serverNow - g.turnAt) / 1000))} sn` : g.id === 'draw' ? `${name(g.ids[g.turn])} çiziyor · ${g.round}. çizim` : g.id === 'balance' ? 'Hep birlikte aynı hedefe!' : 'Hazırsan, en yüksek puan senin!';
  if ($('#mobile-turn')) $('#mobile-turn').textContent = isTurn ? g.projectile ? 'Atışın yolda! TV’ye bak.' : 'Sıra sende! Nişan al ve bırak.' : `${name(g.ids[g.turn])} atış yapıyor. Sıranı bekle.`;
  if ($('#my-score')) $('#my-score').textContent = g.scores[myId] || 0;
  if ($('#golf-status')) {
    const b = g.golfers.find(b => b.id === myId);
    $('#golf-status').textContent = `${g.round}/${GOLF_COURSES.length} · ${GOLF_COURSES[g.round - 1].name} · ${b.strokes}/${GOLF_LIMIT} vuruş. ` + (g.stage !== 'putting' ? 'Yeni parkuru bekle.' : b.sunk ? 'Deliğe girdi! Diğer oyuncuları bekle.' : golfMoving(b) ? 'Top hareket ediyor…' : b.strokes >= GOLF_LIMIT ? 'Vuruşların bitti. Yeni parkurda yeniden dene.' : 'Nişan al ve topa vur.');
    document.querySelectorAll('#golf-angle, #golf-power, [data-action="putt"]').forEach(control => { control.disabled = !canPutt(); });
  }
  if (g.id === 'moles') {
    document.querySelectorAll('[data-mole]').forEach(button => {
      const i = Number(button.dataset.mole), m = g.moles[i], claimed = m.kind !== 'empty' && g.claims[myId]?.[i] === m.serial;
      button.dataset.serial = String(m.serial);
      button.disabled = !!state.pauseReason || m.kind === 'empty' || claimed;
      button.className = `mole-button ${m.kind}${claimed && m.kind !== 'empty' ? ' claimed' : ''}`;
      button.querySelector('.mole-symbol').textContent = claimed && m.kind !== 'empty' ? '✓' : MOLE_SYMBOLS[m.kind];
      button.setAttribute('aria-label', `${i + 1}: ${MOLE_NAMES[m.kind]}${claimed ? ', tamamlandı' : ''}`);
    });
    if ($('#mole-feedback') && g.feedback[myId]) { const f = g.feedback[myId]; $('#mole-feedback').textContent = f.kind === 'flower' ? 'Çiçekleri koru! −5 puan (en az 0).' : `${f.kind === 'star' ? 'Altın köstebek!' : 'Yakaladın!'} +${f.points} puan`; }
  }
  document.querySelectorAll('#court-position, #ship-position, #paddle, #shot-angle, #shot-power, [data-direction], [data-action="jump"], [data-action="clear"], [data-action="motion"], #guess-form input, #guess-form button').forEach(control => { control.disabled = !!state.pauseReason; });
  const shotButton = $('[data-action="accessible-shot"]');
  if (shotButton) shotButton.disabled = !!state.pauseReason || !isTurn || !!g.projectile;
  if ($('#memory-status')) {
    const outcome = g.outcomes[myId];
    $('#memory-status').textContent = g.stage === 'show' ? `${g.sequenceLength} renk gösteriliyor. TV’ye bak ve sırayı hatırla.` : outcome === 'correct' ? `Harika! +${g.sequenceLength * 10} puan. Yeni seriyi bekle.` : outcome === 'miss' ? 'Bu kez olmadı. Sonraki seride yeniden dene!' : outcome === 'timeout' ? 'Süre doldu. Yeni seri birazdan.' : g.stage === 'answer' ? `Sıra sende! ${g.progress[myId]} / ${g.sequenceLength} renk tamamlandı.` : 'Yeni seri birazdan!';
    document.querySelectorAll('[data-tile]').forEach(b => { b.disabled = !!state.pauseReason || g.stage !== 'answer' || !!outcome; });
  }
  if ($('#river-hud')) $('#river-hud').textContent = `${g.wave}. etap · ${g.shields} kalkan · Takım: ${g.teamScore} puan`;
  if ($('#court-hud')) $('#court-hud').textContent = `${g.teamScores[0]} — ${g.teamScores[1]}${state.serverNow < g.serveAt ? ' · Hazırlanın!' : ''}`;
  if ($('#turn-message') && g.id === 'memory') $('#turn-message').textContent = `${g.round}. tur · ${g.stage === 'show' ? 'İzle ve hatırla' : g.stage === 'answer' ? 'Sıra sende' : 'Yeni seri geliyor'}`;
  if ($('#turn-message') && g.id === 'river') $('#turn-message').textContent = `${g.wave}. etap · ${g.shields} kalkan · Ortak puan: ${g.teamScore}`;
  if ($('#turn-message') && g.teams) $('#turn-message').textContent = `Mavi ${g.teamScores[0]} — ${g.teamScores[1]} Mercan${state.serverNow < g.serveAt ? ' · Hazırlanın!' : ''}`;
  if ($('#turn-message') && g.id === 'golf') $('#turn-message').textContent = `${g.round}/${GOLF_COURSES.length} · ${GOLF_COURSES[g.round - 1].name} · ${g.golfers.filter(b => b.sunk).length}/${g.ids.length} top delikte`;
  if ($('#turn-message') && g.id === 'moles') $('#turn-message').textContent = 'Köstebek +10 · Altın +25 · Çiçek −5';
  if ($('#turn-message') && state.pauseReason) $('#turn-message').textContent = 'Oyun duraklatıldı · Süre ve puanlar korunuyor';
  if ($('#scores')) $('#scores').innerHTML = state.players.filter(p => g.ids.includes(p.id)).map(p => playerHTML(p, g.scores[p.id])).join('');
  if ($('#secret-word') && secret?.round === g.round && isTurn) $('#secret-word').textContent = secret.word;
  if ($('#guesses')) {
    $('#guesses').innerHTML = g.guesses.map(item => `<div class="guess-item ${item.correct ? 'correct' : ''}"><strong>${esc(name(item.id))}:</strong> ${esc(item.text)}</div>`).join('');
    if ($('#guess-form') && g.guessed.includes(myId)) { $('#guess-form').innerHTML = '<div class="control-info active">Bildin! Diğer oyuncuları bekliyoruz. ✨</div>'; }
  }
  renderBoard($('#board'), state);
}

function connect() {
  socket?.disconnect();
  socket = io({ autoConnect: false });
  socket.on('connect', () => {
    socket.emit('enter', credentials, result => {
      if (result.error) { socket.disconnect(); state = null; online = false; if (role === 'host') { save('salon-host', null); render(true); toast(result.error); } else joinForm(result.error); return; }
      online = true;
      if (result.id) { myId = result.id; credentials.playerToken = result.playerToken; save(`salon-player-${credentials.code}`, { ...credentials, id: myId }); }
      render(true);
    });
  });
  socket.on('state', data => { state = data; render(); });
  socket.on('secret', data => { secret = data; update(); });
  socket.on('disconnect', reason => { online = false; render(true); if (reason === 'io server disconnect') toast('Bu oyuncu başka bir sekmede açıldı. Devam etmek için sayfayı yenileyin.'); });
  socket.on('connect_error', () => { online = false; if (state) render(); else toast('Sunucuya ulaşılamıyor. Wi-Fi bağlantısını kontrol edin.'); });
  socket.connect();
}

function send(data) { if (online && state?.hostOnline && !state.pauseReason && socket?.connected) socket.emit('input', data); }
function canPutt() {
  const g = state?.game, b = g?.golfers?.find(b => b.id === myId);
  return online && !state.pauseReason && g?.stage === 'putting' && !!b && !b.sunk && b.strokes < GOLF_LIMIT && !golfMoving(b);
}
function host(data) { if (!socket?.connected) { toast('Oda bağlantısı bekleniyor.'); return; } socket.emit('host', data, result => { if (result.error) toast(result.error); }); }
function modal(title, body, confirmLabel, callback) {
  const backdrop = document.createElement('div'); backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h2>${esc(title)}</h2><p>${body}</p><div class="results-actions"><button class="primary" id="modal-confirm">${confirmLabel || 'Anladım'}</button>${callback ? '<button class="secondary" id="modal-cancel">Devam et</button>' : ''}</div></section>`;
  const previous = document.activeElement; document.body.append(backdrop);
  const close = () => { backdrop.remove(); previous?.focus(); };
  backdrop.querySelector('#modal-confirm').onclick = () => { close(); callback?.(); };
  backdrop.querySelector('#modal-cancel')?.addEventListener('click', close);
  backdrop.addEventListener('keydown', e => { if (e.key === 'Escape') close(); if (e.key === 'Tab') { const buttons = [...backdrop.querySelectorAll('button')]; if (buttons.length === 1) { e.preventDefault(); buttons[0].focus(); } else if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons.at(-1).focus(); } else if (!e.shiftKey && document.activeElement === buttons.at(-1)) { e.preventDefault(); buttons[0].focus(); } } });
  backdrop.querySelector('button').focus();
}

root.addEventListener('click', async e => {
  const button = e.target.closest('button'); if (!button) return;
  if (button.dataset.category) { category = button.dataset.category; render(true); return; }
  if (button.dataset.game) { if (!state) { toast('Oyun seçmek için önce bir oda oluşturun.'); return; } host({ type: 'select', id: button.dataset.game }); return; }
  if (button.dataset.remove) { host({ type: 'remove', id: button.dataset.remove }); return; }
  if (button.dataset.avatar) { selectedAvatar = Number(button.dataset.avatar); document.querySelectorAll('[data-avatar]').forEach(b => { const selected = b === button; b.classList.toggle('active', selected); b.setAttribute('aria-pressed', selected); }); return; }
  if (button.dataset.tile !== undefined) { send({ type: 'memory-tap', tile: Number(button.dataset.tile), round: state.game.round }); return; }
  if (button.dataset.mole !== undefined) { send({ type: 'whack', tile: Number(button.dataset.mole), serial: Number(button.dataset.serial) }); return; }
  if (button.dataset.direction) { send({ type: 'direction', direction: button.dataset.direction }); return; }
  const action = button.dataset.action;
  if (action === 'create') {
    button.disabled = true;
    try { const response = await fetch('/api/rooms', { method: 'POST' }); const data = await response.json(); if (!response.ok) throw new Error(data.error); credentials = data; save('salon-host', data); connect(); } catch (error) { toast(error.message); button.disabled = false; }
  }
  if (action === 'start') host({ type: 'start' });
  if (action === 'pause') host({ type: 'pause', paused: !state.paused });
  if (action === 'jump') send({ type: 'jump' });
  if (action === 'putt') send({ type: 'putt', angle: Number($('#golf-angle').value), power: Number($('#golf-power').value) / 100, round: state.game.round });
  if (action === 'lobby') host({ type: 'lobby' });
  if (action === 'exit-game') modal('Bu turdan çıkılsın mı?', 'Devam eden turun puanları sıfırlanacak. Herkes odada kalır; yeni bir oyun seçebilirsiniz.', 'Oyun rafına dön', () => host({ type: 'lobby' }));
  if (action === 'help') modal('Üç adımda oyun zamanı.', '1. TV ekranında bir oda oluşturun.<br>2. Telefonları aynı Wi-Fi ağına bağlayıp QR kodu okutun.<br>3. Herkes katılınca oyun seçin ve başlatın.<br><br>Misafirler turlar arasında oyuna katılır. Her oyunun açıklaması oyun ekranında görünür.');
  if (action === 'fullscreen') { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { toast('Bu tarayıcı tam ekranı desteklemiyor.'); } }
  if (action === 'copy') { try { await navigator.clipboard.writeText(joinUrl()); toast('Katılım bağlantısı kopyalandı.'); } catch { modal('Katılım bağlantısı', esc(joinUrl())); } }
  if (action === 'clear') { send({ type: 'clear' }); const c = $('#draw-pad')?.getContext('2d'); c?.clearRect(0, 0, 1000, 560); }
  if (action === 'accessible-shot') send({ type: 'shoot', angle: Number($('#shot-angle').value), power: Number($('#shot-power').value) / 100 });
  if (action === 'motion') enableMotion();
});

root.addEventListener('change', e => { if (e.target.id === 'network') { base = e.target.value; save('salon-base', base); render(true); } });
root.addEventListener('input', e => {
  const id = e.target.id;
  if (id === 'paddle') send({ type: 'paddle', x: Number(e.target.value) });
  if (id === 'ship-position') send({ type: 'steer', x: Number(e.target.value) });
  if (id === 'court-position') send({ type: 'position', x: Number(e.target.value) });
  if (id === 'shot-angle') $('#angle-value').textContent = `${e.target.value}°`;
  if (id === 'shot-power') $('#power-value').textContent = `${e.target.value}%`;
  if (id === 'golf-angle') $('#golf-angle-value').textContent = `${e.target.value}°`;
  if (id === 'golf-power') $('#golf-power-value').textContent = `${e.target.value}%`;
});
root.addEventListener('submit', e => {
  if (e.target.id === 'join-form') { e.preventDefault(); const form = new FormData(e.target); const code = String(form.get('code')).trim().toUpperCase(); const saved = read(`salon-player-${code}`); credentials = { code, name: String(form.get('name')).trim(), avatar: selectedAvatar, playerToken: saved?.playerToken }; if (!credentials.name) { toast('Bir oyuncu adı yazın.'); return; } e.target.querySelector('button[type=submit]').disabled = true; connect(); }
  if (e.target.id === 'guess-form') { e.preventDefault(); send({ type: 'guess', text: $('#guess').value }); $('#guess').value = ''; }
});

function bindControls() {
  const aim = $('#aim-pad');
  const balance = $('#balance-pad');
  const drawing = $('#draw-pad');
  const hockey = $('#hockey-pad');
  const golf = $('#golf-pad');
  const removers = [];
  const listen = (target, name, fn, options) => { target.addEventListener(name, fn, options); removers.push(() => target.removeEventListener(name, fn, options)); };
  if (aim || balance || hockey || golf) {
    const canvas = aim || balance || hockey || golf; canvas.width = 600; canvas.height = 450; const c = canvas.getContext('2d'); let point = null, active = false, tilt = { x: 0, y: 0 };
    function paint() {
      c.clearRect(0, 0, 600, 450); c.strokeStyle = '#657286'; c.lineWidth = 2; c.setLineDash([5, 10]); c.beginPath(); c.arc(300, 210, 140, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      const x = point?.x ?? 300, y = point?.y ?? 210; c.strokeStyle = '#b9ec72'; c.lineWidth = 5; c.beginPath(); c.moveTo(300, 210); c.lineTo(x, y); c.stroke(); c.fillStyle = '#b9ec72'; c.beginPath(); c.arc(x, y, 32, 0, Math.PI * 2); c.fill(); c.fillStyle = '#24301b'; c.font = '30px system-ui'; c.textAlign = 'center'; c.fillText(aim ? '↗' : '✥', x, y + 10);
    }
    const position = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 600, y: (e.clientY - r.top) / r.height * 450 }; };
    const move = e => { if (!active) return; const p = position(e); point = { x: Math.max(50, Math.min(550, p.x)), y: Math.max(40, Math.min(410, p.y)) }; if (balance || hockey) tilt = { x: Math.max(-1, Math.min(1, (point.x - 300) / 140)), y: Math.max(-1, Math.min(1, (point.y - 210) / 140)) }; paint(); };
    listen(canvas, 'pointerdown', e => { if (state.pauseReason || golf && !canPutt()) return; if (aim && (state.game.ids[state.game.turn] !== myId || state.game.projectile)) return; active = true; canvas.setPointerCapture(e.pointerId); move(e); });
    listen(canvas, 'pointermove', move);
    const stop = e => {
      if (!active) return;
      if ((aim || golf) && e.type === 'pointerup' && point) {
        const dx = golf ? 300 - point.x : Math.max(15, 300 - point.x), dy = golf ? point.y - 210 : Math.max(15, point.y - 210);
        if (!golf || Math.hypot(dx, dy) >= 12) send({ type: golf ? 'putt' : 'shoot', angle: Math.atan2(dy, dx) * 180 / Math.PI, power: Math.min(1, Math.hypot(dx, dy) / 200), ...(golf ? { round: state.game.round } : {}) });
      }
      active = false; point = null; tilt = { x: 0, y: 0 }; if (balance || hockey) send({ type: hockey ? 'skate' : 'tilt', ...tilt }); paint();
    };
    listen(canvas, 'pointerup', stop); listen(canvas, 'pointercancel', stop); paint();
    if (balance || hockey) {
      const timer = setInterval(() => { if (hockey || !motionActive) send({ type: hockey ? 'skate' : 'tilt', ...tilt }); }, 60);
      removers.push(() => clearInterval(timer));
      listen(window, 'blur', () => stop({ type: 'pointercancel' }));
      listen(document, 'visibilitychange', () => { if (document.hidden) stop({ type: 'pointercancel' }); });
    }
  }
  if (drawing) {
    drawing.width = 1000; drawing.height = 560; const c = drawing.getContext('2d'); c.strokeStyle = '#444753'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
    let active = false, lastAt = 0;
    const draw = (e, start = false) => { const now = performance.now(); if (!start && now - lastAt < 20) return; lastAt = now; const r = drawing.getBoundingClientRect(); const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); send({ type: 'stroke', x, y, start }); if (start) { c.beginPath(); c.moveTo(x * 1000, y * 560); } else { c.lineTo(x * 1000, y * 560); c.stroke(); } };
    state.game.strokes.forEach((p, i) => { if (p.start || i === 0) { c.beginPath(); c.moveTo(p.x * 1000, p.y * 560); } else { c.lineTo(p.x * 1000, p.y * 560); c.stroke(); } });
    listen(drawing, 'pointerdown', e => { if (state.pauseReason) return; active = true; drawing.setPointerCapture(e.pointerId); draw(e, true); });
    listen(drawing, 'pointermove', e => { if (active) draw(e); });
    listen(drawing, 'pointerup', () => { active = false; }); listen(drawing, 'pointercancel', () => { active = false; });
  }
  listen(window, 'keydown', e => { if (state?.game?.id !== 'snake') return; const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key]; if (direction) { e.preventDefault(); send({ type: 'direction', direction }); } });
  listen(window, 'keydown', e => { if (state?.game?.id === 'volley' && e.code === 'Space' && !e.repeat && !['INPUT', 'BUTTON'].includes(e.target.tagName)) { e.preventDefault(); send({ type: 'jump' }); } });
  cleanControl = () => { removers.forEach(fn => fn()); stopMotion(); };
}

let motionActive = false, motionHandler, motionTimer;
function stopMotion() { motionActive = false; if (motionHandler) window.removeEventListener('deviceorientation', motionHandler); clearInterval(motionTimer); }
async function enableMotion() {
  if (motionActive) { stopMotion(); $('#motion-status').textContent = 'Dokunmatik kumanda etkin.'; return; }
  if (!window.isSecureContext || !window.DeviceOrientationEvent) { toast('Hareket sensörü HTTPS bağlantısı gerektiriyor. Dokunmatik kumandayla oynayabilirsin.'); return; }
  try {
    if (typeof DeviceOrientationEvent.requestPermission === 'function' && await DeviceOrientationEvent.requestPermission() !== 'granted') throw new Error('Sensör izni verilmedi.');
    let neutral = null, value = { x: 0, y: 0 }, gotEvent = false;
    motionActive = true;
    motionHandler = e => { if (e.gamma === null || e.beta === null) return; gotEvent = true; if (!neutral) neutral = { x: e.gamma, y: e.beta }; value = { x: Math.max(-1, Math.min(1, (e.gamma - neutral.x) / 25)), y: Math.max(-1, Math.min(1, (e.beta - neutral.y) / 25)) }; };
    window.addEventListener('deviceorientation', motionHandler);
    motionTimer = setInterval(() => send({ type: 'tilt', ...value }), 60);
    $('#motion-status').textContent = 'Telefonu rahat tut. Bu duruş merkez kabul edilir. Düğmeye tekrar basarak dokunmatiğe dön.';
    setTimeout(() => { if (motionActive && !gotEvent) { stopMotion(); toast('Hareket verisi alınamadı. Dokunmatik kumanda etkin.'); } }, 2500);
  } catch (e) { toast(e.message); stopMotion(); }
}

async function boot() {
  try {
    const response = await fetch('/api/config'); if (!response.ok) throw new Error('Oyun salonu yüklenemedi.'); config = await response.json();
    const preferred = read('salon-base'); base = config.addresses.includes(preferred) ? preferred : config.addresses[0] || location.origin;
    if (role === 'host') { credentials = read('salon-host'); render(true); if (credentials?.hostToken) connect(); }
    else { const code = (query.get('room') || '').toUpperCase(); credentials = read(`salon-player-${code}`); if (credentials?.playerToken) { myId = credentials.id; connect(); } else joinForm(); }
  } catch (e) { root.innerHTML = `<div class="loading">salon<span>${esc(e.message)} Sayfayı yenileyin.</span></div>`; }
}
boot();
