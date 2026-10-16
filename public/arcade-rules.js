export const RACE_LENGTH = 3000;
export const raceObstacle = (row, seed) => ({ distance: row * 95 + 160, lane: ((row * 7 + seed + Math.floor(row / 3)) % 3 + .5) / 3 });
export const POOL_POCKETS = [{ x: 60, y: 90 }, { x: 500, y: 90 }, { x: 940, y: 90 }, { x: 60, y: 470 }, { x: 500, y: 470 }, { x: 940, y: 470 }];
export const POOL_RADIUS = 11;
export const poolMoving = g => g.balls.some(b => !b.sunk && Math.hypot(b.vx, b.vy) > 3);
