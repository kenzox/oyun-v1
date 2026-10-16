import { riverBanks, TEAM_COLORS } from './game-geometry.js';
import { CASUAL_ART, renderCasual } from './casual-render.js';
export const avatars = ['🐸', '🦊', '🐼', '🐙', '🐯', '🐨', '🐵', '🐰'];
export const memoryTiles = [
  { name: 'Mercan', symbol: '●', color: '#f5a7bb' },
  { name: 'Mavi', symbol: '▲', color: '#89c7f4' },
  { name: 'Yeşil', symbol: '■', color: '#b9ec72' },
  { name: 'Sarı', symbol: '★', color: '#f3d78c' },
];
export function art(id, color = '#b9ec72') {
  const start = `<svg viewBox="0 0 400 240" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><circle cx="210" cy="130" r="97" fill="${color}" opacity=".08"/><g stroke-linecap="round" stroke-linejoin="round">`;
  const shapes = {
    ...CASUAL_ART,
    volley: `<path d="M60 191Q190 171 340 191v30H60Z" fill="#d4af76"/><path d="M200 91v104M155 105h90m-90 18h90m-90 18h90m-70-36v44m22-44v44m22-44v44m22-44v44" stroke="#f7efdb" stroke-width="3"/><circle cx="126" cy="166" r="26" fill="#89c7f4"/><circle cx="279" cy="166" r="26" fill="#f5a7bb"/><circle cx="237" cy="62" r="26" fill="#f3dc80"/><path d="M215 50q31-4 36 32m-30-1q-2-22 30-30" stroke="#e9a269" stroke-width="4" fill="none"/><circle cx="118" cy="160" r="3" fill="#25303b"/><circle cx="134" cy="160" r="3" fill="#25303b"/><circle cx="271" cy="160" r="3" fill="#25303b"/><circle cx="287" cy="160" r="3" fill="#25303b"/>`,
    hockey: `<rect x="62" y="46" width="276" height="151" rx="35" fill="#dcecef"/><path d="M200 47v149" stroke="#d88a9e" stroke-width="3"/><circle cx="200" cy="121" r="34" stroke="#81b7cc" stroke-width="3" fill="none"/><circle cx="126" cy="107" r="22" fill="#68b0e5"/><circle cx="279" cy="150" r="22" fill="#e79cb0"/><path d="M139 120l27 26 20-6m81 22-27-14-14 4" stroke="#4e6872" stroke-width="7"/><ellipse cx="202" cy="152" rx="13" ry="8" fill="#29333c"/><path d="M64 96H51v50h13m272-50h13v50h-13" fill="none" stroke="#ac8491" stroke-width="5"/>`,
    memory: `<rect x="104" y="31" width="88" height="84" rx="20" fill="#f5a7bb"/><rect x="206" y="31" width="88" height="84" rx="20" fill="#89c7f4" opacity=".5"/><rect x="104" y="129" width="88" height="84" rx="20" fill="#b9ec72" opacity=".5"/><rect x="206" y="129" width="88" height="84" rx="20" fill="#f3d78c" opacity=".5"/><circle cx="148" cy="73" r="17" fill="#46343c"/><path d="M250 54l20 34h-40Z" fill="#2c485c"/><rect x="133" y="155" width="30" height="30" rx="4" fill="#3a4c29"/><text x="250" y="184" text-anchor="middle" font-size="44" fill="#685628">★</text><path d="M83 44l-12-10m11 34-17 1m253-18 13-9" stroke="#f3d78c" stroke-width="4"/>`,
    river: `<rect x="50" y="20" width="300" height="200" rx="25" fill="#385b3f"/><path d="M110 20Q210 65 130 115T180 220h130Q210 170 280 120T240 20Z" fill="#40769a" stroke="#c9bc81" stroke-width="5"/><path d="M205 130l-28 48 20-7v28h16v-28l20 7Z" fill="#d7ed99"/><rect x="201" y="151" width="8" height="14" rx="3" fill="#426258"/><path d="M205 109V94" stroke="#e8efb3" stroke-width="5"/><rect x="127" y="50" width="32" height="41" rx="5" fill="#a9b47c"/><rect x="120" y="49" width="8" height="44" rx="3" fill="#253d2b"/><rect x="158" y="49" width="8" height="44" rx="3" fill="#253d2b"/><path d="M143 72v29" stroke="#d7ddad" stroke-width="7"/><path d="M264 94l-22-25 15 3V54h14v18l15-3Z" fill="#f5a7bb"/><circle cx="79" cy="121" r="15" fill="#24472d"/><circle cx="322" cy="174" r="15" fill="#24472d"/>`,
    sling: `<ellipse cx="221" cy="210" rx="150" ry="12" fill="#253321" opacity=".15"/><path d="M111 199V143L86 110M111 143L139 105" stroke="#654332" stroke-width="17"/><path d="M86 107L52 143L139 104" stroke="#39302a" stroke-width="5"/><circle cx="51" cy="143" r="17" fill="#f5f2e4"/><circle cx="47" cy="138" r="3" fill="#263322"/><circle cx="56" cy="138" r="3" fill="#263322"/><path d="M102 89Q181 1 275 86" stroke="#435d32" stroke-width="3" stroke-dasharray="2 12" fill="none" opacity=".5"/><g fill="#d9924d" stroke="#815932" stroke-width="3"><rect x="252" y="158" width="45" height="45" rx="4"/><rect x="303" y="158" width="45" height="45" rx="4"/><rect x="275" y="109" width="45" height="45" rx="4"/></g><g stroke="#815932" stroke-width="2"><path d="M258 165L291 197M291 165L258 197M309 165L342 197M342 165L309 197M281 115L314 148M314 115L281 148"/></g><circle cx="297" cy="87" r="20" fill="#f5df6e"/><path d="M297 72L301 82L312 83L303 90L305 101L297 95L288 101L290 90L282 83L293 82" fill="#b27e24"/><path d="M180 184l8-13m-2 22 14-2M332 69l8-11m0 22 13-1" stroke="#55733d" stroke-width="3"/>`,
    archery: `<circle cx="267" cy="122" r="69" fill="#8f7ab8"/><circle cx="267" cy="122" r="51" fill="#e8ddff"/><circle cx="267" cy="122" r="34" fill="#a58bca"/><circle cx="267" cy="122" r="16" fill="#f3df83"/><path d="M82 51Q173 122 82 196L117 122Z" fill="none" stroke="#c8ab7b" stroke-width="9"/><path d="M84 52L117 122L84 195" fill="none" stroke="#eee0d2" stroke-width="2"/><path d="M117 122H265" stroke="#eee0d2" stroke-width="6"/><path d="M249 112L271 122L249 132" fill="#f3df83"/><path d="M119 122L106 108M130 122L117 108" stroke="#b79ee6" stroke-width="6"/><path d="M187 58l7-13m-2 26 15-4" stroke="#ddcef8" stroke-width="3"/>`,
    snake: `<g stroke="#fff" opacity=".05" stroke-width="1"><path d="M70 40V210M110 40V210M150 40V210M190 40V210M230 40V210M270 40V210M310 40V210M70 50H330M70 90H330M70 130H330M70 170H330M70 210H330"/></g><path d="M109 179H189V99H269V140" fill="none" stroke="#e9b169" stroke-width="32"/><rect x="251" y="124" width="36" height="39" rx="13" fill="#f8cc89"/><circle cx="259" cy="148" r="4" fill="#473321"/><circle cx="278" cy="148" r="4" fill="#473321"/><path d="M267 163v12m0-1-6 6m6-6 6 6" fill="none" stroke="#ef897d" stroke-width="3"/><circle cx="126" cy="77" r="17" fill="#e57d6f"/><path d="M127 61q-4-15 10-17" fill="none" stroke="#a3c17e" stroke-width="5"/><circle cx="315" cy="185" r="5" fill="#e9b169"/>`,
    pong: `<path d="M90 201H310" stroke="#8bc0ec" opacity=".15" stroke-width="2"/><g fill="#83bce6"><rect x="94" y="52" width="47" height="19" rx="4"/><rect x="149" y="52" width="47" height="19" rx="4"/><rect x="204" y="52" width="47" height="19" rx="4"/><rect x="259" y="52" width="47" height="19" rx="4"/></g><g fill="#567f9f"><rect x="94" y="79" width="47" height="19" rx="4"/><rect x="149" y="79" width="47" height="19" rx="4"/><rect x="259" y="79" width="47" height="19" rx="4"/></g><path d="M219 99L177 157L211 190" fill="none" stroke="#e2f4ff" stroke-width="2" stroke-dasharray="4 8" opacity=".5"/><circle cx="203" cy="130" r="10" fill="#f2eada"/><rect x="167" y="191" width="93" height="14" rx="7" fill="#8dcaff"/><path d="M222 82l7-9m4 17 11-1" stroke="#e4f4ff" stroke-width="3"/>`,
    draw: `<g transform="rotate(-9 200 120)"><rect x="104" y="38" width="183" height="169" rx="10" fill="#f5eadc"/><path d="M135 127L145 88L165 108Q192 94 215 109L235 88L243 136Q232 174 191 173Q145 171 135 127Z" fill="none" stroke="#927284" stroke-width="5"/><circle cx="170" cy="133" r="4" fill="#927284"/><circle cx="210" cy="133" r="4" fill="#927284"/><path d="M185 145l6 6 6-6M147 143l-25-5m25 14-25 3m112-13 26-6m-26 15 25 4" stroke="#927284" stroke-width="3" fill="none"/></g><g transform="rotate(35 281 151)"><rect x="272" y="86" width="18" height="100" rx="3" fill="#f1a4bc"/><path d="M272 186l9 23 9-23" fill="#d6b88e"/><path d="M278 202l3 7 3-7" fill="#4e3b43"/><rect x="272" y="84" width="18" height="15" rx="3" fill="#c77794"/></g>`,
    balance: `<ellipse cx="203" cy="186" rx="124" ry="25" fill="#152b29" opacity=".3"/><g transform="rotate(-8 200 140)"><rect x="77" y="122" width="246" height="35" rx="17" fill="#4c8d7d"/><rect x="77" y="116" width="246" height="24" rx="12" fill="#9bdaca"/><circle cx="149" cy="93" r="26" fill="#f1ead8"/><circle cx="142" cy="86" r="7" fill="#fff" opacity=".6"/><circle cx="277" cy="127" r="13" fill="#315f55"/></g><path d="M202 151l-24 46h48Z" fill="#6eb4a2"/><path d="M268 55l5 11 12 2-9 8 2 12-10-6-11 6 2-12-9-8 13-2Z" fill="#ecd77e"/><path d="M94 69l5-11m4 22 12-2" stroke="#a4e5d3" stroke-width="3"/>`,
  };
  return start + shapes[id] + '</g></svg>';
}

const circle = (c, x, y, r, fill) => { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
const rect = (c, x, y, w, h, fill, r = 0) => { c.fillStyle = fill; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
const label = (c, text, x, y, size = 20, color = '#f6f0df', align = 'center') => { c.fillStyle = color; c.font = `600 ${size}px system-ui`; c.textAlign = align; c.fillText(text, x, y); };

export function renderBoard(canvas, state) {
  if (!canvas || !state.game) return;
  const c = canvas.getContext('2d'); const g = state.game; const W = 1000, H = 560;
  if (canvas.width !== W) { canvas.width = W; canvas.height = H; }
  c.clearRect(0, 0, W, H);
  const player = id => state.players.find(p => p.id === id) || { color: '#fff', name: '', avatar: 0 };
  const gradient = c.createLinearGradient(0, 0, 0, H); gradient.addColorStop(0, '#25353e'); gradient.addColorStop(1, '#344742'); c.fillStyle = gradient; c.fillRect(0, 0, W, H);
  if (['sling', 'archery'].includes(g.id)) {
    circle(c, 825, 92, 42, '#f1e5b6');
    c.fillStyle = '#3e5750'; c.beginPath(); c.moveTo(0, 390); c.quadraticCurveTo(250, 230, 530, 390); c.quadraticCurveTo(800, 210, 1000, 350); c.lineTo(1000, 560); c.lineTo(0, 560); c.fill();
    rect(c, 0, 525, 1000, 35, '#24392d'); rect(c, 0, 522, 1000, 5, '#7e9f62');
    g.trail.forEach((p, i) => circle(c, p.x, p.y, 2 + i / g.trail.length * 2, '#ffffff55'));
    if (g.id === 'sling') {
      c.lineCap = 'round'; c.strokeStyle = '#a37a51'; c.lineWidth = 18; c.beginPath(); c.moveTo(145, 520); c.lineTo(145, 446); c.lineTo(113, 411); c.moveTo(145, 446); c.lineTo(173, 411); c.stroke();
      c.strokeStyle = '#e0c28d'; c.lineWidth = 4; c.beginPath(); c.moveTo(113, 410); c.lineTo(145, 430); c.lineTo(173, 410); c.stroke();
      if (!g.projectile) circle(c, 145, 419, 14, player(g.ids[g.turn]).color);
      g.blocks.filter(b => b.alive).forEach(b => { rect(c, b.x, b.y, b.w, b.h, b.star ? '#e8ca6e' : '#b58455', 4); c.strokeStyle = '#735638'; c.lineWidth = 2; c.strokeRect(b.x + 5, b.y + 5, b.w - 10, b.h - 10); if (b.star) label(c, '★', b.x + 24, b.y + 34, 29, '#8c682d'); else { c.beginPath(); c.moveTo(b.x + 6, b.y + 6); c.lineTo(b.x + 42, b.y + 42); c.moveTo(b.x + 42, b.y + 6); c.lineTo(b.x + 6, b.y + 42); c.stroke(); } });
    } else {
      g.archers.forEach((a, i) => { const p = player(a.id); rect(c, a.x - 35, a.y + 10, 70, 530 - a.y, '#465648', 6); circle(c, a.x, a.y - 22, 25, p.color); label(c, avatars[p.avatar], a.x, a.y - 12, 32); label(c, p.name, a.x, a.y + 48, 13); if (i === g.turn) label(c, '▼', a.x, a.y - 65, 22, p.color); });
    }
    if (g.projectile) {
      const p = g.projectile;
      if (g.id === 'sling') { circle(c, p.x, p.y, 13, player(p.owner).color); circle(c, p.x - 3, p.y - 3, 3, '#263322'); circle(c, p.x + 4, p.y - 3, 3, '#263322'); }
      else { c.save(); c.translate(p.x, p.y); c.rotate(Math.atan2(p.vy, p.vx)); rect(c, -25, -3, 35, 6, '#dfc49c', 2); c.fillStyle = player(p.owner).color; c.beginPath(); c.moveTo(18, 0); c.lineTo(4, -9); c.lineTo(4, 9); c.fill(); c.restore(); }
    }
  }
  if (g.id === 'snake') {
    rect(c, 0, 0, W, H, '#202d2e'); const cell = 29, ox = 36, oy = 19;
    for (let x = 0; x < 32; x++) for (let y = 0; y < 18; y++) if ((x + y) % 2 === 0) rect(c, ox + x * cell, oy + y * cell, cell, cell, '#293637', 3);
    g.apples.forEach(a => { circle(c, ox + a.x * cell + 14, oy + a.y * cell + 15, 9, '#ee9985'); rect(c, ox + a.x * cell + 13, oy + a.y * cell + 2, 4, 7, '#b9ec72', 2); });
    g.snakes.forEach(s => s.body.forEach((b, i) => { rect(c, ox + b.x * cell + 2, oy + b.y * cell + 2, 25, 25, player(s.id).color, 7); if (i === 0) { circle(c, ox + b.x * cell + 9, oy + b.y * cell + 10, 3, '#233034'); circle(c, ox + b.x * cell + 19, oy + b.y * cell + 10, 3, '#233034'); } }));
  }
  if (g.id === 'pong') {
    rect(c, 0, 0, W, H, '#202a36'); const cols = g.lanes.length <= 4 ? g.lanes.length : 4, rows = Math.ceil(g.lanes.length / cols);
    const lw = 980 / cols, lh = 530 / rows;
    g.lanes.forEach((l, i) => { const x = 10 + (i % cols) * lw, y = 15 + Math.floor(i / cols) * lh; const p = player(l.id); rect(c, x + 4, y, lw - 8, lh - 7, '#293545', 10); label(c, p.name, x + lw / 2, y + 23, 13, p.color); l.bricks.filter(b => b.alive).forEach(b => rect(c, x + b.x * lw, y + b.y * lh, .14 * lw, .05 * lh, p.color, 3)); circle(c, x + l.ball.x * lw, y + l.ball.y * lh, 6, '#fff5de'); rect(c, x + (l.paddle - .12) * lw, y + .9 * lh, .24 * lw, 9, p.color, 4); });
  }
  if (g.id === 'draw') {
    rect(c, 0, 0, W, H, '#faf3e5'); c.strokeStyle = '#444753'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    g.strokes.forEach((p, i) => { if (p.start || i === 0) c.moveTo(p.x * W, p.y * H); else c.lineTo(p.x * W, p.y * H); }); c.stroke();
    if (!g.strokes.length) label(c, `${player(g.ids[g.turn]).name} çiziyor…`, 500, 275, 25, '#a5a096');
  }
  if (g.id === 'balance') {
    rect(c, 0, 0, W, H, '#2b3e3a'); rect(c, 24, 24, 952, 512, '#496057', 20);
    for (let x = 70; x < 970; x += 60) for (let y = 70; y < 530; y += 60) circle(c, x, y, 2, '#ffffff12');
    g.holes.forEach(h => { circle(c, h.x, h.y, 33, '#a7796c'); circle(c, h.x, h.y, 25, '#1f2b29'); });
    circle(c, g.target.x, g.target.y, 35, '#b9ec7233'); circle(c, g.target.x, g.target.y, 25, '#b9ec72'); label(c, '★', g.target.x, g.target.y + 10, 28, '#476233');
    circle(c, g.ball.x + 5, g.ball.y + 8, 18, '#0003'); circle(c, g.ball.x, g.ball.y, 18, '#f4ead5'); circle(c, g.ball.x - 5, g.ball.y - 5, 5, '#fff');
    label(c, `★ ${g.stars}`, 930, 65, 24, '#d4edb9');
  }
  if (g.id === 'memory') {
    rect(c, 0, 0, W, H, '#252b38');
    label(c, g.stage === 'show' ? 'İZLE VE HATIRLA' : g.stage === 'answer' ? 'SIRA SENDE · TELEFONUNA DOKUN' : 'YENİ SERİ GELİYOR', 500, 55, 24);
    label(c, `${g.round}. tur · ${g.sequenceLength} renk`, 500, 87, 17, '#a5adb9');
    memoryTiles.forEach((t, i) => {
      const x = 275 + (i % 2) * 235, y = 115 + Math.floor(i / 2) * 180;
      const lit = g.activeTile === i && !state.pauseReason;
      rect(c, x, y, 215, 160, lit ? t.color : '#353e4e', 22);
      c.strokeStyle = t.color; c.lineWidth = lit ? 5 : 2; c.strokeRect(x + 10, y + 10, 195, 140);
      label(c, t.symbol, x + 107, y + 88, 62, lit ? '#28303a' : t.color);
      label(c, `${i + 1} · ${t.name}`, x + 107, y + 132, 16, lit ? '#28303a' : '#a7b0be');
    });
    const ready = Object.values(g.outcomes).length;
    label(c, g.stage === 'show' ? 'Renklerin yanında şekilleri de hatırlayabilirsin.' : `${ready} / ${g.ids.length} oyuncu tamamladı`, 500, 525, 17, '#bcc3d0');
  }
  if (g.id === 'river') {
    rect(c, 0, 0, W, H, '#34533b');
    c.beginPath();
    for (let y = 0; y <= 560; y += 8) { const b = riverBanks(g.distance, y); if (y === 0) c.moveTo(b.left, y); else c.lineTo(b.left, y); }
    for (let y = 560; y >= 0; y -= 8) c.lineTo(riverBanks(g.distance, y).right, y);
    c.closePath(); c.fillStyle = '#244b68'; c.fill(); c.strokeStyle = '#c8b57d'; c.lineWidth = 8; c.stroke();
    for (let i = 0; i < 35; i++) {
      const y = (i * 73 + g.distance) % 560, banks = riverBanks(g.distance, y);
      const x = banks.left + 45 + (i * 97 % Math.max(1, banks.right - banks.left - 100));
      rect(c, x, y, 3, 16, '#9ed6f026', 2);
      circle(c, i % 2 ? banks.left - 45 : banks.right + 45, y, 15, '#203f2d');
    }
    g.enemies.filter(e => e.alive).forEach(e => {
      if (e.kind === 'tank') {
        rect(c, e.x - 22, e.y - 22, 10, 44, '#293b2c', 3); rect(c, e.x + 12, e.y - 22, 10, 44, '#293b2c', 3);
        rect(c, e.x - 16, e.y - 20, 32, 40, '#a6b47d', 5); circle(c, e.x, e.y, 10, '#657e53'); rect(c, e.x - 4, e.y, 8, 30, '#d0d9a2', 3);
      } else {
        c.fillStyle = '#f5a7bb'; c.beginPath(); c.moveTo(e.x, e.y + 24); c.lineTo(e.x - 28, e.y - 8); c.lineTo(e.x - 8, e.y - 4); c.lineTo(e.x - 8, e.y - 23); c.lineTo(e.x + 8, e.y - 23); c.lineTo(e.x + 8, e.y - 4); c.lineTo(e.x + 28, e.y - 8); c.closePath(); c.fill();
        rect(c, e.x - 4, e.y, 8, 10, '#623e53', 2);
      }
    });
    g.shots.forEach(s => rect(c, s.x - 3, s.y, 6, 14, player(s.owner).color, 3));
    g.enemyShots.forEach(s => rect(c, s.x - 4, s.y, 8, 16, '#f5a7bb', 4));
    g.ships.forEach(s => {
      const p = player(s.id); c.save(); if (!p.connected) c.globalAlpha = .25;
      if (s.protection > 0) circle(c, s.x, 488, 31, '#89c7f43a');
      c.fillStyle = p.color; c.beginPath(); c.moveTo(s.x, 468); c.lineTo(s.x - 24, 505); c.lineTo(s.x + 24, 505); c.closePath(); c.fill();
      rect(c, s.x - 5, 483, 10, 12, '#253449', 3); label(c, p.name, s.x, 535, 13, p.color); c.restore();
    });
    rect(c, 15, 12, 245, 38, '#191f33e8', 10); label(c, `ETAP ${g.wave} · TAKIM ${g.teamScore}`, 30, 38, 18, '#ccd7ff', 'left');
    rect(c, 735, 12, 250, 38, '#191f33e8', 10); label(c, `KALKAN ${'♥'.repeat(g.shields)}${'♡'.repeat(6 - g.shields)}`, 970, 38, 18, '#f5a7bb', 'right');
  }
  if (g.teams) {
    if (g.id === 'volley') {
      rect(c, 0, 0, W, H, '#9bd0d5'); circle(c, 840, 110, 47, '#fff1b2');
      rect(c, 0, 370, 1000, 130, '#74aeb7'); rect(c, 0, 500, 1000, 60, '#e1c18c');
      rect(c, 492, 330, 16, 170, '#f5eee1', 3);
      for (let y = 350; y < 500; y += 20) rect(c, 496, y, 8, 2, '#9b9685');
      circle(c, g.ball.x, g.ball.y, 16, '#f7df83');
      c.strokeStyle = '#cda45e'; c.lineWidth = 2; c.beginPath(); c.arc(g.ball.x - 7, g.ball.y, 12, -.9, .9); c.stroke();
    } else {
      rect(c, 0, 0, W, H, '#3d5764'); rect(c, 20, 56, 960, 448, '#e3eff0', 50);
      c.strokeStyle = '#b9778d'; c.lineWidth = 3; c.beginPath(); c.moveTo(500, 56); c.lineTo(500, 504); c.stroke();
      c.strokeStyle = '#8bb8cb'; c.beginPath(); c.arc(500, 280, 65, 0, Math.PI * 2); c.stroke();
      [200, 800].forEach(x => { c.beginPath(); c.arc(x, 280, 55, 0, Math.PI * 2); c.stroke(); });
      rect(c, 5, 210, 25, 140, TEAM_COLORS[0], 4); rect(c, 970, 210, 25, 140, TEAM_COLORS[1], 4);
      circle(c, g.ball.x + 2, g.ball.y + 3, 12, '#10232b33'); circle(c, g.ball.x, g.ball.y, 11, '#293841');
    }
    g.athletes.forEach(a => {
      const p = player(a.id); c.save(); if (!p.connected) c.globalAlpha = .3;
      circle(c, a.x, a.y, 26, TEAM_COLORS[a.team]); circle(c, a.x, a.y, 20, '#ffffff77');
      label(c, avatars[p.avatar], a.x, a.y + 10, 28, '#25303b');
      label(c, p.name, a.x, a.y + 44, 13, g.id === 'volley' ? '#374e58' : '#344854'); c.restore();
    });
    rect(c, 310, 5, 380, 44, '#263343e8', 12); label(c, `MAVİ  ${g.teamScores[0]}  —  ${g.teamScores[1]}  MERCAN`, 500, 35, 23);
    if (state.serverNow < g.serveAt) {
      rect(c, 350, 170, 300, 78, '#263343de', 14);
      label(c, `Hazır! ${Math.ceil((g.serveAt - state.serverNow) / 1000)}`, 500, 219, 30, '#fff1b2');
    }
  }
  renderCasual(c, state);
  if (state.pauseReason) {
    rect(c, 0, 0, W, H, '#151922c9');
    label(c, 'KISA BİR MOLA', 500, 260, 36, '#b9ec72');
    label(c, state.pauseReason === 'host' ? 'TV bağlantısı bekleniyor.' : state.pauseReason === 'players' ? 'Oyuncuların bağlantısı bekleniyor.' : 'TV’den devam edebilirsiniz. Süre ve puanlar korunuyor.', 500, 305, 20);
  }
}
