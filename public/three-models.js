import * as THREE from 'three';
import { TABLE_FLOOR, TABLE_RAILS, TABLE_POCKETS, TABLE, TRACK_WALLS, TRACK_OBSTACLES, TRACK_LENGTH, trackCenter, trackHeading, WHEEL_POINTS } from './three-rules.js';
const mat = (color, roughness = .65) => new THREE.MeshStandardMaterial({ color, roughness });
function box(parent, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material); mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function batches(parent, geometry, material, items) {
  const mesh = new THREE.InstancedMesh(geometry, material, items.length), dummy = new THREE.Object3D();
  items.forEach((item, i) => { dummy.position.set(...item.position); dummy.rotation.set(0, item.yaw || 0, 0); dummy.scale.set(...(item.scale || [1, 1, 1])); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); if (item.color) mesh.setColorAt(i, new THREE.Color(item.color)); });
  mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function sceneBase(background) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(background);
  scene.add(new THREE.HemisphereLight('#e4edff', '#354434', 2.6));
  const sun = new THREE.DirectionalLight('#fff0d0', 3); sun.position.set(-5, 12, 7); scene.add(sun);
  return { scene, sun };
}
export function createPoolScene() {
  const { scene, sun } = sceneBase('#172c29');
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -7; sun.shadow.camera.right = 7; sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5; sun.shadow.normalBias = .02;
  const cloth = mat('#397c62', .95), wood = mat('#714c32', .5), brass = mat('#d4ba80', .3), cushion = mat('#285b45', .9);
  box(scene, [30, .2, 24], [0, -1.9, 0], mat('#203934'));
  box(scene, [9.7, .45, 4.9], [0, -.6, 0], wood);
  for (const x of [-3.5, 3.5]) for (const z of [-1.4, 1.4]) box(scene, [.48, 1.3, .48], [x, -1.15, z], wood);
  for (const p of TABLE_FLOOR) box(scene, [p.hx * 2, .24, p.hz * 2], [p.x, -.12, p.z], cloth);
  for (const p of TABLE_RAILS) box(scene, [p.hx * 2, .32, p.hz * 2], [p.x, .12, p.z], cushion);
  for (const side of [-1, 1]) { box(scene, [9.7, .28, .35], [0, .03, side * 2.28], wood); box(scene, [.35, .28, 4.9], [side * 4.67, .03, 0], wood); }
  for (const p of TABLE_POCKETS) {
    const pocket = new THREE.Mesh(new THREE.CylinderGeometry(TABLE.pocketRadius, TABLE.pocketRadius * .8, .35, 24), mat('#091713'));
    pocket.position.set(p.x, -.25, p.z); scene.add(pocket);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(TABLE.pocketRadius, .025, 8, 32), brass); rim.rotation.x = Math.PI / 2; rim.position.set(p.x, -.015, p.z); scene.add(rim);
  }
  for (const x of [-3.2, -2.1, -1, 1, 2.1, 3.2]) for (const z of [-2.28, 2.28]) box(scene, [.06, .01, .06], [x, .176, z], brass);
  const ballColors = ['#fff8e6', '#f6d56d', '#77b4ed', '#e78fa4', '#bda0e8', '#e99e5b', '#84c9a9'];
  const balls = ballColors.map((color, i) => {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(TABLE.radius, 24, 16), mat(color, .22)); ball.castShadow = true;
    // A contrasting band makes the physics-driven rotation visible without assets.
    if (i) { const band = new THREE.Mesh(new THREE.TorusGeometry(TABLE.radius * .995, .008, 6, 32), mat('#fff6dc', .25)); ball.add(band); }
    scene.add(ball); return ball;
  });
  const cue = new THREE.Group(); box(cue, [1.9, .045, .045], [-1.08, 0, 0], mat('#d5b98c', .45)); box(cue, [.07, .048, .048], [-.14, 0, 0], mat('#99c4d6')); scene.add(cue);
  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(2.2, 0, 0)]);
  const aim = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: '#e4e9b4', dashSize: .09, gapSize: .07 })); aim.computeLineDistances(); scene.add(aim);
  const camera = new THREE.PerspectiveCamera(43, 1000 / 560, .05, 80); camera.position.set(0, 6.7, 7.1); camera.lookAt(0, 0, 0);
  return { scene, camera, balls, cue, aim };
}
function createCar(color) {
  const group = new THREE.Group(), paint = mat(color, .35), glass = mat('#283f53', .25), tire = mat('#20252b', .9);
  box(group, [1.6, .48, 2.8], [0, 0, 0], paint); box(group, [1.28, .48, 1.2], [0, .44, -.15], glass);
  box(group, [1.3, .06, .72], [0, .7, -.25], paint);
  for (const x of [-.5, .5]) { box(group, [.33, .12, .07], [x, .04, 1.43], mat('#fff0b7', .2)); box(group, [.33, .12, .07], [x, .04, -1.43], mat('#ef7f77', .2)); }
  const wheels = WHEEL_POINTS.map(p => {
    const pivot = new THREE.Group(); pivot.position.set(p.x, -.35, p.z); group.add(pivot);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .22, 12), tire); wheel.rotation.z = Math.PI / 2; pivot.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .23, 8), mat('#bec6ce', .4)); hub.rotation.z = Math.PI / 2; wheel.add(hub); hub.rotation.z = 0;
    return { pivot, wheel };
  });
  return { group, wheels };
}
export function createRaceScene(players) {
  const { scene } = sceneBase('#a5c6d3'); scene.fog = new THREE.Fog('#a5c6d3', 35, 115);
  box(scene, [160, .2, 760], [0, -.2, 300], mat('#6f9567'));
  const road = Array.from({ length: 71 }, (_, i) => { const z = -50 + i * 10; return { position: [trackCenter(z), -.025, z], yaw: trackHeading(z) }; });
  batches(scene, new THREE.BoxGeometry(14.5, .045, 10.15), mat('#46525a'), road);
  batches(scene, new THREE.BoxGeometry(.12, .012, 3), mat('#e7e1c3'), road.flatMap(p => [-2.4, 2.4].map(x => ({ position: [p.position[0] + x, .003, p.position[2]], yaw: p.yaw }))));
  batches(scene, new THREE.BoxGeometry(1, 1, 1), mat('#d7e1dc'), TRACK_WALLS.map((p, i) => ({ position: [p.x, .65, p.z], scale: [p.hx * 2, 1.3, p.hz * 2], yaw: p.yaw, color: Math.floor(i / 2) % 2 ? '#e7dbc5' : '#da8d78' })));
  batches(scene, new THREE.BoxGeometry(1, 1, 1), mat('#eebf69'), TRACK_OBSTACLES.map(p => ({ position: [p.x, .6, p.z], scale: [p.hx * 2, 1.2, p.hz * 2] })));
  batches(scene, new THREE.BoxGeometry(1, 1, 1), mat('#39434e'), TRACK_OBSTACLES.map(p => ({ position: [p.x, 1.21, p.z], scale: [p.hx * 2, .04, .4] })));
  const trees = Array.from({ length: 64 }, (_, i) => { const z = i * 11 - 30; return { position: [trackCenter(z) + (i % 2 ? -14 : 14), 2, z], scale: [1, 1 + i % 3 * .2, 1] }; });
  batches(scene, new THREE.ConeGeometry(1.5, 4, 6), mat('#3c7254'), trees);
  for (const z of [0, 150, 300, 450, TRACK_LENGTH]) {
    for (const side of [-1, 1]) box(scene, [.3, 5, .3], [trackCenter(z) + side * 7, 2.5, z], mat('#e7d3a4'));
    box(scene, [14.3, .6, .3], [trackCenter(z), 5, z], mat(z === TRACK_LENGTH ? '#efc371' : '#8db9cc'));
    for (let i = 0; i < 14; i++) for (let j = 0; j < 2; j++) box(scene, [1, .015, .7], [trackCenter(z) - 6.5 + i, .012, z + j * .7], mat((i + j) % 2 ? '#eff1dc' : '#293c45'));
  }
  const cars = new Map(players.map(p => { const car = createCar(p.color); scene.add(car.group); return [p.id, car]; }));
  const cameras = players.map(() => new THREE.PerspectiveCamera(52, 1, .1, 150));
  return { scene, cars, cameras };
}
export function disposeScene(scene) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  scene.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of object.material ? Array.isArray(object.material) ? object.material : [object.material] : []) {
      materials.add(material); for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
    if (object.isLight && object.shadow) object.shadow.dispose();
    if (object.isInstancedMesh) object.dispose();
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); scene.clear();
}
