/* House Dismantle — Main Entry: setup, interaction, animation */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  hideLoading, showError, setupThemeToggle, setupResizeHandler, createStarfield,
} from '/games/shared/three-utils.js';
import { MATS, CATEGORIES, getDisassembleOffset } from './config.js';
import { buildStructure } from './house-core.js';
import { buildOpenings } from './house-openings.js';
import { buildInterior } from './house-interior.js';
import { buildYard }      from './house-yard.js';
import { buildPlumbing }  from './house-plumbing.js';
import { validateHouse }  from './validate/index.js';

// ── State ─────────────────────────────────────────────────────────
const houseGroup = new THREE.Group();
/** @type {Map<string, { group: THREE.Group, label: string, color: string, deps: string[], assembled: boolean, meshArr: THREE.Mesh[] }>} */
const parts = new Map();
const selected = new Set();
let isDisassembled = false;
let hoveredPart = null;
let tweenActive = false;
const animSpeed = 5.0;

// ── Three.js setup ────────────────────────────────────────────────
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a14);
scene.fog = new THREE.Fog(0x0a0a14, 12, 45);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.5, 70);
camera.position.set(14, 8, 20);
camera.lookAt(0, 3.5, 0);

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
controls.maxDistance = 45;
controls.maxPolarAngle = Math.PI * 0.7;
controls.target.set(0, 3.5, 0);
controls.update();

// ── Lighting ──────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x334466, 2.0));
const sun = new THREE.DirectionalLight(0xffeedd, 3.0);
sun.position.set(15, 20, 10);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048; sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 80;
sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
sun.shadow.bias = -0.0001;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x8899cc, 0.9);
fill.position.set(-8, 3, -6);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xaabbdd, 0.6);
rim.position.set(0, -1, 8);
scene.add(rim);

// ── Environment ───────────────────────────────────────────────────
scene.add(createStarfield({ count: 180, radius: 45, distribution: 'cube', size: 0.03, color: 0x667799, opacity: 0.4 }));

const groundGeo = new THREE.PlaneGeometry(50, 50);
const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.9, metalness: 0 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.PolarGridHelper(18, 32, 36, 128, 0x222233, 0x161622);
grid.position.y = -0.04;
scene.add(grid);

// ── Build house ───────────────────────────────────────────────────
scene.add(houseGroup);

buildStructure(houseGroup, parts, MATS);
buildOpenings(houseGroup, parts, MATS);
buildInterior(houseGroup, parts, MATS);
buildYard(houseGroup, parts, MATS);
buildPlumbing(houseGroup, parts, MATS);

// Verify all PART_DEFS were created (imported from config)
import { PART_DEFS } from './config.js';
for (const def of PART_DEFS) {
  if (!parts.has(def.name)) {
    // Create a placeholder group if not built by any module
    const g = new THREE.Group(); g.name = def.name;
    parts.set(def.name, {
      group: g, label: def.label, color: def.color,
      deps: def.deps, assembled: true, meshArr: [],
    });
    houseGroup.add(g);
  }
}

// ── Spatial validation ───────────────────────────────────────────
validateHouse(parts);

// ── Animation targets ─────────────────────────────────────────────
const targetOff = new Map(); // partName → THREE.Vector3
for (const [name] of parts) {
  targetOff.set(name, new THREE.Vector3(0, 0, 0));
}

// ── Legend UI ─────────────────────────────────────────────────────
const legendItems = document.getElementById('legend-items');

// Category filter buttons
const catBar = document.createElement('div');
catBar.id = 'cat-bar';
let activeCat = null;

for (const [catKey, cat] of Object.entries(CATEGORIES)) {
  const btn = document.createElement('button');
  btn.className = 'cat-btn';
  btn.textContent = cat.label;
  btn.style.setProperty('--cat-color', cat.color);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeCat === catKey) {
      activeCat = null;
      btn.classList.remove('active');
      clearSelection();
    } else {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCat = catKey;
      selected.clear();
      cat.parts.forEach(n => { if (parts.has(n)) selected.add(n); });
      refreshUI();
    }
  });
  catBar.appendChild(btn);
}
legendItems.before(catBar);

// Part items grouped by category
for (const [catKey, cat] of Object.entries(CATEGORIES)) {
  const catLabel = document.createElement('div');
  catLabel.className = 'legend-cat-label';
  catLabel.textContent = cat.label;
  legendItems.appendChild(catLabel);

  for (const name of cat.parts) {
    const p = parts.get(name);
    if (!p) continue;
    const div = document.createElement('div');
    div.className = 'legend-item';
    div.dataset.part = name;
    div.innerHTML = `<span class="legend-dot" style="background:${p.color}"></span>${p.label}`;
    div.addEventListener('click', (e) => { e.stopPropagation(); togglePart(name); });
    legendItems.appendChild(div);
  }
}

// ── UI refresh ────────────────────────────────────────────────────
function refreshUI() {
  updateLegendUI();
  updatePartHighlights();
  updateInfoPanel();
}

function updateLegendUI() {
  document.querySelectorAll('.legend-item').forEach(el => {
    const name = el.dataset.part;
    if (!name) return;
    const p = parts.get(name);
    if (!p) return;
    el.classList.toggle('selected', selected.has(name));
    el.style.opacity = p.assembled ? (selected.has(name) ? '1' : '') : '0.5';
  });
}

function updatePartHighlights() {
  for (const [name, p] of parts) {
    const sel = selected.has(name);
    for (const m of p.meshArr) {
      const mat = m.material;
      const mats = Array.isArray(mat) ? mat : [mat];
      for (const mm of mats) {
        mm.emissive = new THREE.Color(sel ? 0x336699 : 0x000000);
        mm.emissiveIntensity = sel ? 0.5 : 0;
      }
    }
  }
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
    nameEl.textContent = p ? p.label : n;
    hintEl.innerHTML = '按 <kbd>1</kbd> 拆解 · 点击取消';
  } else {
    nameEl.textContent = `已选 ${selected.size} 个部件`;
    hintEl.innerHTML = '按 <kbd>1</kbd> 拆解 · 点击空白取消';
  }
}

// ── Selection ─────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster(); raycaster.far = 40;
const mouse = new THREE.Vector2();

function getAllSelectable() {
  const meshes = [];
  for (const [, p] of parts) for (const m of p.meshArr) meshes.push(m);
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
  if (selected.has(name)) selected.delete(name); else selected.add(name);
  refreshUI();
}

function clearSelection() { selected.clear(); refreshUI(); }

// ── Rubber-band selection ─────────────────────────────────────────
const selBox = document.getElementById('sel-box');
let selStart = new THREE.Vector2();
let selActive = false, ctrlSelecting = false;

function selectInRect(x1, y1, x2, y2) {
  const mx = Math.min(x1, x2), MX = Math.max(x1, x2);
  const my = Math.min(y1, y2), MY = Math.max(y1, y2);
  const found = new Set();
  for (const [name, p] of parts) {
    const wp = new THREE.Vector3(); p.group.getWorldPosition(wp);
    const v = wp.clone().project(camera);
    const rect = renderer.domElement.getBoundingClientRect();
    const sx = (v.x * 0.5 + 0.5) * rect.width + rect.left;
    const sy = (-v.y * 0.5 + 0.5) * rect.height + rect.top;
    if (sx >= mx && sx <= MX && sy >= my && sy <= MY) found.add(name);
  }
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
      if (!required.has(dep)) { required.add(dep); queue.push(dep); }
    }
  }
  return required;
}

// ── Disassemble / Reassemble ──────────────────────────────────────
function doDisassemble() {
  if (selected.size === 0) {
    if (isDisassembled) doReassembleAll();
    return;
  }
  const toMove = getRequiredParts(selected);
  for (const name of toMove) {
    const off = getDisassembleOffset(name);
    targetOff.get(name).set(off[0], off[1], off[2]);
    const p = parts.get(name);
    if (p) p.assembled = false;
  }
  isDisassembled = true;
  tweenActive = true;
  updateLegendUI();
  updateDismantleBtn();
}

function doReassembleAll() {
  for (const [name] of parts) {
    targetOff.get(name).set(0, 0, 0);
    const p = parts.get(name);
    if (p) p.assembled = true;
  }
  isDisassembled = false;
  tweenActive = true;
  updateLegendUI();
  updateDismantleBtn();
}

function updateDismantleBtn() {
  const btn = document.getElementById('btn-dismantle');
  if (isDisassembled) {
    btn.textContent = '🔧 组装 (1)'; btn.classList.add('active');
  } else {
    btn.textContent = '🔧 拆解 (1)'; btn.classList.remove('active');
  }
}

// ── Event handlers ────────────────────────────────────────────────
const pointerDownPos = new THREE.Vector2();

renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerDownPos.set(event.clientX, event.clientY);
  if (event.ctrlKey || event.metaKey) {
    ctrlSelecting = true;
    event.stopPropagation();
    selStart.set(event.clientX, event.clientY);
    selBox.style.display = 'block';
    selBox.style.left = event.clientX + 'px';
    selBox.style.top = event.clientY + 'px';
    selBox.style.width = '0px';
    selBox.style.height = '0px';
    renderer.domElement.style.cursor = 'crosshair';
  } else {
    ctrlSelecting = false;
  }
}, { capture: true });

window.addEventListener('pointermove', (event) => {
  if (ctrlSelecting) {
    const dx = event.clientX - pointerDownPos.x;
    const dy = event.clientY - pointerDownPos.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) selActive = true;
    if (selActive) {
      const x1 = selStart.x, y1 = selStart.y, x2 = event.clientX, y2 = event.clientY;
      selBox.style.left = Math.min(x1, x2) + 'px';
      selBox.style.top = Math.min(y1, y2) + 'px';
      selBox.style.width = Math.abs(x2 - x1) + 'px';
      selBox.style.height = Math.abs(y2 - y1) + 'px';
    }
  }
  if (!ctrlSelecting) {
    const part = raycastPart(event);
    if (part !== hoveredPart) { hoveredPart = part; renderer.domElement.style.cursor = part ? 'pointer' : ''; }
  }
});

window.addEventListener('pointerup', (event) => {
  const clickDist = Math.hypot(event.clientX - pointerDownPos.x, event.clientY - pointerDownPos.y);
  const wasClick = clickDist < 4;

  if (ctrlSelecting && selActive) {
    const found = selectInRect(selStart.x, selStart.y, event.clientX, event.clientY);
    selected.clear(); for (const n of found) selected.add(n);
    refreshUI();
  } else if (ctrlSelecting && wasClick) {
    const part = raycastPart(event);
    if (part) togglePart(part);
  } else if (!ctrlSelecting && wasClick) {
    if (isDisassembled) {
      clearSelection();
      doReassembleAll();
    } else {
      const part = raycastPart(event);
      if (part) togglePart(part);
      else clearSelection();
    }
  }

  selActive = false; ctrlSelecting = false;
  selBox.style.display = 'none';
  selBox.style.width = '0px'; selBox.style.height = '0px';
  renderer.domElement.style.cursor = hoveredPart ? 'pointer' : '';
});

// Keyboard
window.addEventListener('keydown', (event) => {
  if (event.key === '1' || event.key === 'd' || event.key === 'D') {
    event.preventDefault();
    if (isDisassembled) doReassembleAll(); else doDisassemble();
  }
  if (event.key === 'Escape') clearSelection();
  if (event.key === '0') {
    camera.position.set(14, 8, 20);
    controls.target.set(0, 3.5, 0);
    controls.update();
  }
});

// ── Camera Tour ──────────────────────────────────────────────────
const tourKeyframes = [
  { pos: [6,2.5,8],    tgt: [6,2.0,4.3],  dur: 1.5 }, // 0: outside front door (bay4)
  { pos: [2,2.5,3.5],  tgt: [2,2.0,2.0],   dur: 2.5 }, // 1: enter → living room
  { pos: [0,2.5,2],    tgt: [0,2.0,-3.5],  dur: 2.5 }, // 2: living → shrine (back)
  { pos: [-6,2.5,-2],  tgt: [-6,2.0,-3.5], dur: 2.5 }, // 3: left bay → kitchen area
  { pos: [6,2.5,-2],   tgt: [6,2.0,-3.5],  dur: 2.5 }, // 4: right bay → dining
  { pos: [0,5.5,-1],   tgt: [0,5.0,0.5],   dur: 2.0 }, // 5: upstairs via stairs
  { pos: [0,6.0,1],    tgt: [0,5.5,2],     dur: 2.0 }, // 6: look around upper floor
  { pos: [14,8,20],    tgt: [0,3.5,0],     dur: 2.0 }, // 7: return
];
let tourActive = false;
let tourIndex = 0;
let tourT = 0;
const tourStartPos = new THREE.Vector3();
const tourStartTgt = new THREE.Vector3();
const tourEndPos = new THREE.Vector3();
const tourEndTgt = new THREE.Vector3();

function startTour() {
  if (tourActive) { stopTour(); return; }
  if (isDisassembled) doReassembleAll();
  clearSelection();
  tourActive = true;
  tourIndex = 0;
  startKeyframe(0);
  document.getElementById('btn-tour').classList.add('active');
  document.getElementById('btn-tour').textContent = '⏹ 停止';
  controls.enabled = false;
}

function stopTour() {
  tourActive = false;
  document.getElementById('btn-tour').classList.remove('active');
  document.getElementById('btn-tour').textContent = '🎥 参观';
  controls.enabled = true;
}

function startKeyframe(idx) {
  if (idx >= tourKeyframes.length) { stopTour(); return; }
  tourIndex = idx;
  tourT = 0;
  const kf = tourKeyframes[idx];
  tourStartPos.copy(camera.position);
  tourStartTgt.copy(controls.target);
  tourEndPos.set(kf.pos[0], kf.pos[1], kf.pos[2]);
  tourEndTgt.set(kf.tgt[0], kf.tgt[1], kf.tgt[2]);
}

// ── Buttons ───────────────────────────────────────────────────────
document.getElementById('btn-dismantle').addEventListener('click',
  () => isDisassembled ? doReassembleAll() : doDisassemble());
document.getElementById('btn-tour').addEventListener('click', startTour);
document.getElementById('btn-reset').addEventListener('click', () => {
  stopTour();
  clearSelection(); doReassembleAll();
  camera.position.set(10, 7, 16);
  controls.target.set(0, 2.2, 0); controls.update();
});

// ── Theme & Resize ────────────────────────────────────────────────
setupThemeToggle({ scene, darkBg: 0x0a0a14, lightBg: 0xd8dae8, fogNear: 12, fogFar: 45 });
setupResizeHandler(renderer, camera, container);

// ── Animation loop ────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  // Camera tour
  if (tourActive) {
    const kf = tourKeyframes[tourIndex];
    tourT += dt / kf.dur;
    if (tourT >= 1.0) {
      tourT = 1.0;
      camera.position.copy(tourEndPos);
      controls.target.copy(tourEndTgt);
      startKeyframe(tourIndex + 1);
    } else {
      // Smooth ease-in-out
      const t = tourT < 0.5 ? 2*tourT*tourT : 1 - Math.pow(-2*tourT + 2, 2)/2;
      camera.position.lerpVectors(tourStartPos, tourEndPos, t);
      controls.target.lerpVectors(tourStartTgt, tourEndTgt, t);
    }
  }
  controls.update();

  if (tweenActive) {
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
    if (allDone) {
      tweenActive = false;
      for (const [name, p] of parts) p.group.position.copy(targetOff.get(name));
    }
  }

  renderer.render(scene, camera);
}

// ── Start ─────────────────────────────────────────────────────────
hideLoading();
animate();
updateInfoPanel();
updateDismantleBtn();
