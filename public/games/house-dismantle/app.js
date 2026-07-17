/* House Dismantle — Traditional Rural 3-Room House
   Mouse drag-select parts → press 1 to disassemble → press 1 to reassemble
   Unselected parts stay intact unless structurally dependent. */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  hideLoading, showError, setupThemeToggle, setupResizeHandler,
  createStarfield,
} from '/games/shared/three-utils.js';

// ── Dimensions (meters, 1 unit = 1m) ──────────────────────────────
const HOUSE_W   = 12;      // width (3 bays × 4m)
const HOUSE_D   = 7;       // depth
const WALL_H1   = 2.8;     // first floor wall height
const WALL_H2   = 1.5;     // upper half-story wall height (2.8→4.3m)
const ROOF_H    = 5.5;     // roof ridge height from ground
const EAVE_H    = WALL_H1 + WALL_H2; // eave height = 4.3m
const WALL_T    = 0.24;    // wall thickness
const FLOOR_H   = 0.2;     // foundation/platform thickness
const ROOF_OH   = 1.0;     // roof overhang beyond walls
const BAY_W     = HOUSE_W / 3; // ~4m per bay

const HW2 = HOUSE_W / 2;   // half width
const HD2 = HOUSE_D / 2;   // half depth

// ── Materials ─────────────────────────────────────────────────────
const MATS = {
  roofTile:   new THREE.MeshStandardMaterial({ color: 0x4a4a5a, roughness: 0.7, metalness: 0.05 }),
  roofFrame:  new THREE.MeshStandardMaterial({ color: 0x5a3a28, roughness: 0.6, metalness: 0.0 }),
  wall:       new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.8, metalness: 0.0 }),
  upperWall:  new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.8, metalness: 0.0 }),
  interior:   new THREE.MeshStandardMaterial({ color: 0xede6d8, roughness: 0.8, metalness: 0.0 }),
  floor:      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7, metalness: 0.1 }),
  column:     new THREE.MeshStandardMaterial({ color: 0x6b3a20, roughness: 0.5, metalness: 0.0 }),
  door:       new THREE.MeshStandardMaterial({ color: 0x4a2818, roughness: 0.5, metalness: 0.0 }),
  window:     new THREE.MeshStandardMaterial({ color: 0x5a3828, roughness: 0.4, metalness: 0.0, emissive: 0x331100, emissiveIntensity: 0.3 }),
  ridge:      new THREE.MeshStandardMaterial({ color: 0x3a3a48, roughness: 0.6, metalness: 0.05 }),
};

// ── Global state ──────────────────────────────────────────────────
const houseGroup = new THREE.Group();
/** @type {Map<string, { group: THREE.Group, label: string, color: string, deps: string[], orig: THREE.Vector3, target: THREE.Vector3, assembled: boolean, meshArr: THREE.Mesh[] }>} */
const parts = new Map();
const selected = new Set();
let isDisassembled = false;
let hoveredPart = null;
let animationSpeed = 4.0; // lerp speed

// ── Three.js setup ────────────────────────────────────────────────
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a14);
scene.fog = new THREE.Fog(0x0a0a14, 12, 40);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.5, 60);
camera.position.set(10, 7, 16);
camera.lookAt(0, 2.2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

// ── Controls ──────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 5;
controls.maxDistance = 30;
controls.maxPolarAngle = Math.PI * 0.7;
controls.target.set(0, 2.2, 0);
controls.update();

// ── Lighting ──────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x334466, 1.8));
const sun = new THREE.DirectionalLight(0xffeedd, 2.5);
sun.position.set(15, 20, 10);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 80;
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -20;
sun.shadow.bias = -0.0001;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x8899cc, 0.8);
fill.position.set(-8, 3, -6);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xaabbdd, 0.5);
rim.position.set(0, -1, 8);
scene.add(rim);

// ── Environment ───────────────────────────────────────────────────
scene.add(createStarfield({ count: 150, radius: 40, distribution: 'cube', size: 0.03, color: 0x667799, opacity: 0.4 }));

// Ground plane
const groundGeo = new THREE.PlaneGeometry(40, 40);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.9, metalness: 0 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
ground.receiveShadow = true;
ground.name = '_ground';
scene.add(ground);

// Grid helper
const grid = new THREE.PolarGridHelper(12, 32, 24, 128, 0x222233, 0x161622);
grid.position.y = -0.04;
scene.add(grid);

// ── Build house ───────────────────────────────────────────────────
scene.add(houseGroup);

// Helper: create a part group with metadata
function createPart(name, label, color, deps = []) {
  const g = new THREE.Group();
  g.name = name;
  const orig = new THREE.Vector3();
  parts.set(name, {
    group: g, label, color, deps,
    orig: new THREE.Vector3(),
    target: new THREE.Vector3(),
    assembled: true,
    meshArr: [],
  });
  houseGroup.add(g);
  return g;
}

// Helper: add mesh to part, tracking it
function addMesh(partName, mesh) {
  const p = parts.get(partName);
  if (p) {
    p.meshArr.push(mesh);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.partName = partName;
  }
}

// Convenience: box mesh
function box(w, h, d, material, partName) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, material);
  if (partName) addMesh(partName, mesh);
  return mesh;
}

// ── Floor / Foundation ───────────────────────────────────────────
const floorGrp = createPart('floor', '地基', '#888888', [
  'wallFront', 'wallBack', 'wallLeft', 'wallRight',
  'interiorWall1', 'interiorWall2',
]);
const floorMesh = box(HOUSE_W + 0.6, FLOOR_H, HOUSE_D + 0.6, MATS.floor, 'floor');
floorMesh.position.y = FLOOR_H / 2;
floorGrp.add(floorMesh);
// Stone step at front entrance
const step = box(BAY_W * 0.8, 0.12, 1.2, MATS.floor, 'floor');
step.position.set(0, FLOOR_H + 0.06, HD2 + 0.5);
floorGrp.add(step);

// ── Columns ───────────────────────────────────────────────────────
const COLUMN_R = 0.15;
const colGrp = createPart('columns', '木柱', '#6b3a20', ['roofFrame']);
const colPositions = [
  [-HW2 + 0.3, HD2 - 0.3], [0, HD2 - 0.3], [HW2 - 0.3, HD2 - 0.3], // front
  [-HW2 + 0.3, -HD2 + 0.3], [0, -HD2 + 0.3], [HW2 - 0.3, -HD2 + 0.3], // back
  [-HW2 + 0.3, 0], [HW2 - 0.3, 0], // sides center
];
colPositions.forEach(([cx, cz]) => {
  const colGeo = new THREE.CylinderGeometry(COLUMN_R, COLUMN_R * 1.15, WALL_H1 + FLOOR_H, 16);
  const col = new THREE.Mesh(colGeo, MATS.column);
  col.position.set(cx, (WALL_H1 + FLOOR_H) / 2, cz);
  addMesh('columns', col);
  colGrp.add(col);
});

// ── First Floor Walls ─────────────────────────────────────────────
function makeWall(name, label, color, w, h, d, px, py, pz, deps) {
  const grp = createPart(name, label, color, deps);
  const mesh = box(w, h, d, MATS.wall, name);
  mesh.position.set(px, py, pz);
  grp.add(mesh);
  return grp;
}

const WY1 = WALL_H1 / 2 + FLOOR_H; // first floor wall center Y

makeWall('wallFront', '前墙(一层)', '#f2ece0', HOUSE_W, WALL_H1, WALL_T, 0, WY1, HD2,
  ['upperWallFront']);
makeWall('wallBack',  '后墙(一层)', '#f2ece0', HOUSE_W, WALL_H1, WALL_T, 0, WY1, -HD2,
  ['upperWallBack']);
makeWall('wallLeft',  '左墙(一层)', '#f2ece0', WALL_T, WALL_H1, HOUSE_D, -HW2, WY1, 0,
  ['upperWallLeft']);
makeWall('wallRight', '右墙(一层)', '#f2ece0', WALL_T, WALL_H1, HOUSE_D, HW2, WY1, 0,
  ['upperWallRight']);

// Interior walls (between 3 bays)
function makeInteriorWall(name, label, x, deps) {
  const grp = createPart(name, label, '#ede6d8', deps);
  // Slightly thinner, fits between front and back walls
  const mesh = box(WALL_T * 0.8, WALL_H1, HOUSE_D - WALL_T * 2, MATS.interior, name);
  mesh.position.set(x, WY1, 0);
  grp.add(mesh);
  return grp;
}
makeInteriorWall('interiorWall1', '隔墙(左)', -BAY_W / 2, ['upperWallFront', 'upperWallBack']);
makeInteriorWall('interiorWall2', '隔墙(右)',  BAY_W / 2, ['upperWallFront', 'upperWallBack']);

// ── Upper Half-Story Walls ───────────────────────────────────────
const WY2 = WALL_H1 + WALL_H2 / 2 + FLOOR_H; // upper wall center Y

function makeUpperWall(name, label, color, w, h, d, px, py, pz, deps) {
  const grp = createPart(name, label, color, deps);
  const mesh = box(w, h, d, MATS.upperWall, name);
  mesh.position.set(px, py, pz);
  grp.add(mesh);
  return grp;
}

makeUpperWall('upperWallFront', '前墙(二层)', '#e8e0d0', HOUSE_W, WALL_H2, WALL_T, 0, WY2, HD2,
  ['roofFrame']);
makeUpperWall('upperWallBack',  '后墙(二层)', '#e8e0d0', HOUSE_W, WALL_H2, WALL_T, 0, WY2, -HD2,
  ['roofFrame']);

// Gable walls (left/right upper walls — triangular tops, but simplified as rectangles)
makeUpperWall('upperWallLeft',  '山墙(左)', '#e0d8c8', WALL_T, WALL_H2 + 0.5, HOUSE_D, -HW2, WY2 - 0.25, 0,
  ['roofFrame']);
makeUpperWall('upperWallRight', '山墙(右)', '#e0d8c8', WALL_T, WALL_H2 + 0.5, HOUSE_D, HW2, WY2 - 0.25, 0,
  ['roofFrame']);

// ── Roof Frame (beams & purlins) ──────────────────────────────────
const rfGrp = createPart('roofFrame', '屋架(梁檩)', '#5a3a28', ['roofTiles']);
// Ridge purlin
const ridgeBeam = box(HOUSE_W + 1.4, 0.15, 0.12, MATS.roofFrame, 'roofFrame');
ridgeBeam.position.set(0, ROOF_H - 0.08, 0);
rfGrp.add(ridgeBeam);
// Eave purlins (front & back)
[-HD2 - 0.8, HD2 + 0.8].forEach(z => {
  const purlin = box(HOUSE_W + 1.4, 0.1, 0.1, MATS.roofFrame, 'roofFrame');
  purlin.position.set(0, EAVE_H + 0.05, z);
  rfGrp.add(purlin);
});
// Rafters (slanted beams, simplified as thin boxes)
for (let i = 0; i < 11; i++) {
  const x = -HOUSE_W / 2 - 0.5 + i * (HOUSE_W + 1) / 10;
  for (let side = -1; side <= 1; side += 2) {
    const rafterGeo = new THREE.BoxGeometry(0.06, 0.06, HOUSE_D / 2 + 1.2);
    const rafter = new THREE.Mesh(rafterGeo, MATS.roofFrame);
    const zMid = side * (HOUSE_D / 4 + 0.25);
    const yMid = (ROOF_H + EAVE_H) / 2;
    rafter.position.set(x, yMid, zMid);
    const angle = side * Math.atan2(ROOF_H - EAVE_H, HOUSE_D / 2 + 1);
    rafter.rotation.x = angle;
    addMesh('roofFrame', rafter);
    rfGrp.add(rafter);
  }
}

// ── Roof Tiles (gable roof as triangular prism) ───────────────────
const roofGrp = createPart('roofTiles', '瓦片屋顶', '#4a4a5a', []);
const rHW = HW2 + ROOF_OH + 0.1;  // half width with overhang
const rHD = HD2 + ROOF_OH + 0.1;  // half depth with overhang

// Build roof as custom BufferGeometry
const roofVerts = new Float32Array([
  // Ridge line
  -rHW, ROOF_H, 0,
   rHW, ROOF_H, 0,
  // Front eave
  -rHW, EAVE_H,  rHD,
   rHW, EAVE_H,  rHD,
  // Back eave
  -rHW, EAVE_H, -rHD,
   rHW, EAVE_H, -rHD,
]);
const roofIndices = [
  // Front slope
  0, 1, 3,  0, 3, 2,
  // Back slope
  0, 5, 1,  0, 4, 5,
  // Left gable
  0, 2, 4,
  // Right gable
  1, 5, 3,
];
const roofGeo = new THREE.BufferGeometry();
roofGeo.setAttribute('position', new THREE.BufferAttribute(roofVerts, 3));
roofGeo.setIndex(roofIndices);
roofGeo.computeVertexNormals();

const roofMesh = new THREE.Mesh(roofGeo, MATS.roofTile);
addMesh('roofTiles', roofMesh);
roofGrp.add(roofMesh);

// Ridge cap (decorative ridge tiles)
const ridgeCap = box(HOUSE_W + 1.8, 0.2, 0.3, MATS.ridge, 'roofTiles');
ridgeCap.position.set(0, ROOF_H + 0.1, 0);
roofGrp.add(ridgeCap);

// Ridge end ornaments (curved up tips — simplified)
[-1, 1].forEach(side => {
  const tipGeo = new THREE.BoxGeometry(0.3, 0.1, 0.35);
  const tip = new THREE.Mesh(tipGeo, MATS.ridge);
  tip.position.set(side * (HW2 + 1.0), ROOF_H + 0.25, 0);
  tip.rotation.z = side * 0.15;
  tip.rotation.x = 0.1;
  addMesh('roofTiles', tip);
  roofGrp.add(tip);
});

// ── Door (central bay, front) ─────────────────────────────────────
const doorGrp = createPart('doorFront', '大门', '#4a2818', ['wallFront']);
// Door frame
const doorFrameL = box(0.1, 2.3, 0.08, MATS.door, 'doorFront');
doorFrameL.position.set(-0.75, 1.3 + FLOOR_H, HD2 + WALL_T / 2 + 0.04);
doorGrp.add(doorFrameL);
const doorFrameR = box(0.1, 2.3, 0.08, MATS.door, 'doorFront');
doorFrameR.position.set(0.75, 1.3 + FLOOR_H, HD2 + WALL_T / 2 + 0.04);
doorGrp.add(doorFrameR);
const doorFrameT = box(1.6, 0.1, 0.08, MATS.door, 'doorFront');
doorFrameT.position.set(0, 2.4 + FLOOR_H, HD2 + WALL_T / 2 + 0.04);
doorGrp.add(doorFrameT);
// Door panels (two leaves)
[-0.35, 0.35].forEach(xo => {
  const panel = box(0.7, 2.0, 0.05, new THREE.MeshStandardMaterial({
    color: 0x5a3020, roughness: 0.4, metalness: 0.05,
  }), 'doorFront');
  panel.position.set(xo, 1.15 + FLOOR_H, HD2 + WALL_T / 2 + 0.06);
  doorGrp.add(panel);
});
// Doorstep
const doorstep = box(1.8, 0.08, 0.25, MATS.floor, 'doorFront');
doorstep.position.set(0, FLOOR_H + 0.04, HD2 + WALL_T / 2 + 0.1);
doorGrp.add(doorstep);

// ── Windows ───────────────────────────────────────────────────────
const winGrp = createPart('windows', '窗户', '#5a3828', ['wallFront', 'wallBack']);

function makeWindow(x, y, z, ry = 0) {
  const wGrp = new THREE.Group();
  // Frame
  const fw = 1.1, fh = 1.4, ft = 0.06;
  const frameV = box(ft, fh, ft, MATS.window, 'windows');
  [-fw / 2, fw / 2].forEach(xo => {
    const f = frameV.clone();
    f.material = frameV.material;
    f.position.set(xo, 0, 0);
    wGrp.add(f);
  });
  const frameH = box(fw, ft, ft, MATS.window, 'windows');
  [-fh / 2, fh / 2].forEach(yo => {
    const f = frameH.clone();
    f.material = frameH.material;
    f.position.set(0, yo, 0);
    wGrp.add(f);
  });
  // Cross mullions
  const mullV = box(ft * 0.7, fh * 0.85, ft * 0.7, MATS.window, 'windows');
  wGrp.add(mullV);
  const mullH = box(fw * 0.85, ft * 0.7, ft * 0.7, MATS.window, 'windows');
  wGrp.add(mullH);

  wGrp.position.set(x, y, z);
  wGrp.rotation.y = ry;
  return wGrp;
}

// Front windows (side bays)
const winY = 1.6 + FLOOR_H;
const winZ = HD2 + WALL_T / 2 + 0.05;
[-BAY_W, BAY_W].forEach(x => {
  winGrp.add(makeWindow(x, winY, winZ));
});
// Back windows (each bay)
[-BAY_W, 0, BAY_W].forEach(x => {
  winGrp.add(makeWindow(x, winY, -HD2 - WALL_T / 2 - 0.05, Math.PI));
});

// ── Store original positions ──────────────────────────────────────
parts.forEach((p) => {
  p.group.getWorldPosition(p.orig);
  p.target.copy(p.orig);
});

// ── Collect & annotate all meshes (for raycasting) ─────────────────
parts.forEach((p, name) => {
  p.meshArr = [];
  p.group.traverse((child) => {
    if (child.isMesh) {
      child.userData.partName = name;
      p.meshArr.push(child);
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
});

// ── Legend UI ─────────────────────────────────────────────────────
const legendItems = document.getElementById('legend-items');
parts.forEach((p, name) => {
  const div = document.createElement('div');
  div.className = 'legend-item';
  div.dataset.part = name;
  div.innerHTML = `<span class="legend-dot" style="background:${p.color}"></span>${p.label}`;
  div.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePart(name);
  });
  legendItems.appendChild(div);
});

function updateLegendUI() {
  document.querySelectorAll('.legend-item').forEach(el => {
    const name = el.dataset.part;
    if (!name) return;
    const p = parts.get(name);
    const sel = selected.has(name);
    const dis = !p.assembled;
    el.classList.toggle('selected', sel);
    if (dis) el.style.opacity = '0.5';
    else el.style.opacity = sel ? '1' : '';
  });
}

// ── Selection logic ───────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
raycaster.far = 30;
const mouse = new THREE.Vector2();

function getAllSelectable() {
  const meshes = [];
  parts.forEach(p => {
    p.meshArr.forEach(m => meshes.push(m));
  });
  return meshes;
}

function raycastPart(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(getAllSelectable(), false);
  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj) {
      if (obj.userData.partName) return obj.userData.partName;
      obj = obj.parent;
    }
  }
  return null;
}

function togglePart(name) {
  if (selected.has(name)) {
    selected.delete(name);
  } else {
    selected.add(name);
  }
  updateLegendUI();
  updatePartHighlights();
  updateInfoPanel();
}

function clearSelection() {
  selected.clear();
  updateLegendUI();
  updatePartHighlights();
  updateInfoPanel();
}

function updatePartHighlights() {
  parts.forEach((p, name) => {
    const sel = selected.has(name);
    p.meshArr.forEach(m => {
      if (Array.isArray(m.material)) {
        m.material.forEach(mat => {
          mat.emissive = new THREE.Color(sel ? 0x336699 : 0x000000);
          mat.emissiveIntensity = sel ? 0.5 : 0;
        });
      } else {
        m.material.emissive = new THREE.Color(sel ? 0x336699 : 0x000000);
        m.material.emissiveIntensity = sel ? 0.5 : 0;
      }
    });
  });
}

function updateInfoPanel() {
  const nameEl = document.getElementById('part-name');
  const hintEl = document.getElementById('part-hint');
  if (selected.size === 0) {
    nameEl.textContent = '点击选择部件';
    hintEl.innerHTML = '拖拽框选 · 按 <kbd>1</kbd> 拆解';
  } else if (selected.size === 1) {
    const [n] = selected;
    const p = parts.get(n);
    nameEl.textContent = p.label;
    hintEl.innerHTML = '按 <kbd>1</kbd> 拆解 · 点击取消选择';
  } else {
    nameEl.textContent = `已选 ${selected.size} 个部件`;
    hintEl.innerHTML = '按 <kbd>1</kbd> 拆解 · 点击空白取消';
  }
}

// ── Rubber-band selection ─────────────────────────────────────────
const selBox = document.getElementById('sel-box');
let selStart = new THREE.Vector2();
let selActive = false;

function screenPos(worldPos) {
  const v = worldPos.clone().project(camera);
  const rect = renderer.domElement.getBoundingClientRect();
  return {
    x: (v.x * 0.5 + 0.5) * rect.width + rect.left,
    y: (-v.y * 0.5 + 0.5) * rect.height + rect.top,
  };
}

function selectInRect(x1, y1, x2, y2) {
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);

  const found = new Set();
  parts.forEach((p, name) => {
    // Use group world position for selection test
    const wp = new THREE.Vector3();
    p.group.getWorldPosition(wp);
    // Check several points on the part for better coverage
    const checkPoints = [wp];
    if (p.meshArr.length > 0) {
      // Add mesh bounding box corners
      p.meshArr.forEach(m => {
        const box = new THREE.Box3().setFromObject(m);
        const center = new THREE.Vector3();
        box.getCenter(center);
        checkPoints.push(center);
      });
    }
    for (const pt of checkPoints) {
      const sp = screenPos(pt);
      if (sp.x >= minX && sp.x <= maxX && sp.y >= minY && sp.y <= maxY) {
        found.add(name);
        break;
      }
    }
  });
  return found;
}

// ── Dependency resolution ─────────────────────────────────────────
function getRequiredParts(forParts) {
  const required = new Set(forParts);
  const queue = [...forParts];
  while (queue.length > 0) {
    const name = queue.shift();
    const p = parts.get(name);
    if (!p) continue;
    for (const dep of p.deps) {
      if (!required.has(dep)) {
        required.add(dep);
        queue.push(dep);
      }
    }
  }
  return required;
}

// ── Disassemble / Reassemble ──────────────────────────────────────
let tweenActive = false;

function setTargetPositions(partNames, disassemble) {
  partNames.forEach(name => {
    const p = parts.get(name);
    if (!p) return;
    if (disassemble) {
      // Compute offset based on part type
      const offset = getDisassembleOffset(name);
      p.target.copy(p.orig).add(offset);
    } else {
      p.target.copy(p.orig);
    }
  });
  tweenActive = true;
}

function getDisassembleOffset(name) {
  const v = new THREE.Vector3();
  const dist = 3.5;
  switch (name) {
    case 'roofTiles':     v.set(0, dist, 0); break;
    case 'roofFrame':     v.set(0, dist * 0.7, 0); break;
    case 'upperWallFront': v.set(0, 0.3, dist * 0.6); break;
    case 'upperWallBack':  v.set(0, 0.3, -dist * 0.6); break;
    case 'upperWallLeft':  v.set(-dist * 0.5, 0.3, 0); break;
    case 'upperWallRight': v.set(dist * 0.5, 0.3, 0); break;
    case 'wallFront':      v.set(0, 0, dist); break;
    case 'wallBack':       v.set(0, 0, -dist); break;
    case 'wallLeft':       v.set(-dist, 0, 0); break;
    case 'wallRight':      v.set(dist, 0, 0); break;
    case 'interiorWall1':  v.set(0, 2, -0.5); break;
    case 'interiorWall2':  v.set(0, 2, 0.5); break;
    case 'doorFront':      v.set(0, 0.5, dist * 1.2); break;
    case 'windows':        v.set(0, 0.3, dist * 1.1); break;
    case 'columns':      v.set(0, dist * 0.5, dist * 0.4); break;
    case 'floor': v.set(0, -dist * 0.5, 0); break;
    default: v.set(0, dist * 0.5, 0);
  }
  return v;
}

function doDisassemble() {
  if (selected.size === 0) {
    // If nothing selected and currently disassembled, reassemble all
    if (isDisassembled) {
      doReassembleAll();
    }
    return;
  }

  const toMove = getRequiredParts(selected);
  setTargetPositions(toMove, true);
  toMove.forEach(name => {
    const p = parts.get(name);
    if (p) p.assembled = false;
  });
  isDisassembled = true;
  updateLegendUI();
  updateDismantleBtn();
}

function doReassembleAll() {
  const allParts = new Set(parts.keys());
  setTargetPositions(allParts, false);
  parts.forEach(p => { p.assembled = true; });
  isDisassembled = false;
  updateLegendUI();
  updateDismantleBtn();
}

function updateDismantleBtn() {
  const btn = document.getElementById('btn-dismantle');
  if (isDisassembled) {
    btn.textContent = '🔧 组装 (1)';
    btn.classList.add('active');
  } else {
    btn.textContent = '🔧 拆解 (1)';
    btn.classList.remove('active');
  }
}

// ── Event handlers ────────────────────────────────────────────────
let pointerMoved = false;
let pointerDownPos = new THREE.Vector2();
let ctrlSelection = false;

renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerDownPos.set(event.clientX, event.clientY);
  pointerMoved = false;

  if (event.ctrlKey || event.metaKey) {
    ctrlSelection = true;
    event.stopPropagation();
    selStart.set(event.clientX, event.clientY);
    selBox.style.display = 'block';
    selBox.style.left = event.clientX + 'px';
    selBox.style.top = event.clientY + 'px';
    selBox.style.width = '0px';
    selBox.style.height = '0px';
    renderer.domElement.style.cursor = 'crosshair';
  } else {
    ctrlSelection = false;
  }
}, { capture: true });

window.addEventListener('pointermove', (event) => {
  const dx = event.clientX - pointerDownPos.x;
  const dy = event.clientY - pointerDownPos.y;
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
    pointerMoved = true;
  }

  if (ctrlSelection && selActive) {
    const x1 = selStart.x, y1 = selStart.y;
    const x2 = event.clientX, y2 = event.clientY;
    selBox.style.left = Math.min(x1, x2) + 'px';
    selBox.style.top = Math.min(y1, y2) + 'px';
    selBox.style.width = Math.abs(x2 - x1) + 'px';
    selBox.style.height = Math.abs(y2 - y1) + 'px';
  } else if (ctrlSelection && pointerMoved) {
    selActive = true;
  }

  // Hover detection (when not in selection mode)
  if (!ctrlSelection) {
    const part = raycastPart(event);
    if (part !== hoveredPart) {
      hoveredPart = part;
      renderer.domElement.style.cursor = part ? 'pointer' : '';
    }
  }
});

window.addEventListener('pointerup', (event) => {
  if (ctrlSelection && selActive) {
    // Finish rubber-band selection
    const found = selectInRect(selStart.x, selStart.y, event.clientX, event.clientY);
    selected.clear();
    found.forEach(n => selected.add(n));
    updateLegendUI();
    updatePartHighlights();
    updateInfoPanel();
  } else if (ctrlSelection && !pointerMoved) {
    // Ctrl+click — toggle single part
    const part = raycastPart(event);
    if (part) togglePart(part);
  } else if (!ctrlSelection && !pointerMoved && !isDisassembled) {
    // Plain click — toggle single part (only when assembled)
    const part = raycastPart(event);
    if (part) {
      togglePart(part);
    } else {
      clearSelection();
    }
  } else if (!ctrlSelection && !pointerMoved && isDisassembled) {
    // Click on disassembled house → reassemble
    clearSelection();
    doReassembleAll();
  }

  // Reset selection box
  selActive = false;
  ctrlSelection = false;
  selBox.style.display = 'none';
  selBox.style.width = '0px';
  selBox.style.height = '0px';
  renderer.domElement.style.cursor = '';
});

// Keyboard
window.addEventListener('keydown', (event) => {
  if (event.key === '1' || event.key === 'd' || event.key === 'D') {
    event.preventDefault();
    if (isDisassembled) {
      doReassembleAll();
    } else {
      doDisassemble();
    }
  }
  if (event.key === 'Escape') {
    clearSelection();
  }
  if (event.key === '0') {
    // Reset camera
    camera.position.set(10, 7, 16);
    controls.target.set(0, 2.2, 0);
    controls.update();
  }
});

// Buttons
document.getElementById('btn-dismantle').addEventListener('click', () => {
  if (isDisassembled) {
    doReassembleAll();
  } else {
    doDisassemble();
  }
});
document.getElementById('btn-reset').addEventListener('click', () => {
  clearSelection();
  doReassembleAll();
  camera.position.set(10, 7, 16);
  controls.target.set(0, 2.2, 0);
  controls.update();
});

// ── Theme ─────────────────────────────────────────────────────────
setupThemeToggle({
  scene,
  darkBg: 0x0a0a14,
  lightBg: 0xd8dae8,
  fogNear: 12,
  fogFar: 40,
});

// ── Resize ────────────────────────────────────────────────────────
setupResizeHandler(renderer, camera, container);

// ── Animation loop ────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.1);
  controls.update();

  // Tween parts toward targets
  if (tweenActive) {
    let allDone = true;
    parts.forEach((p) => {
      const dx = p.target.x - p.group.position.x;
      const dy = p.target.y - p.group.position.y;
      const dz = p.target.z - p.group.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 0.005) {
        p.group.position.copy(p.target);
      } else {
        allDone = false;
        const speed = animationSpeed * dt;
        const t = Math.min(speed / dist, 1);
        p.group.position.x += dx * t;
        p.group.position.y += dy * t;
        p.group.position.z += dz * t;
      }
    });
    if (allDone) {
      tweenActive = false;
      parts.forEach(p => p.group.position.copy(p.target));
    }
  }

  renderer.render(scene, camera);
}

// ── Start ─────────────────────────────────────────────────────────
hideLoading();
animate();
updateInfoPanel();
updateDismantleBtn();
