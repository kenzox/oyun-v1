// Geometry is shared by the authoritative physics and Three.js scenes (metres).
export const THREE_GAMES = ['pool3d', 'race3d'];
export const TABLE = { halfX: 4.4, halfZ: 1.9, radius: .11, pocketRadius: .25 };
export const TABLE_FLOOR = [
  { x: 0, z: 0, hx: 4.4, hz: 1.6 },
  ...[-1, 1].flatMap(side => [-1, 1].map(end => ({ x: end * 2.2, z: side * 1.75, hx: 1.9, hz: .15 }))),
];
export const TABLE_RAILS = [
  ...[-1, 1].flatMap(side => [-1, 1].map(end => ({ x: end * 2.2, z: side * 1.98, hx: 1.9, hz: .08 }))),
  ...[-1, 1].map(end => ({ x: end * 4.48, z: 0, hx: .08, hz: 1.6 })),
];
export const TABLE_POCKETS = [-1, 1].flatMap(side => [-1, 0, 1].map(end => ({ x: end * 4.27, z: side * (end ? 1.77 : 1.84) })));
export const TRACK_LENGTH = 600;
export const trackCenter = z => Math.sin(z / 48) * 5;
export const trackHeading = z => Math.atan(Math.cos(z / 48) * 5 / 48);
export const TRACK_WALLS = Array.from({ length: 71 }, (_, i) => {
  const z = -50 + i * 10;
  return [-1, 1].map(side => ({ x: trackCenter(z) + side * 7.5, z, yaw: trackHeading(z), hx: .35, hz: 5.15 }));
}).flat();
export const TRACK_OBSTACLES = Array.from({ length: 11 }, (_, i) => { const z = 55 + i * 48; return { x: trackCenter(z) + ((i % 3 - 1) * 3), z, hx: .85, hz: 1.6 }; });
export const WHEEL_POINTS = [{ x: -.85, y: 0, z: 1.05 }, { x: .85, y: 0, z: 1.05 }, { x: -.85, y: 0, z: -1.05 }, { x: .85, y: 0, z: -1.05 }];
export const yawRotation = yaw => ({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) });
