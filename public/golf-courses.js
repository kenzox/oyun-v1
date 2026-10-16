// Shared between authoritative physics and the TV renderer.
export const GOLF_COURSES = [
  { name: 'İlk Vuruş', tee: { x: 150, y: 280 }, cup: { x: 820, y: 280 }, walls: [] },
  { name: 'Köşeyi Dön', tee: { x: 150, y: 400 }, cup: { x: 820, y: 160 }, walls: [{ x: 430, y: 210, w: 110, h: 240 }] },
  { name: 'Zikzak Bahçe', tee: { x: 130, y: 140 }, cup: { x: 850, y: 420 }, walls: [{ x: 310, y: 60, w: 35, h: 290 }, { x: 620, y: 230, w: 35, h: 280 }] },
];
export const GOLF_LIMIT = 8;
export const golfMoving = ball => Math.hypot(ball.vx, ball.vy) > 8;
