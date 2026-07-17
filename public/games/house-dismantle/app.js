/* House Dismantle — Main Entry: setup, interaction, animation */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  hideLoading, showError, setupThemeToggle, setupResizeHandler, createStarfield,
} from '/games/shared/three-utils.js';
import { MATS, CATEGORIES, PART_DEFS, getDisassembleOffset } from './config.js';
import { buildHouse } from './house.js';

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
sun.shadow.mapSize.width = 2048; sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 80;
sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
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

const groundGeo = new THREE.PlaneGeometry(40, 40);
const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.9, metalness: 0 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
ground.receiveShadow = true;
ground.name = '_ground';
scene.add(ground);

const grid = new THREE.PolarGridHelper(12, 32, 24, 128, 0x222233, 0x161622);
grid.position.y = -0.04;
scene.add(grid);

// ── Build house ───────────────────────────────────────────────────
scene.add(houseGroup);
buildHouse(houseGroup, parts, MATS);

// ── Stash original group positions for tween target ───────────────
// Each part group starts at local (0,0,0) in houseGroup.
// We store a "home" position (always 0,0,0) and a "target" offset.
const homePos = new Map();  // partName → THREE.Vector3
const targetOff = new Map(); // partName → THREE.Vector3

for (const [name] of parts) {
  homePos.set(name, new THREE.Vector3(0, 0, 0));
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
  btn.dataset.cat = catKey;
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

// Part items (grouped by category)
for (const [catKey, cat] of Object.entries(CATEGORIES)) {
  const catLabel = document.createElement('div');
  catLabel.className = 'legend-cat-label';
  catLabel.textContent = cat.label;
  catLabel.dataset.cat = catKey;
  legendItems.appendChild(catLabel);

  for (const name of cat.parts) {
    const p = parts.get(name);
    if (!p) continue;
    const div = document.createElement('div');
    div.className = 'legend-item';
    div.dataset.part = name;
    div.innerHTML = `<span class="legend-dot" style="background:${p.color}"></span>${p.label}`;
    div.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePart(name);
    });
    legendItems.appendChild(div);
  }
}

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
    const sel = selected.has(name);
    const dis = !p.assembled;
    el.classList.toggle('selected', sel);
    el.style.opacity = dis ? '0.5' : sel ? '1' : '';
  });
}

function updatePartHighlights() {
  for (const [name, p] of parts) {
    const sel = selected.has(name);
    for (const m of p.meshArr) {
      const mat = m.material;
      if (Array.isArray(mat)) {
        for (const mm of mat) {
          mm.emissive = new THREE.Color(sel ? 0x336699 : 0x000000);
          mm.emissiveIntensity = sel ? 0.5 : 0;
        }
      } else {
        mat.emissive = new THREE.Color(sel ? 0x336699 : 0x000000);
        mat.emissiveIntensity = sel ? 0.5 : 0;
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
    hintEl.innerHTML = '按 <kbd>1</kbd> 拆解 · 点击取消选择';
  } else {
    nameEl.textContent = `已选 ${selected.size} 个部件`;
    hintEl.innerHTML = '按 <kbd>1</kbd> 拆解 · 点击空白取消';
  }
}

// ── Selection ─────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
raycaster.far = 30;
const mouse = new THREE.Vector2();

function getAllSelectable() {
  const meshes = [];
  for (const [, p] of parts) {
    for (const m of p.meshArr) meshes.push(m);
  }
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
  refreshUI();
}

function clearSelection() {
  selected.clear();
  refreshUI();
}

// ── Rubber-band selection ─────────────────────────────────────────
const selBox = document.getElementById('sel-box');
let selStart = new THREE.Vector2();
let selActive = false;
let ctrlSelecting = false;

function selectInRect(x1, y1, x2, y2) {
  const mx = Math.min(x1, x2), MX = Math.max(x1, x2);
  const my = Math.min(y1, y2), MY = Math.max(y1, y2);
  const found = new Set();
  for (const [name, p] of parts) {
    const wp = new THREE.Vector3();
    p.group.getWorldPosition(wp);
    const v = wp.clone().project(camera);
    const rect = renderer.domElement.getBoundingClientRect();
    const sx = (v.x * 0.5 + 0.5) * rect.width + rect.left;
    const sy = (-v.y * 0.5 + 0.5) * rect.height + rect.top;
    if (sx >= mx && sx <= MX && sy >= my && sy <= MY) {
      found.add(name);
    }
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
      if (!required.has(dep)) {
        required.add(dep);
        queue.push(dep);
      }
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
    const offset = getDisassembleOffset(name);
    targetOff.get(name).set(offset[0], offset[1], offset[2]);
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
    btn.textContent = '🔧 组装 (1)';
    btn.classList.add('active');
  } else {
    btn.textContent = '🔧 拆解 (1)';
    btn.classList.remove('active');
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
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      selActive = true;
    }
    if (selActive) {
      const x1 = selStart.x, y1 = selStart.y;
      const x2 = event.clientX, y2 = event.clientY;
      selBox.style.left = Math.min(x1, x2) + 'px';
      selBox.style.top = Math.min(y1, y2) + 'px';
      selBox.style.width = Math.abs(x2 - x1) + 'px';
      selBox.style.height = Math.abs(y2 - y1) + 'px';
    }
  }

  // Hover detection
  if (!ctrlSelecting) {
    const part = raycastPart(event);
    if (part !== hoveredPart) {
      hoveredPart = part;
      renderer.domElement.style.cursor = part ? 'pointer' : '';
    }
  }
});

window.addEventListener('pointerup', (event) => {
  // Compute click distance (reliable click detection)
  const clickDist = Math.hypot(
    event.clientX - pointerDownPos.x,
    event.clientY - pointerDownPos.y
  );
  const wasClick = clickDist < 4;

  if (ctrlSelecting && selActive) {
    // Finish rubber-band selection
    const found = selectInRect(selStart.x, selStart.y, event.clientX, event.clientY);
    selected.clear();
    for (const n of found) selected.add(n);
    refreshUI();
  } else if (ctrlSelecting && wasClick) {
    // Ctrl+click toggle single part
    const part = raycastPart(event);
    if (part) togglePart(part);
  } else if (!ctrlSelecting && wasClick) {
    if (isDisassembled) {
      // Click on disassembled house → reassemble
      clearSelection();
      doReassembleAll();
    } else {
      // Plain click → toggle single part
      const part = raycastPart(event);
      if (part) {
        togglePart(part);
      } else {
        clearSelection();
      }
    }
  }

  // Reset
  selActive = false;
  ctrlSelecting = false;
  selBox.style.display = 'none';
  selBox.style.width = '0px';
  selBox.style.height = '0px';
  renderer.domElement.style.cursor = hoveredPart ? 'pointer' : '';
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
    camera.position.set(10, 7, 16);
    controls.target.set(0, 2.2, 0);
    controls.update();
  }
});

// Buttons
document.getElementById('btn-dismantle').addEventListener('click', () => {
  if (isDisassembled) doReassembleAll();
  else doDisassemble();
});
document.getElementById('btn-reset').addEventListener('click', () => {
  clearSelection();
  doReassembleAll();
  camera.position.set(10, 7, 16);
  controls.target.set(0, 2.2, 0);
  controls.update();
});

// ── Theme & Resize ────────────────────────────────────────────────
setupThemeToggle({ scene, darkBg: 0x0a0a14, lightBg: 0xd8dae8, fogNear: 12, fogFar: 40 });
setupResizeHandler(renderer, camera, container);

// ── Animation loop ────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.1);
  controls.update();

  // Tween parts toward target offsets
  if (tweenActive) {
    let allDone = true;
    for (const [name, p] of parts) {
      const target = targetOff.get(name);
      const pos = p.group.position;
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dz = target.z - pos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 0.003) {
        pos.copy(target);
      } else {
        allDone = false;
        const step = Math.min(animSpeed * dt / dist, 1);
        pos.x += dx * step;
        pos.y += dy * step;
        pos.z += dz * step;
      }
    }
    if (allDone) {
      tweenActive = false;
      for (const [name, p] of parts) {
        p.group.position.copy(targetOff.get(name));
      }
    }
  }

  renderer.render(scene, camera);
}

// ── Start ─────────────────────────────────────────────────────────
hideLoading();
animate();
updateInfoPanel();
updateDismantleBtn();
