/* Periodic Table — 3D Electron Shell Visualization */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let lang = 'zh';

// ---- Three.js setup ----
const atomPanel = document.getElementById('atom-panel');
const atomCanvas = document.getElementById('atom-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 50);
camera.position.set(0, 1.5, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas: atomCanvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.4;
controls.minDistance = 3;
controls.maxDistance = 15;
controls.zoomSpeed = 0.5;
controls.target.set(0, 0, 0);
controls.update();

// Lighting
scene.add(new THREE.AmbientLight(0x333355, 1.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 8, 3);
scene.add(dirLight);
const pointLight = new THREE.PointLight(0xffffff, 4, 10);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Background stars
const starsGeo = new THREE.BufferGeometry();
const starsCount = 200;
const starsPos = new Float32Array(starsCount * 3);
for (let i = 0; i < starsCount; i++) {
  starsPos[i * 3] = (Math.random() - 0.5) * 20;
  starsPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
  starsPos[i * 3 + 2] = (Math.random() - 0.5) * 20;
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
const starsMat = new THREE.PointsMaterial({ size: 0.02, color: 0x8888cc, transparent: true, opacity: 0.6, depthWrite: false });
scene.add(new THREE.Points(starsGeo, starsMat));

// ---- Atom objects ----
const atomGroup = new THREE.Group();
scene.add(atomGroup);

// Nucleus
const nucleusGeo = new THREE.SphereGeometry(0.35, 48, 48);
const nucleusMat = new THREE.MeshStandardMaterial({
  color: 0xff4444, roughness: 0.2, metalness: 0.1, emissive: 0xff2222, emissiveIntensity: 0.6,
});
const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
atomGroup.add(nucleus);

// Nucleus glow (shells)
const glowLayers = [];
for (let i = 0; i < 3; i++) {
  const gGeo = new THREE.SphereGeometry(0.4 + i * 0.15, 32, 32);
  const gMat = new THREE.MeshBasicMaterial({
    color: 0xff6666, transparent: true, opacity: 0.08 - i * 0.02, depthWrite: false,
  });
  const glow = new THREE.Mesh(gGeo, gMat);
  atomGroup.add(glow);
  glowLayers.push(glow);
}

// Shell rings + electrons (created dynamically)
let shellGroups = [];
let electronMeshes = []; // flat array for animation

function disposeMeshes(group) {
  group.traverse(c => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) {
      (Array.isArray(c.material) ? c.material : [c.material]).forEach(m => m.dispose());
    }
  });
}
function clearShells() {
  shellGroups.forEach(g => { disposeMeshes(g); atomGroup.remove(g); });
  shellGroups = [];
  electronMeshes = [];
}

const SHELL_RADII = [1.0, 1.8, 2.6, 3.4, 4.2, 5.0, 5.8];

function createShells(shellConfig) {
  clearShells();

  shellConfig.forEach((count, idx) => {
    if (count === 0) return;
    const radius = SHELL_RADII[idx];
    const color = SHELL_COLORS[idx];
    const group = new THREE.Group();
    group.name = SHELL_NAMES[idx];

    // Torus ring
    const torusGeo = new THREE.TorusGeometry(radius, 0.025, 16, 80);
    const torusMat = new THREE.MeshStandardMaterial({
      color, roughness: 0.3, metalness: 0.2, emissive: color, emissiveIntensity: 0.3,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    group.add(torus);

    // Electrons on this shell
    const electrons = [];
    for (let i = 0; i < count; i++) {
      const eGeo = new THREE.SphereGeometry(0.07, 16, 16);
      const eMat = new THREE.MeshStandardMaterial({
        color, roughness: 0.1, metalness: 0.3, emissive: color, emissiveIntensity: 0.7,
      });
      const eMesh = new THREE.Mesh(eGeo, eMat);
      group.add(eMesh);
      electrons.push({ mesh: eMesh, angle: (Math.PI * 2 * i) / count, radius, speed: 0.6 + idx * 0.15 + Math.random() * 0.2 });
      electronMeshes.push(electrons[electrons.length - 1]);
    }

    // Tilt each shell slightly differently
    group.rotation.x = (idx % 3 - 1) * 0.25;
    group.rotation.y = (idx % 2) * Math.PI * 0.15;

    atomGroup.add(group);
    shellGroups.push(group);
  });
}

// ---- Build periodic table ----
const grid = document.getElementById('table-grid');
let selectedZ = 1;

function buildTable() {
  grid.innerHTML = '';

  for (let row = 1; row <= 9; row++) {
    for (let col = 1; col <= 18; col++) {
      const z = findElementAt(row, col);
      if (!z) {
        const empty = document.createElement('div');
        empty.className = 'empty-cell';
        grid.appendChild(empty);
        continue;
      }

      const el = ELEMENTS[z - 1];
      const [sym, nameZh, nameEn, cat] = el;
      const cell = document.createElement('div');
      cell.className = 'el-cell';
      if (z === selectedZ) cell.classList.add('selected');
      cell.style.background = CATEGORY_COLORS[cat] + '22';
      cell.style.borderColor = CATEGORY_COLORS[cat] + '44';
      cell.innerHTML = `<span class="num">${z}</span><span class="sym">${sym}</span>`;
      cell.title = `${z}. ${sym} — ${lang === 'zh' ? nameZh : nameEn}`;
      cell.addEventListener('click', () => selectElement(z));
      grid.appendChild(cell);
    }
  }

  // Category legend
  const legend = document.getElementById('cat-legend');
  legend.innerHTML = CATEGORY_COLORS.map((c, i) =>
    `<div class="cat-item"><span class="cat-dot" style="background:${c}"></span>${lang === 'zh' ? CATEGORY_NAMES_ZH[i] : CATEGORY_NAMES_EN[i]}</div>`
  ).join('');
}

function findElementAt(row, col) {
  for (let z = 1; z <= 118; z++) {
    const pos = GRID_POS[z];
    if (pos && pos[0] === row && pos[1] === col) return z;
  }
  return null;
}

// ---- Select element ----
function selectElement(z) {
  selectedZ = z;
  updateAtom(z);
  updateInfoCard(z);

  // Update grid selection
  document.querySelectorAll('.el-cell').forEach(c => c.classList.remove('selected'));
  const cells = grid.children;
  // Find the right cell
  for (const cell of cells) {
    if (cell.classList.contains('el-cell')) {
      const numEl = cell.querySelector('.num');
      if (numEl && parseInt(numEl.textContent) === z) {
        cell.classList.add('selected');
        cell.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
        break;
      }
    }
  }
}

// ---- Update 3D atom ----
function updateAtom(z) {
  const el = ELEMENTS[z - 1];
  const shells = el[4];

  // Update nucleus size
  const nucleusR = 0.2 + Math.cbrt(z) * 0.12;
  nucleus.scale.setScalar(nucleusR / 0.35);

  // Update nucleus color
  const cat = el[3];
  const catColor = new THREE.Color(CATEGORY_COLORS[cat]);
  nucleusMat.color.copy(catColor);
  nucleusMat.emissive.copy(catColor);
  glowLayers.forEach(g => g.material.color.copy(catColor));
  pointLight.color.copy(catColor);

  // Rebuild shells
  createShells(shells);

  // Shell legend
  const legend = document.getElementById('shell-legend');
  legend.innerHTML = shells.map((count, i) => {
    if (count === 0) return '';
    return `<div class="legend-item"><span class="legend-dot" style="background:${SHELL_COLORS[i]}"></span>${SHELL_NAMES[i]}层: ${count} e⁻</div>`;
  }).join('');
}

// ---- Update info card ----
function updateInfoCard(z) {
  const el = ELEMENTS[z - 1];
  const [sym, nameZh, nameEn, cat, shells] = el;
  const configStr = shells.map((c, i) => c > 0 ? `${SHELL_NAMES[i]}${c}` : '').filter(Boolean).join(' ');

  document.getElementById('info-card').innerHTML = `
    <div class="el-symbol" style="color:${CATEGORY_COLORS[cat]}">${sym}</div>
    <div class="el-name">${lang === 'zh' ? nameZh : nameEn}</div>
    <div class="el-number">原子序数 ${z} · Atomic Number ${z}</div>
    <div class="el-config">${configStr}</div>
    <div class="el-category" style="color:${CATEGORY_COLORS[cat]}">${lang === 'zh' ? CATEGORY_NAMES_ZH[cat] : CATEGORY_NAMES_EN[cat]}</div>
  `;
}

// ---- Resize handler ----
function resizeAtom() {
  const rect = atomPanel.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height);
  camera.aspect = rect.width / Math.max(rect.height, 1);
  camera.updateProjectionMatrix();
}

// ---- Animation loop ----
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const time = Date.now() * 0.001;

  // Animate electrons
  for (const e of electronMeshes) {
    e.angle += e.speed * 0.02;
    e.mesh.position.x = Math.cos(e.angle) * e.radius;
    e.mesh.position.z = Math.sin(e.angle) * e.radius;
  }

  // Subtle nucleus pulse
  const pulse = 1 + Math.sin(time * 2) * 0.04;
  nucleus.scale.setScalar((0.2 + Math.cbrt(selectedZ) * 0.12) / 0.35 * pulse);
  glowLayers.forEach((g, i) => g.scale.setScalar(1 + Math.sin(time * 2.5 + i) * 0.05));

  pointLight.intensity = 3.5 + Math.sin(time * 2) * 0.5;

  renderer.render(scene, camera);
}

// ---- Search ----
document.getElementById('search-input').addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase();
  document.querySelectorAll('.el-cell').forEach(cell => {
    const num = cell.querySelector('.num')?.textContent;
    const sym = cell.querySelector('.sym')?.textContent;
    if (!query) { cell.style.opacity = '1'; return; }
    const el = ELEMENTS[parseInt(num) - 1];
    if (!el) return;
    const [symbol, nameZh, nameEn] = el;
    const match = sym === query ||
      symbol.toLowerCase() === query ||
      num === query ||
      nameZh.includes(query) ||
      nameEn.toLowerCase().includes(query);
    cell.style.opacity = match ? '1' : '0.2';
  });
});

// ---- Lang toggle ----
document.getElementById('lang-toggle').addEventListener('click', () => {
  lang = lang === 'zh' ? 'en' : 'zh';
  document.getElementById('lang-toggle').textContent = lang === 'zh' ? 'EN' : '中文';
  buildTable();
  updateInfoCard(selectedZ);
});

// ---- Init ----
buildTable();
updateAtom(selectedZ);
updateInfoCard(selectedZ);
resizeAtom();
animate();

window.addEventListener('resize', resizeAtom);

// Initial selection highlight
setTimeout(() => {
  const firstCell = grid.querySelector('.el-cell');
  if (firstCell) firstCell.classList.add('selected');
}, 100);

// Theme toggle
document.getElementById('theme-btn').addEventListener('click', () => {
  const light = document.body.classList.toggle('light');
  document.getElementById('theme-btn').textContent = light ? '🌙' : '☀️';
  renderer.setClearColor(light ? 0xd8dae8 : 0x000000, 0);
});
