import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();
export { RAPIER };
export const PHYSICS_STEP = 1 / 120;
const worlds = new WeakMap();
export function attachPhysics(g) {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = PHYSICS_STEP;
  const runtime = { world, bodies: new Map(), vehicles: new Map(), accumulator: 0 };
  worlds.set(g, runtime);
  return runtime;
}
// Runtime objects/WASM handles must never be part of a Socket.IO snapshot.
export const physicsFor = g => worlds.get(g);
export function disposePhysics(g) {
  const runtime = g && worlds.get(g);
  if (runtime) { runtime.world.free(); worlds.delete(g); }
}
export function stepPhysics(g, dt, before = () => {}, after = () => {}) {
  const runtime = worlds.get(g); if (!runtime) return;
  runtime.accumulator += Math.max(0, Math.min(.06, dt));
  while (runtime.accumulator + 1e-9 >= PHYSICS_STEP) {
    before(runtime, PHYSICS_STEP); runtime.world.step(); after(runtime, PHYSICS_STEP);
    runtime.accumulator -= PHYSICS_STEP;
  }
}
export function pose(body) {
  const p = body.translation(), q = body.rotation();
  return { position: { x: p.x, y: p.y, z: p.z }, rotation: { x: q.x, y: q.y, z: q.z, w: q.w } };
}
