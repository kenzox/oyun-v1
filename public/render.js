export const avatars = ['🐸', '🦊', '🐼', '🐙', '🐯', '🐨', '🐵', '🐰'];
export function art(id, color = '#b9ec72') {
  const start = `<svg viewBox="0 0 400 240" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><circle cx="210" cy="130" r="97" fill="${color}" opacity=".08"/><g stroke-linecap="round" stroke-linejoin="round">`;
  const shapes = {
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
}
