import { RACE_LENGTH, raceObstacle, POOL_POCKETS } from './arcade-rules.js';
import { TEAM_COLORS } from './game-geometry.js';
const DEPTH_BADGE = '<rect x="279" y="183" width="72" height="34" rx="12" fill="#283548"/><text x="315" y="207" font-family="system-ui" font-size="22" font-weight="700" text-anchor="middle" fill="#d1efc1">3D</text>';
export const ARCADE_ART = {
  race: `<path d="M110 240 153 0h94l43 240" fill="#3e4653"/><path d="M190 220v-30m7-40v-30m3-40V50" stroke="#eee4c6" stroke-width="5"/><g transform="rotate(-12 153 155)"><rect x="125" y="108" width="56" height="92" rx="18" fill="#eea764"/><rect x="132" y="128" width="42" height="29" rx="7" fill="#314552"/><path d="M132 179h42" stroke="#ffe6ae" stroke-width="5"/></g><rect x="227" y="51" width="36" height="64" rx="12" fill="#9ebbed"/><path d="M100 199 75 214m29-44-26 5m200-48 24 7" stroke="#f3d58e" stroke-width="4"/>`,
  pool: `<rect x="51" y="44" width="298" height="155" rx="20" fill="#a98158"/><rect x="61" y="54" width="278" height="135" rx="14" fill="#34795e"/><g fill="#192f29"><circle cx="68" cy="61" r="12"/><circle cx="200" cy="59" r="12"/><circle cx="332" cy="61" r="12"/><circle cx="68" cy="183" r="12"/><circle cx="200" cy="184" r="12"/><circle cx="332" cy="183" r="12"/></g><path d="m53 210 95-65" stroke="#e8c698" stroke-width="6"/><circle cx="119" cy="132" r="12" fill="#fff5de"/><circle cx="245" cy="115" r="13" fill="#f5c76f"/><circle cx="272" cy="101" r="13" fill="#8bb9ee"/><circle cx="272" cy="130" r="13" fill="#e7a0b7"/>`,
  tennis: `<rect x="54" y="44" width="292" height="157" rx="10" fill="#729559"/><path d="M70 58h260v129H70Zm130 0v129m-130-25h260M70 83h260m-60 0v79m120-79v79" fill="none" stroke="#e9ebcc" stroke-width="3"/><ellipse cx="122" cy="128" rx="20" ry="29" transform="rotate(-30 122 128)" fill="#c7dd95" stroke="#e5efc4" stroke-width="5"/><path d="m137 153 19 28m100-90-19-28" stroke="#dacba6" stroke-width="8"/><ellipse cx="271" cy="118" rx="20" ry="29" transform="rotate(-30 271 118)" fill="#c7dd95" stroke="#e5efc4" stroke-width="5"/><circle cx="208" cy="100" r="11" fill="#e8ec89"/>`,
  laser: `<path d="m48 190 152-90 152 90m-152-90v112M48 190h304" stroke="#6673a4" stroke-width="3" fill="none"/><circle cx="202" cy="104" r="41" fill="#5b6fa5" stroke="#bfd1fa" stroke-width="4"/><circle cx="202" cy="104" r="18" fill="#f2c988"/><path d="M202 45v30m0 58v30m-59-59h30m58 0h30" stroke="#daf1c3" stroke-width="4"/><path d="m95 221 85-94m130 95-84-94" stroke="#aabefa" stroke-width="6"/><circle cx="300" cy="71" r="14" fill="#efcf86"/>`,
};
ARCADE_ART.pool3d = ARCADE_ART.pool + DEPTH_BADGE;
ARCADE_ART.race3d = ARCADE_ART.race + DEPTH_BADGE;

const rect = (c, x, y, w, h, fill, r = 0) => { c.fillStyle = fill; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
const circle = (c, x, y, r, fill) => { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
const label = (c, text, x, y, size = 20, color = '#f3efd9') => { c.font = `600 ${size}px system-ui`; c.textAlign = 'center'; c.fillStyle = color; c.fillText(text, x, y); };
const line = (c, x, y, x2, y2, color, width = 2) => { c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); };
const ballColors = ['#faf3df', '#f5cf74', '#81b9eb', '#ed9cb1', '#bca1e7', '#e9a66e', '#91d7b0'];
function car(c, x, y, color) {
  rect(c, x - 25, y - 33, 50, 73, '#171c25', 9); rect(c, x - 21, y - 38, 42, 76, color, 12);
  rect(c, x - 16, y - 20, 32, 22, '#283e50', 5); rect(c, x - 15, y + 22, 30, 8, '#ffe2a7', 3);
}
export function renderLaserScene(c, state, myId) {
  const g = state.game;
  rect(c, 0, 0, 1000, 560, '#20283c'); rect(c, 60, 60, 880, 400, '#2c3754', 20);
  for (let x = -400; x <= 1400; x += 150) line(c, 500, 180, x, 560, '#536181');
  for (const y of [320, 375, 460, 555]) line(c, 0, y, 1000, y, '#536181');
  rect(c, 200, 85, 600, 170, '#28324b', 12);
  for (const t of g.targets) {
    c.save(); if (myId && t.hitBy.includes(myId)) c.globalAlpha = .3;
    const color = t.kind === 'gold' ? '#f3cf74' : t.kind === 'shield' ? '#93d3aa' : '#b4c4f7';
    circle(c, t.x, t.y + 6, t.radius + 4, '#141f35'); circle(c, t.x, t.y, t.radius, color); circle(c, t.x, t.y, t.radius * .7, '#34435f');
    label(c, t.kind === 'shield' ? '✓' : t.kind === 'gold' ? '★' : '⊕', t.x, t.y + 9, t.radius, color);
    c.restore();
  }
  g.shooters.filter(p => !myId || p.id === myId).forEach((p, i) => {
    const player = state.players.find(player => player.id === p.id), color = player?.color || '#fff';
    if (state.serverNow < p.flashUntil) line(c, 500 + (i - 3.5) * 18, 560, p.x, p.y, color, 4);
    c.strokeStyle = color; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, 13, 0, Math.PI * 2); c.stroke();
    line(c, p.x - 24, p.y, p.x - 7, p.y, color); line(c, p.x + 7, p.y, p.x + 24, p.y, color);
    line(c, p.x, p.y - 24, p.x, p.y - 7, color); line(c, p.x, p.y + 7, p.x, p.y + 24, color);
    label(c, player?.name?.slice(0, 12) || String(i + 1), p.x, p.y + 38, 13, color);
  });
  label(c, 'DRONE +10    ALTIN +25    KALKAN −5', 500, 36, 23, '#d5dff7');
  rect(c, 425, 502, 150, 65, '#7483ad', 15); rect(c, 465, 478, 70, 58, '#b8c9e7', 12);
}
export function renderArcade(c, state) {
  const g = state.game, player = id => state.players.find(p => p.id === id) || { name: '', color: '#fff' };
  if (g.id === 'race') {
    const cols = g.racers.length <= 2 ? g.racers.length : g.racers.length <= 4 ? 2 : 4, rows = Math.ceil(g.racers.length / cols), w = 1000 / cols, h = 560 / rows;
    rect(c, 0, 0, 1000, 560, '#202d29');
    g.racers.forEach((r, i) => {
      c.save(); c.translate(i % cols * w, Math.floor(i / cols) * h); c.scale(w / 500, h / 560);
      c.beginPath(); c.rect(2, 2, 496, 556); c.clip();
      rect(c, 0, 0, 500, 560, '#3e5f48'); rect(c, 66, 38, 368, 470, '#ddd4b4'); rect(c, 80, 38, 340, 470, '#39414c');
      for (const x of [80 + 340 / 3, 80 + 680 / 3]) for (let y = -30 + r.distance * 1.1 % 60; y < 510; y += 60) rect(c, x - 2, y, 4, 28, '#dfdfc9');
      for (let row = Math.max(0, r.nextRow - 1); row < r.nextRow + 5; row++) {
        const o = raceObstacle(row, g.seed), y = 435 - (o.distance - r.distance) * 1.1;
        if (y > 60 && y < 510 && o.distance < RACE_LENGTH) car(c, 80 + o.lane * 340, y, '#8293a5');
      }
      if (state.serverNow < r.boostUntil) { line(c, 80 + r.x * 340 - 12, 466, 80 + r.x * 340 - 12, 500, '#eed086', 8); line(c, 80 + r.x * 340 + 12, 466, 80 + r.x * 340 + 12, 500, '#eed086', 8); }
      car(c, 80 + r.x * 340, 435, state.serverNow < r.crashUntil ? '#f5e6db' : player(r.id).color);
      rect(c, 0, 0, 500, 44, '#202c31'); label(c, player(r.id).name, 250, 30, 24, player(r.id).color);
      rect(c, 0, 508, 500, 52, '#202c31'); label(c, r.finished ? `FİNİŞ · ${r.place}. sıra` : `${Math.min(3, Math.floor(r.distance / 1000) + 1)}/3 tur · ${Math.floor(r.distance)} m`, 250, 542, 22);
      rect(c, 5, 50, 9, 450, '#9fbd8a30'); rect(c, 5, 500 - r.distance / RACE_LENGTH * 450, 9, r.distance / RACE_LENGTH * 450, player(r.id).color);
      c.restore();
    });
  }
  if (g.id === 'pool') {
    rect(c, 0, 0, 1000, 560, '#25362e'); rect(c, 38, 68, 924, 424, '#a57a50', 28); rect(c, 60, 90, 880, 380, '#34765d', 15);
    POOL_POCKETS.forEach(p => circle(c, p.x, p.y, 25, '#172c25'));
    const cue = g.balls[0];
    if (!g.rolling && !cue.sunk) {
      const a = g.aim.angle * Math.PI / 180, dx = Math.cos(a), dy = -Math.sin(a);
      c.save(); c.beginPath(); c.rect(60, 90, 880, 380); c.clip(); c.setLineDash([6, 7]); line(c, cue.x, cue.y, cue.x + dx * 230, cue.y + dy * 230, '#edeecc88'); c.setLineDash([]);
      line(c, cue.x - dx * 22, cue.y - dy * 22, cue.x - dx * 140, cue.y - dy * 140, '#d4b586', 6); c.restore();
    }
    g.balls.filter(b => !b.sunk).forEach(b => { circle(c, b.x + 2, b.y + 3, 12, '#163e3199'); circle(c, b.x, b.y, 11, ballColors[b.number]); if (b.number) label(c, String(b.number), b.x, b.y + 4, 11, '#253b35'); });
    label(c, g.rolling ? 'Toplar hareket ediyor…' : `Sıra: ${player(g.ids[g.turn]).name}`, 500, 39, 24);
    label(c, 'RENKLİ +10    BEYAZ −5    TOP SOKARSAN TEKRAR VUR', 500, 535, 19, '#d9d7bb');
  }
  if (g.id === 'tennis') {
    rect(c, 0, 0, 1000, 560, '#3c6048'); rect(c, 65, 70, 870, 420, '#83a063');
    c.strokeStyle = '#eef0d4'; c.lineWidth = 3; c.strokeRect(65, 70, 870, 420); c.strokeRect(65, 115, 870, 330); c.strokeRect(290, 115, 420, 330); line(c, 290, 280, 710, 280, '#eef0d4');
    for (let y = 65; y < 500; y += 16) line(c, 494, y, 506, y, '#d2dec1', 2); line(c, 500, 60, 500, 500, '#f1efcd', 4);
    g.tennists.forEach(p => { circle(c, p.x, p.y + 5, 21, '#244e4380'); circle(c, p.x, p.y, 19, TEAM_COLORS[p.team]); const rx = p.x + (p.team === 0 ? 26 : -26); c.strokeStyle = '#e9ebbe'; c.lineWidth = 4; c.beginPath(); c.ellipse(rx, p.y - 8, state.serverNow < p.swingUntil ? 18 : 13, 23, -.35, 0, Math.PI * 2); c.stroke(); label(c, player(p.id).name.slice(0, 12), p.x, p.y + 39, 13, '#1e3e30'); });
    circle(c, g.ball.x + 3, g.ball.y + 5, 9, '#35573666'); circle(c, g.ball.x, g.ball.y, 9, '#f1ef81');
    label(c, `MAVİ ${g.teamScores[0]} — ${g.teamScores[1]} MERCAN`, 500, 35, 24);
    if (state.serverNow < g.serveAt) { rect(c, 360, 230, 280, 80, '#263f35e8', 14); label(c, 'Servise hazırlan!', 500, 278, 26); }
    label(c, 'İLK 7 SAYI · ÇİZGİ DIŞI RAKİBE SAYI', 500, 537, 19);
  }
  if (g.id === 'laser') renderLaserScene(c, state);
}
