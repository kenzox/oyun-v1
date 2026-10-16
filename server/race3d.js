import { RAPIER, attachPhysics, physicsFor, stepPhysics, pose } from './physics.js';
import { TRACK_LENGTH, TRACK_WALLS, TRACK_OBSTACLES, trackCenter, trackHeading, yawRotation, WHEEL_POINTS } from '../public/three-rules.js';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const zero = { x: 0, y: 0, z: 0 };
const yawOf = q => Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z));
const angleDelta = a => Math.atan2(Math.sin(a), Math.cos(a));
function resetCar(g, r, now) {
  const rt = physicsFor(g), body = rt.bodies.get(r.id), z = r.checkpoint * 150 - 5;
  body.setTranslation({ x: trackCenter(z) + (g.ids.indexOf(r.id) % 2 ? 2 : -2), y: .9, z }, true);
  body.setRotation(yawRotation(trackHeading(z)), true); body.setLinvel(zero, true); body.setAngvel(zero, true);
  r.target = .5; r.braking = false; r.boostUntil = now; r.resetReady = now + 3000; r.reverseUntil = now; r.teleport++;
}
export function initRace3D(g, now) {
  if (g.id !== 'race3d') return;
  const rt = attachPhysics(g);
  rt.world.createCollider(RAPIER.ColliderDesc.cuboid(80, .2, 380).setTranslation(0, -.2, 300).setFriction(1));
  for (const wall of TRACK_WALLS) rt.world.createCollider(RAPIER.ColliderDesc.cuboid(wall.hx, .65, wall.hz).setTranslation(wall.x, .65, wall.z).setRotation(yawRotation(wall.yaw)).setFriction(.15).setRestitution(.1));
  for (const o of TRACK_OBSTACLES) rt.world.createCollider(RAPIER.ColliderDesc.cuboid(o.hx, .6, o.hz).setTranslation(o.x, .6, o.z).setFriction(.2).setRestitution(.15));
  g.finishOrder = []; g.raceEnd = null; g.serveAt = now + 3000;
  g.racers = g.ids.map((id, i) => {
    const z = -8 - Math.floor(i / 2) * 4.5;
    const body = rt.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(trackCenter(z) + (i % 2 ? 2 : -2), .9, z).setRotation(yawRotation(trackHeading(z))).setLinearDamping(.08).setAngularDamping(2).enabledRotations(false, true, false).setCcdEnabled(true).setCanSleep(false));
    rt.world.createCollider(RAPIER.ColliderDesc.cuboid(.8, .24, 1.4).setMass(600).setFriction(.12).setRestitution(.1), body);
    rt.bodies.set(id, body);
    const vehicle = rt.world.createVehicleController(body); vehicle.indexUpAxis = 1; vehicle.setIndexForwardAxis = 2;
    WHEEL_POINTS.forEach((point, wheel) => {
      vehicle.addWheel(point, { x: 0, y: -1, z: 0 }, { x: -1, y: 0, z: 0 }, .35, .32);
      vehicle.setWheelSuspensionStiffness(wheel, 30); vehicle.setWheelSuspensionCompression(wheel, 4.4); vehicle.setWheelSuspensionRelaxation(wheel, 2.3);
      vehicle.setWheelMaxSuspensionForce(wheel, 15000); vehicle.setWheelMaxSuspensionTravel(wheel, .25);
      vehicle.setWheelFrictionSlip(wheel, 2); vehicle.setWheelSideFrictionStiffness(wheel, 1.2);
    });
    rt.vehicles.set(id, vehicle);
    return { id, ...pose(body), target: .5 - (i % 2 ? 2 : -2) / 11, speed: 0, distance: 0, checkpoint: 0, boostUntil: now, boostReady: now, braking: false, finished: false, place: null, resetReady: now, reverseUntil: now, teleport: 0, wheels: WHEEL_POINTS.map(() => ({ suspension: .35, rotation: 0, steering: 0 })), connected: true };
  });
  g.notice = 'Dört etap, 600 metre! Gaz ve viraj desteği otomatik. Engellerden kaç, turbo kullan.';
}
export function inputRace3D(g, id, input, now) {
  if (g.id !== 'race3d' || !physicsFor(g)) return;
  const r = g.racers.find(r => r.id === id); if (r.finished) return;
  if (input.type === 'race-steer' && Number.isFinite(input.x)) r.target = clamp(input.x, .08, .92);
  if (input.type === 'race-brake' && typeof input.on === 'boolean') r.braking = input.on;
  if (input.type === 'race-boost' && now >= g.serveAt && now >= r.boostReady) { r.boostUntil = now + 1500; r.boostReady = now + 6000; }
  if (input.type === 'race-reverse' && now >= g.serveAt && now >= r.reverseUntil) { r.reverseUntil = now + 2000; r.braking = false; }
  if (input.type === 'race-reset' && now >= r.resetReady) resetCar(g, r, now);
}
export function tickRace3D(g, dt, now, connected) {
  if (g.id !== 'race3d' || !physicsFor(g)) return;
  const rt = physicsFor(g), previous = new Map(g.racers.map(r => [r.id, r.position.z]));
  for (const r of g.racers) {
    const active = connected.includes(r.id) && !r.finished;
    const body = rt.bodies.get(r.id); body.setEnabled(active);
    if (!active) { body.setLinvel(zero, false); body.setAngvel(zero, false); r.braking = false; }
    r.connected = connected.includes(r.id);
  }
  stepPhysics(g, dt, (runtime, step) => {
    for (const r of g.racers) {
      if (!r.connected || r.finished) continue;
      const body = runtime.bodies.get(r.id), v = runtime.vehicles.get(r.id), p = body.translation(), velocity = body.linvel(), yaw = yawOf(body.rotation());
      const desiredX = trackCenter(p.z + 5) + (.5 - r.target) * 11;
      const desiredYaw = Math.atan2(clamp((desiredX - p.x) * .24, -.65, .65), 1);
      const steering = clamp(angleDelta(desiredYaw - yaw) * 1.6, -.42, .42);
      const speed = Math.hypot(velocity.x, velocity.z), hold = now < g.serveAt;
      const limit = now < r.boostUntil ? 30 : 23;
      for (let wheel = 0; wheel < 4; wheel++) {
        v.setWheelSteering(wheel, wheel < 2 ? steering : 0);
        v.setWheelEngineForce(wheel, wheel >= 2 && !hold && !r.braking && speed < limit ? now < r.reverseUntil ? -1800 : (now < r.boostUntil ? 2100 : 1400) : 0);
        v.setWheelBrake(wheel, hold || r.braking ? 35 : 0);
      }
      v.updateVehicle(step, RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);
    }
  });
  const finishers = [];
  for (const r of g.racers) {
    if (!r.connected || r.finished) continue;
    const body = rt.bodies.get(r.id), vehicle = rt.vehicles.get(r.id);
    Object.assign(r, pose(body)); r.speed = Math.hypot(body.linvel().x, body.linvel().z);
    r.wheels = WHEEL_POINTS.map((_, i) => ({ suspension: vehicle.wheelSuspensionLength(i) ?? .35, rotation: vehicle.wheelRotation(i) ?? 0, steering: vehicle.wheelSteering(i) ?? 0 }));
    const before = previous.get(r.id), z = r.position.z, nextGate = (r.checkpoint + 1) * 150;
    if (before < nextGate && z >= nextGate && Math.abs(r.position.x - trackCenter(z)) < 7.2) r.checkpoint++;
    r.distance = clamp(z, 0, Math.min(TRACK_LENGTH, (r.checkpoint + 1) * 150));
    g.scores[r.id] = Math.floor(r.distance);
    if (r.checkpoint === 4) finishers.push({ r, at: now - dt * 1000 + dt * 1000 * (TRACK_LENGTH - before) / Math.max(.001, z - before) });
    if (r.position.y < -3 || Math.abs(r.position.x - trackCenter(z)) > 12 || z < -48 || z > 640) resetCar(g, r, now);
  }
  for (const { r, at } of finishers.sort((a, b) => a.at - b.at)) {
    r.place = 1 + g.racers.filter(other => other.finished && other.finishAt < at - 1).length;
    r.finishAt = at; r.finished = true; r.distance = TRACK_LENGTH; g.finishOrder.push(r.id); g.scores[r.id] = 1010 - r.place * 10;
    if (g.raceEnd === null) { g.raceEnd = now + 12000; g.notice = 'Finiş! Diğer araçlar için son 12 saniye.'; }
  }
  const active = g.racers.filter(r => r.connected);
  if (g.raceEnd !== null && (now >= g.raceEnd || active.length && active.every(r => r.finished))) g.finished = true;
}
