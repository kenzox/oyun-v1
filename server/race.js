import { RACE_LENGTH, raceObstacle } from '../public/arcade-rules.js';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function initRace(g, now) {
  if (g.id !== 'race') return;
  g.seed = Math.floor(Math.random() * 1000); g.finishOrder = []; g.raceEnd = null;
  g.racers = g.ids.map(id => ({ id, x: .5, target: .5, speed: 0, distance: 0, nextRow: 0, boostUntil: now, boostReady: now, crashUntil: now, finished: false, place: null, braking: false }));
  g.notice = '3 tur, 3000 metre! Trafikten kaç, düzlüğü bulunca turbo kullan.';
}
export function inputRace(g, id, input, now) {
  if (g.id !== 'race') return;
  const r = g.racers.find(r => r.id === id);
  if (r.finished) return;
  if (input.type === 'race-steer' && Number.isFinite(input.x)) r.target = clamp(input.x, .08, .92);
  if (input.type === 'race-brake' && typeof input.on === 'boolean') r.braking = input.on;
  if (input.type === 'race-boost' && now >= r.boostReady && now >= r.crashUntil) { r.boostUntil = now + 1500; r.boostReady = now + 6000; }
}
export function tickRace(g, dt, now, connected) {
  if (g.id !== 'race') return;
  // Crossing times, rather than roster order, decide close finishes within one tick.
  const finishers = [];
  for (const r of g.racers) {
    if (r.finished || !connected.includes(r.id)) { r.braking = false; continue; }
    r.x += clamp(r.target - r.x, -dt * 1.3, dt * 1.3);
    const targetSpeed = now < r.crashUntil ? 18 : r.braking ? 32 : now < r.boostUntil ? 115 : 76;
    r.speed += clamp(targetSpeed - r.speed, -dt * 180, dt * 60);
    const before = r.distance, travelSpeed = r.speed; r.distance = Math.min(RACE_LENGTH, r.distance + r.speed * dt);
    let obstacle = raceObstacle(r.nextRow, g.seed);
    while (obstacle.distance <= r.distance && obstacle.distance < RACE_LENGTH) {
      if (Math.abs(r.x - obstacle.lane) < .14 && now >= r.crashUntil) { r.speed = 18; r.crashUntil = now + 1200; r.boostUntil = now; }
      r.nextRow++; obstacle = raceObstacle(r.nextRow, g.seed);
    }
    g.scores[r.id] = Math.floor(r.distance);
    if (r.distance >= RACE_LENGTH) finishers.push({ r, at: now - dt * 1000 + (RACE_LENGTH - before) / Math.max(1, travelSpeed) * 1000 });
  }
  for (const { r, at } of finishers.sort((a, b) => a.at - b.at)) {
    r.place = 1 + g.racers.filter(other => other.finished && other.finishAt < at - 1).length;
    r.finishAt = at; r.finished = true; g.finishOrder.push(r.id); g.scores[r.id] = 4100 - r.place * 100;
    if (g.raceEnd === null) { g.raceEnd = now + 12000; g.notice = 'İlk araç finişte! Diğer yarışçılar için son 12 saniye.'; }
  }
  const active = g.racers.filter(r => connected.includes(r.id));
  if (g.raceEnd !== null && (now >= g.raceEnd || active.length && active.every(r => r.finished))) g.finished = true;
}
