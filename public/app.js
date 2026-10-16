import { art, avatars, renderBoard } from './render.js';

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
  return config.games.filter(g => category === 'Tümü' || g.category === category).map((g, i) => `<button class="game-card ${g.id === (state?.selected || 'sling') ? 'selected' : ''}" data-game="${g.id}" style="--accent:${g.color}" aria-label="${g.name} oyununu seç"><div class="card-art"><span class="card-index">0${i + 1}</span><span class="card-badge">${g.category}</span>${art(g.id, g.color)}</div><div class="card-copy"><h3>${g.name}</h3><p>${g.description}</p><div class="card-bottom"><span>♙ ${g.min}–${g.max} kişi · ${g.duration / 60 % 1 ? '1,5' : g.duration / 60} dk</span><span>${g.control} ↗</span></div></div></button>`).join('');
}

function lobby() {
  const g = meta();
  return `<div class="intro"><div><div class="eyebrow">Ekran büyük, eğlence daha büyük.</div><h1>Bu akşam ne oynuyoruz?</h1><p>Bir TV. Birkaç telefon. Bir sürü güzel anı.</p></div><span class="pill">✦ Her yaşa bir oyun</span></div><section class="hero" style="background:${g.color}"><div class="hero-copy"><div class="hero-label"><span>✦</span> ${state ? 'SIRADAKİ OYUNUNUZ' : 'BU AKŞAMIN İLK OYUNU'}</div><h2>${g.name}</h2><p>${g.description} ${g.id === 'sling' ? 'Açını bul, gücünü ayarla. Bakalım kaleyi kim devirecek?' : g.instruction.split('. ')[0] + '.'}</p><div class="hero-actions"><button class="primary" data-action="${state ? 'start' : 'create'}">${state ? 'Oyunu başlat' : 'Hadi başlayalım'} <span>↗</span></button><span class="meta">${g.min}–${g.max} kişi · ${g.duration / 60 % 1 ? '1,5' : g.duration / 60} dakika</span></div></div><div class="hero-art">${art(g.id, g.color)}</div></section><section><div class="section-heading"><h2>Oyun rafı <span class="tiny">/ 06</span></h2><nav class="tabs" aria-label="Oyun kategorileri">${['Tümü', 'Nostalji', 'Nişan & fizik', 'Parti', 'Birlikte'].map(t => `<button class="tab ${category === t ? 'active' : ''}" data-category="${t}" aria-pressed="${category === t}">${t}</button>`).join('')}</nav></div><div class="cards">${cards()}</div></section><div class="bottom-note"><span>◉ Kurulum yok. Kumanda yok. Telefonun yeter.</span><span>Biraz rekabet, bolca kahkaha. ✳</span></div>`;
}

function results(mobile = false) {
  const g = state.game; const ranking = [...state.players].filter(p => g.ids.includes(p.id)).sort((a, b) => g.scores[b.id] - g.scores[a.id]);
  const best = ranking[0]; const ties = ranking.filter(p => g.scores[p.id] === g.scores[best.id]);
  const title = g.id === 'balance' ? `Birlikte ${g.stars} yıldız!` : ties.length > 1 ? 'Zirveyi paylaştınız!' : `${esc(best.name)} kazandı!`;
  return `<div class="results"><div class="eyebrow">Güzel oyundu!</div><div class="trophy">${g.id === 'balance' ? '🌟' : '🏆'}</div><h2>${title}</h2><p>${g.id === 'balance' ? 'En iyi takım, sizin takımınız.' : 'Rövanş için hâlâ vaktimiz var.'}</p><div class="leaderboard">${ranking.map((p, i) => playerHTML(p, g.scores[p.id], i + 1)).join('')}</div>${mobile ? '<p>Sıradaki oyunu TV’den seçin.</p>' : '<div class="results-actions"><button class="primary" data-action="start">Bir daha oyna ↻</button><button class="secondary" data-action="lobby">Oyun rafına dön</button></div>'}</div>`;
}

function gameView() {
  const g = meta();
  return `<div class="game-top"><button class="secondary" data-action="exit-game" aria-label="Oyundan çık">←</button><div><div class="eyebrow">${g.category}</div><h1>${g.name}</h1></div><div class="timer" id="timer"></div></div><div class="game-message"><strong id="turn-message"></strong><span id="notice"></span></div><canvas class="board" id="board" aria-label="${g.name} ortak oyun ekranı"></canvas><p class="instruction">${g.instruction}</p><div class="scores" id="scores"></div>${g.id === 'draw' ? '<div class="guess-list" id="guesses"></div>' : ''}`;
}

function renderHost() {
  root.innerHTML = `<header>${brand}<div class="top-actions"><span class="connection"><i class="dot ${online || !state ? '' : 'off'}"></i><span id="connection-text">${state ? online ? 'Oda bağlantısı açık' : 'Yeniden bağlanıyor…' : 'Aile oyun salonu'}</span></span><button class="quiet" data-action="help">Nasıl oynanır?</button><button class="secondary" data-action="fullscreen" aria-label="Tam ekran">⛶</button></div></header><div class="shell"><main class="main">${state?.phase === 'playing' ? gameView() : state?.phase === 'results' ? results() : lobby()}</main>${sidebar()}</div>`;
}

function mobileShell(content) { return `<main class="mobile"><div class="mobile-header"><div class="brand"><i class="brandmark"></i>salon</div><span class="pill">${esc(state?.code || query.get('room') || 'Kumanda')}</span></div>${!online && state ? '<div class="reconnect">Bağlantı kesildi. Yeniden bağlanıyoruz…</div>' : ''}${state && !state.hostOnline ? '<div class="reconnect">TV ekranı bekleniyor. Oyun duraklatıldı.</div>' : ''}${content}</main>`; }

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
  if (['sling', 'archery'].includes(g.id)) controls = `<div class="control-info ${isTurn ? 'active' : ''}" id="mobile-turn"></div><canvas class="control-pad" id="aim-pad" aria-label="Topu geriye çekip bırakarak atış yap"></canvas><p class="pad-label">Topu aşağı ve sola çek. Bırakınca fırlat!</p><div class="control-tools"><button class="secondary" data-action="accessible-shot">45° orta güçte atış yap</button></div>`;
  if (g.id === 'snake') controls = `<div class="control-info">Elmalara koş! Duvara çarpsan da oyun devam eder.</div><div class="dpad"><button class="up" data-direction="up" aria-label="Yukarı">↑</button><button class="left" data-direction="left" aria-label="Sol">←</button><button class="right" data-direction="right" aria-label="Sağ">→</button><button class="down" data-direction="down" aria-label="Aşağı">↓</button></div><p class="pad-label">Gözün TV’de, parmakların burada.</p>`;
  if (g.id === 'pong') controls = `<div class="control-info">Raketini kaydır, topu oyunda tut!</div><label for="paddle">Raket konumu</label><input class="paddle-input" id="paddle" type="range" min="0.12" max="0.88" step="0.01" value="0.5"/><p class="pad-label">← Sola &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Sağa →</p>`;
  if (g.id === 'balance') controls = `<div class="control-info active">Birlikte yönlendirin. Yeşil yıldız sizin!</div><canvas class="control-pad" id="balance-pad" aria-label="Parmağını istediğin yöne kaydırarak topu yönlendir"></canvas><p class="pad-label">Parmağını gitmek istediğin yöne kaydır.</p><button class="secondary" data-action="motion" style="width:100%">Telefonu eğerek oyna</button><p class="pad-label" id="motion-status">Dokunmatik kumanda her telefonda çalışır.</p>`;
  if (g.id === 'draw') controls = isTurn ? `<p class="sub">Çizme sırası sende. Kelimeyi kimseye gösterme!</p><div class="secret-word" id="secret-word">Görev geliyor…</div><canvas class="control-pad draw-pad" id="draw-pad" aria-label="Çizim alanı"></canvas><div class="control-tools"><button class="secondary" data-action="clear">Çizimi temizle</button></div>` : `<div class="control-info">${esc(name(g.ids[g.turn]))} çiziyor. TV’ye bak ve tahmin et!</div><form class="guess-form" id="guess-form"><label for="guess">Sence bu ne?</label><input id="guess" name="guess" maxlength="50" placeholder="Tahminini yaz…" autocomplete="off" required/><button type="submit" class="primary">Tahmin et ↗</button></form><div class="guess-list" id="guesses"></div>`;
  root.innerHTML = mobileShell(`<div class="eyebrow">${esc(p?.name)} · <span id="my-score">0</span> puan</div><div class="game-top"><h1 class="control-title">${meta().name}</h1><span class="timer" id="timer"></span></div>${controls}`);
  bindControls();
}

function render(force = false) {
  const g = state?.game;
  const key = `${role}|${state?.code}|${state?.phase}|${state?.selected}|${role === 'player' ? `${g?.turn}|${g?.round}|${g?.ids.includes(myId)}|${state?.players.map(p => p.id).join()}|${state?.hostOnline}` : ''}|${online}`;
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
  if ($('#timer')) $('#timer').textContent = time((g.id === 'draw' ? Math.min(g.roundEnd, g.end) : g.end) - state.serverNow);
  if ($('#notice')) $('#notice').textContent = g.notice;
  const isTurn = g.ids[g.turn] === myId;
  if ($('#turn-message')) $('#turn-message').textContent = ['sling', 'archery'].includes(g.id) ? `Sıra ${name(g.ids[g.turn])} adlı oyuncuda · ${Math.max(0, 16 - Math.floor((state.serverNow - g.turnAt) / 1000))} sn` : g.id === 'draw' ? `${name(g.ids[g.turn])} çiziyor · ${g.round}. çizim` : g.id === 'balance' ? 'Hep birlikte aynı hedefe!' : 'Hazırsan, en yüksek puan senin!';
  if ($('#mobile-turn')) $('#mobile-turn').textContent = isTurn ? g.projectile ? 'Atışın yolda! TV’ye bak.' : 'Sıra sende! Nişan al ve bırak.' : `${name(g.ids[g.turn])} atış yapıyor. Sıranı bekle.`;
  if ($('#my-score')) $('#my-score').textContent = g.scores[myId] || 0;
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

function send(data) { if (online && state?.hostOnline && socket?.connected) socket.emit('input', data); }
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
  if (button.dataset.direction) { send({ type: 'direction', direction: button.dataset.direction }); return; }
  const action = button.dataset.action;
  if (action === 'create') {
    button.disabled = true;
    try { const response = await fetch('/api/rooms', { method: 'POST' }); const data = await response.json(); if (!response.ok) throw new Error(data.error); credentials = data; save('salon-host', data); connect(); } catch (error) { toast(error.message); button.disabled = false; }
  }
  if (action === 'start') host({ type: 'start' });
  if (action === 'lobby') host({ type: 'lobby' });
  if (action === 'exit-game') modal('Bu turdan çıkılsın mı?', 'Devam eden turun puanları sıfırlanacak. Herkes odada kalır; yeni bir oyun seçebilirsiniz.', 'Oyun rafına dön', () => host({ type: 'lobby' }));
  if (action === 'help') modal('Üç adımda oyun zamanı.', '1. TV ekranında bir oda oluşturun.<br>2. Telefonları aynı Wi-Fi ağına bağlayıp QR kodu okutun.<br>3. Herkes katılınca oyun seçin ve başlatın.<br><br>Misafirler turlar arasında oyuna katılır. Her oyunun açıklaması oyun ekranında görünür.');
  if (action === 'fullscreen') { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { toast('Bu tarayıcı tam ekranı desteklemiyor.'); } }
  if (action === 'copy') { try { await navigator.clipboard.writeText(joinUrl()); toast('Katılım bağlantısı kopyalandı.'); } catch { modal('Katılım bağlantısı', esc(joinUrl())); } }
  if (action === 'clear') { send({ type: 'clear' }); const c = $('#draw-pad')?.getContext('2d'); c?.clearRect(0, 0, 1000, 560); }
  if (action === 'accessible-shot') send({ type: 'shoot', angle: 45, power: .35 });
  if (action === 'motion') enableMotion();
});

root.addEventListener('change', e => { if (e.target.id === 'network') { base = e.target.value; save('salon-base', base); render(true); } });
root.addEventListener('input', e => { if (e.target.id === 'paddle') send({ type: 'paddle', x: Number(e.target.value) }); });
root.addEventListener('submit', e => {
  if (e.target.id === 'join-form') { e.preventDefault(); const form = new FormData(e.target); const code = String(form.get('code')).trim().toUpperCase(); const saved = read(`salon-player-${code}`); credentials = { code, name: String(form.get('name')).trim(), avatar: selectedAvatar, playerToken: saved?.playerToken }; if (!credentials.name) { toast('Bir oyuncu adı yazın.'); return; } e.target.querySelector('button[type=submit]').disabled = true; connect(); }
  if (e.target.id === 'guess-form') { e.preventDefault(); send({ type: 'guess', text: $('#guess').value }); $('#guess').value = ''; }
});

function bindControls() {
  const aim = $('#aim-pad');
  const balance = $('#balance-pad');
  const drawing = $('#draw-pad');
  const removers = [];
  const listen = (target, name, fn, options) => { target.addEventListener(name, fn, options); removers.push(() => target.removeEventListener(name, fn, options)); };
  if (aim || balance) {
    const canvas = aim || balance; canvas.width = 600; canvas.height = 450; const c = canvas.getContext('2d'); let point = null, active = false, tilt = { x: 0, y: 0 };
    function paint() {
      c.clearRect(0, 0, 600, 450); c.strokeStyle = '#657286'; c.lineWidth = 2; c.setLineDash([5, 10]); c.beginPath(); c.arc(300, 210, 140, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      const x = point?.x ?? 300, y = point?.y ?? 210; c.strokeStyle = '#b9ec72'; c.lineWidth = 5; c.beginPath(); c.moveTo(300, 210); c.lineTo(x, y); c.stroke(); c.fillStyle = '#b9ec72'; c.beginPath(); c.arc(x, y, 32, 0, Math.PI * 2); c.fill(); c.fillStyle = '#24301b'; c.font = '30px system-ui'; c.textAlign = 'center'; c.fillText(aim ? '↗' : '✥', x, y + 10);
    }
    const position = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 600, y: (e.clientY - r.top) / r.height * 450 }; };
    const move = e => { if (!active) return; const p = position(e); point = { x: Math.max(50, Math.min(550, p.x)), y: Math.max(40, Math.min(410, p.y)) }; if (balance) tilt = { x: Math.max(-1, Math.min(1, (point.x - 300) / 140)), y: Math.max(-1, Math.min(1, (point.y - 210) / 140)) }; paint(); };
    listen(canvas, 'pointerdown', e => { if (aim && (state.game.ids[state.game.turn] !== myId || state.game.projectile)) return; active = true; canvas.setPointerCapture(e.pointerId); move(e); });
    listen(canvas, 'pointermove', move);
    const stop = e => { if (!active) return; if (aim && e.type === 'pointerup' && point) { const dx = Math.max(15, 300 - point.x), dy = Math.max(15, point.y - 210); send({ type: 'shoot', angle: Math.atan2(dy, dx) * 180 / Math.PI, power: Math.min(1, Math.hypot(dx, dy) / 200) }); } active = false; point = null; tilt = { x: 0, y: 0 }; if (balance) send({ type: 'tilt', ...tilt }); paint(); };
    listen(canvas, 'pointerup', stop); listen(canvas, 'pointercancel', stop); paint();
    if (balance) { const timer = setInterval(() => { if (!motionActive) send({ type: 'tilt', ...tilt }); }, 60); removers.push(() => clearInterval(timer)); }
  }
  if (drawing) {
    drawing.width = 1000; drawing.height = 560; const c = drawing.getContext('2d'); c.strokeStyle = '#444753'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
    let active = false, lastAt = 0;
    const draw = (e, start = false) => { const now = performance.now(); if (!start && now - lastAt < 20) return; lastAt = now; const r = drawing.getBoundingClientRect(); const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); send({ type: 'stroke', x, y, start }); if (start) { c.beginPath(); c.moveTo(x * 1000, y * 560); } else { c.lineTo(x * 1000, y * 560); c.stroke(); } };
    state.game.strokes.forEach((p, i) => { if (p.start || i === 0) { c.beginPath(); c.moveTo(p.x * 1000, p.y * 560); } else { c.lineTo(p.x * 1000, p.y * 560); c.stroke(); } });
    listen(drawing, 'pointerdown', e => { active = true; drawing.setPointerCapture(e.pointerId); draw(e, true); });
    listen(drawing, 'pointermove', e => { if (active) draw(e); });
    listen(drawing, 'pointerup', () => { active = false; }); listen(drawing, 'pointercancel', () => { active = false; });
  }
  listen(window, 'keydown', e => { if (state?.game?.id !== 'snake') return; const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key]; if (direction) { e.preventDefault(); send({ type: 'direction', direction }); } });
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
