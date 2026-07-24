/* House Dismantle  Main Entry */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { hideLoading, setupThemeToggle, setupResizeHandler, createStarfield } from '/games/shared/three-utils.js';
import { MATS, PART_DEFS } from './config.js';
import { buildRoof }          from './roof/index.js';
import { buildUpperWalls }    from './floor2/walls.js';
import { buildFloor2 }        from './floor2/floor.js';
import { buildFloor2Rooms }   from './floor2/rooms.js';
import { buildFloor2Openings } from './floor2/openings.js';
import { buildFloor1Walls }   from './floor1/walls.js';
import { buildFloor1 }        from './floor1/floor.js';
import { buildFloor1Rooms }   from './floor1/rooms.js';
import { buildFloor1Openings } from './floor1/openings.js';
import { buildBase }          from './base/index.js';
import { validateHouse }      from './validate/index.js';
import { initTranslate }      from './translate.js';
import { initUI }             from './ui.js';

// ── State ─────────────────────────────────────────────────────────
const parts = new Map();
const selected = new Set();
const state = {
  parts, selected,
  isDisassembled: false, tweenActive: false, hoveredPart: null,
};

// ── Three.js ──────────────────────────────────────────────────────
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a14);
scene.fog = new THREE.Fog(0x0a0a14, 12, 45);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.5, 70);
camera.position.set(14, 8, 20); camera.lookAt(0, 3.5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 5; controls.maxDistance = 45;
controls.maxPolarAngle = Math.PI * 0.7;
controls.target.set(0, 3.5, 0); controls.update();

state.camera = camera; state.renderer = renderer; state.controls = controls;

// ── Lighting  bright ambient + fills for translated parts ─────────
scene.add(new THREE.AmbientLight(0x667788, 4.0));
scene.add(new THREE.HemisphereLight(0x8899cc, 0x443322, 1.5));
const sun = new THREE.DirectionalLight(0xffeedd, 3.0);
sun.position.set(15, 20, 10); sun.castShadow = true;
sun.shadow.mapSize.width = 2048; sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 80;
sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
sun.shadow.bias = -0.0001;
scene.add(sun);
for (const [px, pz, c, i] of [[-20,0,0x8899cc,1.5],[20,0,0x8899cc,1.5],[0,-15,0x8899cc,1.2],[0,15,0xccddee,1.0]]) {
  const l = new THREE.DirectionalLight(c, i); l.position.set(px, 5, pz); scene.add(l);
}

// ── Environment ───────────────────────────────────────────────────
scene.add(createStarfield({ count: 180, radius: 45, distribution: 'cube', size: 0.03, color: 0x667799, opacity: 0.4 }));
const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.9, metalness: 0 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.PolarGridHelper(18, 32, 36, 128, 0x222233, 0x161622);
grid.position.y = -0.04; scene.add(grid);

// ── Build ─────────────────────────────────────────────────────────
const houseGroup = new THREE.Group();
for (const def of PART_DEFS) {
  const g = new THREE.Group(); g.name = def.name;
  parts.set(def.name, { group: g, label: def.label, color: def.color, deps: def.deps, assembled: true, meshArr: [] });
  houseGroup.add(g);
}
scene.add(houseGroup);
buildRoof(houseGroup, parts, MATS);
buildUpperWalls(houseGroup, parts, MATS);
buildFloor2(houseGroup, parts, MATS);
buildFloor2Rooms(houseGroup, parts, MATS);
buildFloor2Openings(houseGroup, parts, MATS);
buildFloor1Walls(houseGroup, parts, MATS);
buildFloor1(houseGroup, parts, MATS);
buildFloor1Rooms(houseGroup, parts, MATS);
buildFloor1Openings(houseGroup, parts, MATS);
buildBase(houseGroup, parts, MATS);
validateHouse(parts);

// ── Init modules ──────────────────────────────────────────────────
const targetOff = new Map();
for (const [name] of parts) targetOff.set(name, new THREE.Vector3(0, 0, 0));
state.targetOff = targetOff;

const t = initTranslate(state);
state.doDisassemble = t.doDisassemble;
state.doReassembleAll = t.doReassembleAll;

const ui = initUI(state);

// ── Animation ─────────────────────────────────────────────────────
const animSpeed = 5.0;
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  controls.update();

  if (state.tweenActive) {
    let allDone = true;
    for (const [name, p] of parts) {
      const tgt = targetOff.get(name);
      const pos = p.group.position;
      const dx = tgt.x - pos.x, dy = tgt.y - pos.y, dz = tgt.z - pos.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist < 0.003) { pos.copy(tgt); }
      else {
        allDone = false;
        const step = Math.min(animSpeed * dt / dist, 1);
        pos.x += dx * step; pos.y += dy * step; pos.z += dz * step;
      }
    }
    if (allDone) { state.tweenActive = false; for (const [n, p] of parts) p.group.position.copy(targetOff.get(n)); }
  }
  renderer.render(scene, camera);
}

// ── Theme, Resize, Start ──────────────────────────────────────────
setupThemeToggle({ scene, darkBg: 0x0a0a14, lightBg: 0xd8dae8, fogNear: 12, fogFar: 45 });
setupResizeHandler(renderer, camera, container);
hideLoading();
animate();
ui.updateInfoPanel();
ui.updateDismantleBtn();
