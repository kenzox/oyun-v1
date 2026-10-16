import { GOLF_COURSES, GOLF_LIMIT } from './golf-courses.js';

export const MOLE_SYMBOLS = { empty: '', mole: '🐹', star: '🌟', flower: '🌼' };
export const MOLE_NAMES = { empty: 'Boş yuva', mole: 'Köstebek', star: 'Altın köstebek', flower: 'Çiçek' };
export const CASUAL_ART = {
  golf: `<rect x="65" y="37" width="270" height="171" rx="40" fill="#47764a"/><path d="M88 179Q165 80 277 113" stroke="#a6d094" stroke-width="3" stroke-dasharray="5 10" fill="none"/><circle cx="282" cy="109" r="16" fill="#233d29"/><path d="M282 109V47l37 14-37 14" stroke="#f5e8be" stroke-width="4" fill="#f0a5ad"/><circle cx="105" cy="160" r="12" fill="#f9f1dc"/><rect x="181" y="134" width="24" height="57" rx="5" fill="#d7bc8e"/>`,
  moles: `<ellipse cx="200" cy="186" rx="128" ry="20" fill="#345032"/><ellipse cx="200" cy="171" rx="57" ry="22" fill="#654b39"/><circle cx="167" cy="98" r="17" fill="#c29471"/><circle cx="233" cy="98" r="17" fill="#c29471"/><rect x="157" y="99" width="86" height="79" rx="35" fill="#bd8c69"/><circle cx="183" cy="126" r="5" fill="#3b302a"/><circle cx="217" cy="126" r="5" fill="#3b302a"/><ellipse cx="200" cy="145" rx="10" ry="7" fill="#f3b6ae"/><rect x="192" y="155" width="16" height="14" rx="3" fill="#fff1d9"/><path d="M294 171v-32" stroke="#78a557" stroke-width="6"/><g fill="#f4d375"><circle cx="294" cy="123" r="11"/><circle cx="281" cy="136" r="11"/><circle cx="307" cy="136" r="11"/><circle cx="294" cy="148" r="11"/></g><circle cx="294" cy="135" r="8" fill="#b7824c"/><path d="M109 88l6-14m3 30 16-4" stroke="#e8c99d" stroke-width="4"/>`,
};

const circle = (c, x, y, r, fill) => { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
const rect = (c, x, y, w, h, fill, radius = 0) => { c.fillStyle = fill; c.beginPath(); c.roundRect(x, y, w, h, radius); c.fill(); };
const label = (c, text, x, y, size, color = '#fff0d8') => { c.font = `600 ${size}px system-ui`; c.textAlign = 'center'; c.fillStyle = color; c.fillText(text, x, y); };

export function renderCasual(c, state) {
  const g = state.game;
  const player = id => state.players.find(p => p.id === id) || { name: '', color: '#fff' };
  if (g.id === 'golf') {
    const course = GOLF_COURSES[g.round - 1];
    rect(c, 0, 0, 1000, 560, '#253e31'); rect(c, 36, 56, 928, 458, '#d6c293', 15); rect(c, 40, 60, 920, 450, '#477a4c', 10);
    for (let x = 40; x < 960; x += 92) rect(c, x, 65, 46, 440, '#ffffff06');
    circle(c, course.tee.x, course.tee.y, 24, '#c6e7ab30');
    for (const wall of course.walls) { rect(c, wall.x + 5, wall.y + 5, wall.w, wall.h, '#153c2a44', 4); rect(c, wall.x, wall.y, wall.w, wall.h, '#d6bb8c', 4); }
    circle(c, course.cup.x, course.cup.y, 18, '#203c29'); circle(c, course.cup.x, course.cup.y, 12, '#102319');
    rect(c, course.cup.x + 16, course.cup.y - 62, 4, 65, '#fff1d6');
    c.fillStyle = '#f5a7bb'; c.beginPath(); c.moveTo(course.cup.x + 20, course.cup.y - 62); c.lineTo(course.cup.x + 55, course.cup.y - 50); c.lineTo(course.cup.x + 20, course.cup.y - 38); c.fill();
    label(c, `${g.round} / ${GOLF_COURSES.length} · ${course.name}`, 500, 35, 24);
    g.golfers.forEach((b, i) => {
      const p = player(b.id);
      if (!b.sunk) { circle(c, b.x + 2, b.y + 3, 10, '#0004'); circle(c, b.x, b.y, 10, p.color); label(c, String(i + 1), b.x, b.y + 4, 10, '#20302b'); label(c, p.name.slice(0, 10), b.x, b.y - 17, 12); }
      const x = (i + .5) * 1000 / g.golfers.length;
      label(c, `${i + 1}. ${p.name.slice(0, 10)} · ${b.sunk ? '✓' : `${b.strokes}/${GOLF_LIMIT}`}`, x, 544, 13, p.color);
    });
    if (g.stage === 'break') { rect(c, 300, 210, 400, 100, '#1d332de8', 16); label(c, 'Yeni parkur geliyor!', 500, 270, 30, '#d7efb6'); }
  }
  if (g.id === 'moles') {
    rect(c, 0, 0, 1000, 560, '#33533b'); label(c, 'KÖSTEBEK +10     ALTIN +25     ÇİÇEK −5', 500, 40, 22, '#e8ddb8');
    g.moles.forEach((m, i) => {
      const x = 230 + i % 3 * 270, y = 150 + Math.floor(i / 3) * 155;
      c.fillStyle = '#644d3b'; c.beginPath(); c.ellipse(x, y + 25, 85, 25, 0, 0, Math.PI * 2); c.fill();
      if (m.kind === 'mole' || m.kind === 'star') {
        const fur = m.kind === 'star' ? '#dfbb5e' : '#ba8c68';
        circle(c, x - 31, y - 38, 15, fur); circle(c, x + 31, y - 38, 15, fur);
        rect(c, x - 42, y - 40, 84, 71, fur, 30);
        circle(c, x - 17, y - 17, 5, '#372b26'); circle(c, x + 17, y - 17, 5, '#372b26');
        circle(c, x, y, 8, '#f2b2a8'); rect(c, x - 8, y + 11, 16, 14, '#fff0d5', 3);
        if (m.kind === 'star') label(c, '★', x, y - 52, 29, '#f8dc79');
      } else if (m.kind === 'flower') {
        rect(c, x - 4, y - 10, 8, 38, '#91b769', 4);
        for (let n = 0; n < 6; n++) circle(c, x + Math.cos(n * Math.PI / 3) * 22, y - 30 + Math.sin(n * Math.PI / 3) * 22, 15, '#f5cc78');
        circle(c, x, y - 30, 13, '#9a6e40');
      }
      label(c, String(i + 1), x, y + 64, 15, '#d6d3aa');
    });
  }
}
