/* Contour Mountain  3D Topographic Demo */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { hideLoading, setupThemeToggle, setupResizeHandler } from '/games/shared/three-utils.js';

// ---- Scene ----
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 12, 35);

const camera = new THREE.PerspectiveCamera(48, container.clientWidth / container.clientHeight, 0.5, 50);
camera.position.set(5, 5.5, 7.5);
camera.lookAt(0, 1.5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.5, 0);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 3; controls.maxDistance = 18;
controls.zoomSpeed = 0.5;
controls.maxPolarAngle = Math.PI * 0.55;
controls.update();

// Lights
scene.add(new THREE.AmbientLight(0x667799, 1.8));
const sun = new THREE.DirectionalLight(0xffeedd, 2.5);
sun.position.set(8, 10, 4); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 40;
sun.shadow.camera.left = -10; sun.shadow.camera.right = 10;
sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
scene.add(sun);
const fillLight2 = new THREE.DirectionalLight(0x8899cc, 0.5);
fillLight2.position.set(-3, 2, -3);
scene.add(fillLight2);

// Base plane
const baseGeo = new THREE.PlaneGeometry(16, 16);
const baseMat = new THREE.MeshStandardMaterial({ color: 0x335533, roughness: 0.7 });
const base = new THREE.Mesh(baseGeo, baseMat);
base.rotation.x = -Math.PI / 2; base.position.y = -0.1; base.receiveShadow = true;
scene.add(base);

// ---- Terrain generation ----
const TERRAIN_SIZE = 10;
const GRID_RES = 120;
const MAX_HEIGHT = 6;
const SADDLE_ELEVATION = 2.2; // elevation where contour splits from one loop into two

function noise2D(x, y) {
  // Simple value noise using sinusoidal hashing
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);

  function hash(a, b) {
    let h = (a * 374761393 + b * 668265263 + 1274126177) | 0;
    h = ((h >> 16) ^ h) * 0x45d9f3b;
    h = ((h >> 16) ^ h) * 0x45d9f3b;
    h = (h >> 16) ^ h;
    return (h & 0x7fffffff) / 0x7fffffff;
  }

  return (hash(ix, iy) * (1 - ux) * (1 - uy) +
          hash(ix + 1, iy) * ux * (1 - uy) +
          hash(ix, iy + 1) * (1 - ux) * uy +
          hash(ix + 1, iy + 1) * ux * uy);
}

function fbm(x, y) {
  let val = 0, amp = 1, freq = 1, total = 0;
  for (let i = 0; i < 5; i++) {
    val += noise2D(x * freq, y * freq) * amp;
    total += amp;
    amp *= 0.55;
    freq *= 2.0;
  }
  return val / total;
}

function terrainHeight(wx, wy) {
  // === TWO PEAKS demonstrating "equal height" contour concept ===
  // Peak West (higher): visible from afar
  const dWest = Math.sqrt((wx + 2.2) ** 2 + (wy + 0.3) ** 2);
  let h = Math.max(0, 1 - dWest / 3.0) * 5.5;

  // Peak East (slightly lower): forms the pair
  const dEast = Math.sqrt((wx - 2.5) ** 2 + (wy - 0.1) ** 2);
  h += Math.max(0, 1 - dEast / 2.8) * 4.8;

  // Saddle ridge connecting the two peaks (key: contour lines merge!)
  const saddleY = 0.15 * wx;
  const saddleDist = Math.abs(wy - saddleY);
  const alongRidge = Math.abs(wx) < 3.5 ? 1 - Math.abs(wx) / 3.5 : 0;
  h += Math.max(0, alongRidge) * Math.max(0, 1 - saddleDist / 1.2) * 2.0;

  // Small third peak (north)  makes interesting contour patterns
  const dNorth = Math.sqrt((wx + 0.2) ** 2 + (wy - 2.8) ** 2);
  h += Math.max(0, 1 - dNorth / 1.6) * 2.8;

  // Noise detail for natural look
  h += fbm(wx * 1.3 + 0.3, wy * 1.3 + 0.7) * 1.0;

  // Gentle slope down at edges
  const edgeDist = Math.sqrt(wx ** 2 + wy ** 2);
  h *= Math.min(1, 1.1 - edgeDist / 7.5);

  return Math.max(0, h);
}

// Build height map
const heightMap = [];
for (let iy = 0; iy <= GRID_RES; iy++) {
  const row = [];
  const wy = (iy / GRID_RES - 0.5) * TERRAIN_SIZE;
  for (let ix = 0; ix <= GRID_RES; ix++) {
    const wx = (ix / GRID_RES - 0.5) * TERRAIN_SIZE;
    row.push(terrainHeight(wx, wy));
  }
  heightMap.push(row);
}

function getHeight(wx, wy) {
  const ix = (wx / TERRAIN_SIZE + 0.5) * GRID_RES;
  const iy = (wy / TERRAIN_SIZE + 0.5) * GRID_RES;
  const x0 = Math.max(0, Math.min(GRID_RES, Math.floor(ix)));
  const y0 = Math.max(0, Math.min(GRID_RES, Math.floor(iy)));
  const x1 = Math.min(GRID_RES, x0 + 1);
  const y1 = Math.min(GRID_RES, y0 + 1);
  const fx = ix - x0, fy = iy - y0;
  return (heightMap[y0][x0] * (1 - fx) * (1 - fy) +
          heightMap[y0][x1] * fx * (1 - fy) +
          heightMap[y1][x0] * (1 - fx) * fy +
          heightMap[y1][x1] * fx * fy);
}

// ---- Terrain mesh ----
const terrainGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, GRID_RES, GRID_RES);
const positions = terrainGeo.attributes.position.array;
const colors = new Float32Array(positions.length);

for (let i = 0; i < positions.length; i += 3) {
  const wx = positions[i], wy = positions[i + 1];
  const h = terrainHeight(wx, wy);
  positions[i + 2] = h;
  // Color by elevation
  const t = h / MAX_HEIGHT;
  let r, g, b;
  if (t < 0.15) { r = 0.18; g = 0.45; b = 0.15; }        // dark green (lowland)
  else if (t < 0.35) { const s = (t - 0.15) / 0.2; r = 0.2 + s * 0.3; g = 0.48 + s * 0.2; b = 0.1 + s * 0.05; }
  else if (t < 0.55) { const s = (t - 0.35) / 0.2; r = 0.5 + s * 0.3; g = 0.68 - s * 0.15; b = 0.15 + s * 0.1; }
  else if (t < 0.75) { const s = (t - 0.55) / 0.2; r = 0.8 + s * 0.1; g = 0.53 + s * 0.05; b = 0.25 + s * 0.15; }
  else { const s = (t - 0.75) / 0.25; r = 0.9 + s * 0.1; g = 0.58 + s * 0.42; b = 0.4 + s * 0.6; } // → white
  colors[i] = r; colors[i + 1] = g; colors[i + 2] = b;
}
terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
terrainGeo.computeVertexNormals();

const terrainMat = new THREE.MeshStandardMaterial({
  vertexColors: true, roughness: 0.65, metalness: 0.02,
  flatShading: false,
});
const terrain = new THREE.Mesh(terrainGeo, terrainMat);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true; terrain.castShadow = true;
scene.add(terrain);

// ---- Contour lines via Marching Squares ----
const contourGroup = new THREE.Group();
scene.add(contourGroup);

function disposeMeshes(g) {
  g.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) (Array.isArray(c.material)?c.material:[c.material]).forEach(m=>m.dispose()); });
}
function buildContourLines(interval) {
  // Clear existing with proper disposal
  while (contourGroup.children.length > 0) { const c = contourGroup.children[0]; disposeMeshes(c); contourGroup.remove(c); }

  const offset = 0.03; // slight lift to avoid z-fighting
  const step = TERRAIN_SIZE / GRID_RES;

  for (let level = interval; level <= MAX_HEIGHT; level += interval) {
    const segments = [];

    for (let iy = 0; iy < GRID_RES; iy++) {
      const wy0 = (iy / GRID_RES - 0.5) * TERRAIN_SIZE;
      const wy1 = ((iy + 1) / GRID_RES - 0.5) * TERRAIN_SIZE;
      for (let ix = 0; ix < GRID_RES; ix++) {
        const wx0 = (ix / GRID_RES - 0.5) * TERRAIN_SIZE;
        const wx1 = ((ix + 1) / GRID_RES - 0.5) * TERRAIN_SIZE;

        const h00 = heightMap[iy][ix], h10 = heightMap[iy][ix + 1];
        const h01 = heightMap[iy + 1][ix], h11 = heightMap[iy + 1][ix + 1];

        const cellCode = ((h00 >= level) ? 1 : 0) | ((h10 >= level) ? 2 : 0) |
                         ((h11 >= level) ? 4 : 0) | ((h01 >= level) ? 8 : 0);
        if (cellCode === 0 || cellCode === 15) continue;

        // Interpolate crossings on edges
        function interpX(hA, hB, xA, xB) { return xA + (level - hA) / (hB - hA) * (xB - xA); }
        function interpY(hA, hB, yA, yB) { return yA + (level - hA) / (hB - hA) * (yB - yA); }

        const pts = [];
        // Bottom edge
        if ((cellCode & 1) !== ((cellCode & 2) >> 1)) pts.push([interpX(h00, h10, wx0, wx1), wy0]);
        // Right edge
        if ((cellCode & 2) !== ((cellCode & 4) >> 1)) pts.push([wx1, interpY(h10, h11, wy0, wy1)]);
        // Top edge
        if ((cellCode & 4) !== ((cellCode & 8) >> 1)) pts.push([interpX(h01, h11, wx0, wx1), wy1]);
        // Left edge
        if ((cellCode & 8) !== (cellCode & 1)) pts.push([wx0, interpY(h00, h01, wy0, wy1)]);

        if (pts.length === 2) {
          segments.push([pts[0][0], pts[0][1], level + offset, pts[1][0], pts[1][1], level + offset]);
        }
      }
    }

    if (segments.length === 0) continue;

    // Create line geometry from segments
    const linePts = [];
    for (const s of segments) {
      linePts.push(new THREE.Vector3(s[0], s[2], s[1]));
      linePts.push(new THREE.Vector3(s[3], s[5], s[4]));
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x221100,
      transparent: true,
      opacity: 0.55,
      depthTest: true,
    });
    contourGroup.add(new THREE.LineSegments(lineGeo, lineMat));
  }

  document.getElementById('contour-count').textContent =
    Math.floor(MAX_HEIGHT / interval);
}

// ---- Water plane ----
let waterLevel = 1.2;
const waterGeo = new THREE.PlaneGeometry(TERRAIN_SIZE + 1, TERRAIN_SIZE + 1);
const waterMat = new THREE.MeshPhysicalMaterial({
  color: 0x4488cc,
  roughness: 0.1, metalness: 0.05,
  transparent: true, opacity: 0.45,
  depthWrite: false,
});
const waterPlane = new THREE.Mesh(waterGeo, waterMat);
waterPlane.rotation.x = -Math.PI / 2;
waterPlane.position.y = waterLevel;
waterPlane.renderOrder = 1;
scene.add(waterPlane);

function updateWater() {
  waterPlane.position.y = waterLevel;
  document.getElementById('water-val').textContent = (waterLevel * 200).toFixed(0) + 'm';
  document.getElementById('water-val-ft').textContent = (waterLevel * 656).toFixed(0) + 'ft';
}

// ---- Elevation marker poles ----
const markerGroup = new THREE.Group();
scene.add(markerGroup);
function buildMarkers() {
  while (markerGroup.children.length > 0) { const c = markerGroup.children[0]; disposeMeshes(c); markerGroup.remove(c); }
  // Side elevation ruler
  for (let h = 1; h <= Math.floor(MAX_HEIGHT); h++) {
    const wy = -4.5, wx = 4.5;
    const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, h, 8);
    const pole = new THREE.Mesh(poleGeo, new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 }));
    pole.position.set(wx, h / 2, wy); pole.castShadow = true;
    markerGroup.add(pole);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dot.position.set(wx, h, wy);
    markerGroup.add(dot);
  }
  // Peak markers  two flag poles on the summits
  const peaks = [{ x: -2.2, z: 0.3, h: 5.4, label: '西峰' }, { x: 2.5, z: -0.1, h: 4.7, label: '东峰' }];
  peaks.forEach(p => {
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, p.h + 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0xdd4444, roughness: 0.3, emissive: 0x441111, emissiveIntensity: 0.3 })
    );
    flagPole.position.set(p.x, (p.h + 0.8) / 2, p.z);
    flagPole.castShadow = true;
    markerGroup.add(flagPole);
    const flag = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff4444 })
    );
    flag.position.set(p.x, p.h + 0.8, p.z);
    markerGroup.add(flag);
  });
}
buildMarkers();

// ---- UI ----
let contourInterval = 1.0;
let showContours = true;

function updateContours() {
  if (showContours) buildContourLines(contourInterval);
  else { while (contourGroup.children.length > 0) { const c = contourGroup.children[0]; disposeMeshes(c); contourGroup.remove(c); } }
  document.getElementById('contour-interval').textContent = (contourInterval * 200).toFixed(0) + 'm';
}

document.getElementById('water-slider').addEventListener('input', (e) => {
  waterLevel = parseFloat(e.target.value);
  updateWater();
});

document.getElementById('interval-slider').addEventListener('input', (e) => {
  contourInterval = parseFloat(e.target.value);
  updateContours();
});

document.getElementById('contour-toggle').addEventListener('click', () => {
  showContours = !showContours;
  const btn = document.getElementById('contour-toggle');
  btn.textContent = showContours ? '等高线 ON' : '等高线 OFF';
  btn.classList.toggle('on', showContours);
  updateContours();
});

document.getElementById('wireframe-toggle').addEventListener('click', () => {
  terrainMat.wireframe = !terrainMat.wireframe;
  const btn = document.getElementById('wireframe-toggle');
  btn.classList.toggle('on', terrainMat.wireframe);
});

// ---- Resize ----
setupResizeHandler(renderer, camera, container);

// ---- Animate ----
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// ---- Init ----
updateWater();
updateContours();
animate();
hideLoading();

// Theme toggle
setupThemeToggle({
  scene, darkBg: 0x1a1a2e, fogNear: 12, fogFar: 35,
  onThemeChange: (light) => {
    baseMat.color.set(light ? 0x889966 : 0x335533);
  },
});
