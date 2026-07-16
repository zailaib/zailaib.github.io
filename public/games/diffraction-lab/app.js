/* Diffraction Lab — Three.js 3D Light Diffraction Demo */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---- Theme ----
let darkMode = true;
const themeColors = {
  dark:  { bg: 0x050510, fog: 0x050510, floor: 0x111122, grid: 0x333355, grid2: 0x222244, barrier: 0x1a1a2e, barrierEdge: 0x2a2a44, frame: 0x2a2a44 },
  light: { bg: 0xd8dae8, fog: 0xd8dae8, floor: 0xc8cad8, grid: 0x999aac, grid2: 0xaaaabc, barrier: 0xc0c2d0, barrierEdge: 0xa0a2b0, frame: 0xa0a2b0 },
};

// ---- Scene setup ----
const container = document.getElementById('container');
const scene = new THREE.Scene();
const col = darkMode ? themeColors.dark : themeColors.light;
scene.background = new THREE.Color(col.bg);
scene.fog = new THREE.Fog(col.fog, 15, 40);

const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.5, 50);
camera.position.set(2, 3.5, -4);
camera.lookAt(0, 0, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

// ---- OrbitControls ----
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 3);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3;
controls.maxDistance = 15;
controls.zoomSpeed = 0.5;
controls.maxPolarAngle = Math.PI * 0.7;
controls.update();

// ---- Lighting ----
const ambient = new THREE.AmbientLight(0x222244, 1.2);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
keyLight.position.set(5, 10, -5);
scene.add(keyLight);

// ---- Parameters ----
let slitWidth = 0.5;        // a
let slitSep = 2.0;          // d (for double slit)
let wavelength = 550;       // nm → color
let mode = 'double';        // 'single' | 'double'

// ---- Floor grid ----
let gridHelper = new THREE.PolarGridHelper(10, 32, 24, 64, col.grid, col.grid2);
scene.add(gridHelper);

const floorMat = new THREE.MeshStandardMaterial({ color: col.floor, roughness: 0.8, metalness: 0.1 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2.5;
floor.receiveShadow = true;
scene.add(floor);

// ---- Light source ----
const sourceGroup = new THREE.Group();
const srcGlowGeo = new THREE.SphereGeometry(0.2, 32, 32);
const srcGlowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2, roughness: 0.1 });
const srcGlow = new THREE.Mesh(srcGlowGeo, srcGlowMat);
sourceGroup.add(srcGlow);

// Outer glow
const outerGlowGeo = new THREE.SphereGeometry(0.35, 32, 32);
const outerGlowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false });
const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
sourceGroup.add(outerGlow);

const srcHaloGeo = new THREE.SphereGeometry(0.55, 32, 32);
const srcHaloMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false });
sourceGroup.add(new THREE.Mesh(srcHaloGeo, srcHaloMat));

sourceGroup.position.set(0, 0, -5.5);
scene.add(sourceGroup);

// Point light at source
const ptLight = new THREE.PointLight(0xffffff, 8, 6, 0.5);
ptLight.position.copy(sourceGroup.position);
scene.add(ptLight);

// ---- Barrier wall ----
const barrierGroup = new THREE.Group();
const barrierMat = new THREE.MeshStandardMaterial({ color: col.barrier, roughness: 0.4, metalness: 0.3 });
const barrierEdgeMat = new THREE.MeshStandardMaterial({ color: col.barrierEdge, roughness: 0.3, metalness: 0.5 });

// Barrier parts (rebuilt when slit params change)
let barrierParts = [];

function disposeMeshes(g) { g.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) (Array.isArray(c.material)?c.material:[c.material]).forEach(m=>m.dispose()); }); }
function buildBarrier() {
  barrierParts.forEach(p => { disposeMeshes(p); barrierGroup.remove(p); });
  barrierParts = [];

  const wallWidth = 8;
  const wallHeight = 6;
  const wallDepth = 0.2;

  if (mode === 'single') {
    // Two blocks: top and bottom of slit
    const gapHalf = slitWidth / 2;
    const topH = (wallHeight - gapHalf * 2) / 2;

    const topBlock = new THREE.Mesh(
      new THREE.BoxGeometry(wallWidth, wallHeight / 2 - gapHalf, wallDepth),
      barrierMat
    );
    topBlock.position.y = gapHalf + (wallHeight / 2 - gapHalf) / 2;
    topBlock.castShadow = true;
    topBlock.receiveShadow = true;
    barrierGroup.add(topBlock);
    barrierParts.push(topBlock);

    const bottomBlock = new THREE.Mesh(
      new THREE.BoxGeometry(wallWidth, wallHeight / 2 - gapHalf, wallDepth),
      barrierMat
    );
    bottomBlock.position.y = -(gapHalf + (wallHeight / 2 - gapHalf) / 2);
    bottomBlock.castShadow = true;
    bottomBlock.receiveShadow = true;
    barrierGroup.add(bottomBlock);
    barrierParts.push(bottomBlock);
  } else {
    // Three blocks: top, middle (between slits), bottom
    const gapHalf = slitWidth / 2;
    const sepHalf = slitSep / 2;
    const totalBlockH = wallHeight - slitWidth * 2;

    // Top block
    const topY = sepHalf + gapHalf + (wallHeight / 2 - sepHalf - gapHalf) / 2;
    const topH = wallHeight / 2 - sepHalf - gapHalf;
    const topBlock = new THREE.Mesh(
      new THREE.BoxGeometry(wallWidth, topH, wallDepth), barrierMat
    );
    topBlock.position.y = topY;
    topBlock.castShadow = true;
    barrierGroup.add(topBlock);
    barrierParts.push(topBlock);

    // Middle block (between the two slits)
    const midH = sepHalf * 2 - gapHalf * 2;
    if (midH > 0.05) {
      const midBlock = new THREE.Mesh(
        new THREE.BoxGeometry(wallWidth, midH, wallDepth), barrierMat
      );
      midBlock.castShadow = true;
      barrierGroup.add(midBlock);
      barrierParts.push(midBlock);
    }

    // Bottom block
    const botH = wallHeight / 2 - sepHalf - gapHalf;
    const botBlock = new THREE.Mesh(
      new THREE.BoxGeometry(wallWidth, botH, wallDepth), barrierMat
    );
    botBlock.position.y = -(sepHalf + gapHalf + botH / 2);
    botBlock.castShadow = true;
    barrierGroup.add(botBlock);
    barrierParts.push(botBlock);
  }

  // Decorative border (hollow frame — four strips, not a solid box)
  const frameThick = 0.06;
  const frameDepth = wallDepth + 0.04;
  // Top strip
  const topEdge = new THREE.Mesh(
    new THREE.BoxGeometry(wallWidth + 0.1, frameThick, frameDepth), barrierEdgeMat
  );
  topEdge.position.set(0, wallHeight / 2 + 0.03, 0);
  barrierGroup.add(topEdge);
  barrierParts.push(topEdge);
  // Bottom strip
  const botEdge = new THREE.Mesh(
    new THREE.BoxGeometry(wallWidth + 0.1, frameThick, frameDepth), barrierEdgeMat
  );
  botEdge.position.set(0, -wallHeight / 2 - 0.03, 0);
  barrierGroup.add(botEdge);
  barrierParts.push(botEdge);
  // Left strip
  const leftEdge = new THREE.Mesh(
    new THREE.BoxGeometry(frameThick, wallHeight + 0.1, frameDepth), barrierEdgeMat
  );
  leftEdge.position.set(-wallWidth / 2 - 0.03, 0, 0);
  barrierGroup.add(leftEdge);
  barrierParts.push(leftEdge);
  // Right strip
  const rightEdge = new THREE.Mesh(
    new THREE.BoxGeometry(frameThick, wallHeight + 0.1, frameDepth), barrierEdgeMat
  );
  rightEdge.position.set(wallWidth / 2 + 0.03, 0, 0);
  barrierGroup.add(rightEdge);
  barrierParts.push(rightEdge);
}
barrierGroup.position.set(0, 0, 0);
buildBarrier();
scene.add(barrierGroup);

// ---- Screen ----
const screenCanvas = document.createElement('canvas');
screenCanvas.width = 512;
screenCanvas.height = 512;
const screenCtx = screenCanvas.getContext('2d');

const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.minFilter = THREE.LinearFilter;
screenTex.magFilter = THREE.LinearFilter;

const screenGeo = new THREE.PlaneGeometry(6, 6);
const screenMat = new THREE.MeshStandardMaterial({
  map: screenTex,
  roughness: 0.5,
  metalness: 0.1,
  side: THREE.DoubleSide,
});
const screenPlane = new THREE.Mesh(screenGeo, screenMat);
screenPlane.position.set(0, 0, 6);
scene.add(screenPlane);

// Screen frame
const frameGeo = new THREE.BoxGeometry(6.2, 6.2, 0.15);
const frameMat = new THREE.MeshStandardMaterial({ color: col.frame, roughness: 0.3, metalness: 0.5 });
const frame = new THREE.Mesh(frameGeo, frameMat);
frame.position.copy(screenPlane.position);
frame.position.z += 0.08;
scene.add(frame);

// ---- Wave particles ----
const PARTICLE_COUNT = 300;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
const particleColors = new Float32Array(PARTICLE_COUNT * 3);
const particleData = [];

function wavelengthToColor(nm) {
  // Simple visible spectrum mapping
  let r, g, b;
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / (440 - 380); g = 0; b = 1;
  } else if (nm >= 440 && nm < 490) {
    r = 0; g = (nm - 440) / (490 - 440); b = 1;
  } else if (nm >= 490 && nm < 510) {
    r = 0; g = 1; b = -(nm - 510) / (510 - 490);
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / (580 - 510); g = 1; b = 0;
  } else if (nm >= 580 && nm < 645) {
    r = 1; g = -(nm - 645) / (645 - 580); b = 0;
  } else if (nm >= 645 && nm <= 780) {
    r = 1; g = 0; b = 0;
  } else {
    r = 0.5; g = 0.5; b = 1;
  }
  // Intensity fade at edges
  let factor = 1;
  if (nm < 420) factor = 0.3 + 0.7 * (nm - 380) / (420 - 380);
  if (nm > 700) factor = 0.3 + 0.7 * (780 - nm) / (780 - 700);
  return { r: r * factor, g: g * factor, b: b * factor };
}

function resetParticles() {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const z = Math.random() * 12 - 0.1; // from just after barrier to beyond screen
    const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.7;
    const x = Math.sin(spreadAngle) * z;
    const slitY = mode === 'single' ? 0 : (Math.random() < 0.5 ? slitSep / 2 : -slitSep / 2);
    const y = slitY + (Math.random() - 0.5) * slitWidth * 0.5;
    particleData[i] = {
      slitY,
      spreadAngle,
      z,
      speed: 2.5 + Math.random() * 2,
      brightness: 0.4 + Math.random() * 0.6,
    };
    updateParticlePosition(i);
  }
}

function updateParticlePosition(i) {
  const d = particleData[i];
  const idx = i * 3;
  particlePositions[idx] = Math.sin(d.spreadAngle) * d.z;
  particlePositions[idx + 1] = d.slitY + (Math.random() - 0.5) * 0.02;
  particlePositions[idx + 2] = d.z;
  const col = wavelengthToColor(wavelength);
  particleColors[idx] = col.r * d.brightness;
  particleColors[idx + 1] = col.g * d.brightness;
  particleColors[idx + 2] = col.b * d.brightness;
}

resetParticles();
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

const particleMat = new THREE.PointsMaterial({
  size: 0.06,
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  opacity: 0.7,
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ---- Wave plane (top-down interference field on floor) ----
const waveCanvas = document.createElement('canvas');
waveCanvas.width = 512;
waveCanvas.height = 512;
const waveCtx = waveCanvas.getContext('2d');
const waveTex = new THREE.CanvasTexture(waveCanvas);
waveTex.minFilter = THREE.LinearFilter;
waveTex.magFilter = THREE.LinearFilter;

const wavePlaneGeo = new THREE.PlaneGeometry(11, 11);
const wavePlaneMat = new THREE.MeshBasicMaterial({
  map: waveTex,
  transparent: true,
  opacity: 0.5,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const wavePlane = new THREE.Mesh(wavePlaneGeo, wavePlaneMat);
wavePlane.rotation.x = -Math.PI / 2;
wavePlane.position.y = -2.48;
scene.add(wavePlane);

// ---- Compute interference pattern ----
function computePattern() {
  const w = screenCanvas.width;
  const h = screenCanvas.height;
  screenCtx.clearRect(0, 0, w, h);

  const col = wavelengthToColor(wavelength);
  const lambda = wavelength / 1000; // arbitrary units

  // Draw interference stripes
  for (let py = 0; py < h; py++) {
    const y = (py / h - 0.5) * 8; // map to screen coordinates
    const theta = Math.atan2(y, 6); // angle from slit center to screen point

    let intensity;
    const beta = (Math.PI * slitWidth / lambda) * Math.sin(theta);

    if (mode === 'single') {
      if (Math.abs(beta) < 0.001) {
        intensity = 1;
      } else {
        intensity = Math.pow(Math.sin(beta) / beta, 2);
      }
    } else {
      const alpha = (Math.PI * slitSep / lambda) * Math.sin(theta);
      const cosAlpha = Math.cos(alpha);
      if (Math.abs(beta) < 0.001) {
        intensity = cosAlpha * cosAlpha;
      } else {
        intensity = cosAlpha * cosAlpha * Math.pow(Math.sin(beta) / beta, 2);
      }
    }

    // Clamp and enhance contrast
    intensity = Math.min(1, Math.max(0, intensity));
    intensity = Math.pow(intensity, 0.7); // gamma for visibility

    const stripH = 2;
    const r = Math.floor(col.r * 255 * intensity);
    const g = Math.floor(col.g * 255 * intensity);
    const b = Math.floor(col.b * 255 * intensity);

    screenCtx.fillStyle = `rgb(${r},${g},${b})`;
    screenCtx.fillRect(0, py, w, stripH);
  }

  // Central bright spot
  const centerGrad = screenCtx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.3);
  centerGrad.addColorStop(0, `rgba(${Math.floor(col.r * 255)},${Math.floor(col.g * 255)},${Math.floor(col.b * 255)},0.6)`);
  centerGrad.addColorStop(1, 'rgba(0,0,0,0)');
  screenCtx.fillStyle = centerGrad;
  screenCtx.fillRect(0, h * 0.35, w, h * 0.3);

  screenTex.needsUpdate = true;

  // Also compute wave field on floor
  computeWaveField(col, lambda);
}

function computeWaveField(col, lambda) {
  const w = waveCanvas.width;
  const h = waveCanvas.height;
  waveCtx.fillStyle = 'rgba(0,0,0,0)';
  waveCtx.clearRect(0, 0, w, h);

  for (let px = 0; px < w; px += 2) {
    for (let py = 0; py < h; py += 2) {
      const x = (px / w - 0.5) * 12;
      const z = (py / h) * 12 - 0.5;

      if (z < 0.1) continue; // behind barrier

      // Slit is narrow in Y; diffraction depends on angle from slit to floor point.
      // Floor is at y=-2.48 below the slit plane (y=0).
      // Use total scattering angle for physically correct radial pattern.
      const dy = -2.48;
      const theta = Math.atan2(Math.sqrt(x * x + dy * dy), z);
      const beta = (Math.PI * slitWidth / lambda) * Math.sin(theta);

      let intensity;
      if (mode === 'single') {
        if (Math.abs(beta) < 0.001) intensity = 1;
        else intensity = Math.pow(Math.sin(beta) / beta, 2);
      } else {
        const alpha = (Math.PI * slitSep / lambda) * Math.sin(theta);
        const cosAlpha = Math.cos(alpha);
        if (Math.abs(beta) < 0.001) intensity = cosAlpha * cosAlpha;
        else intensity = cosAlpha * cosAlpha * Math.pow(Math.sin(beta) / beta, 2);
      }

      intensity = Math.pow(Math.min(1, Math.max(0, intensity)), 0.6);
      const alpha = intensity * 0.7;
      waveCtx.fillStyle = `rgba(${Math.floor(col.r * 255)},${Math.floor(col.g * 255)},${Math.floor(col.b * 255)},${alpha})`;
      waveCtx.fillRect(px, py, 2, 2);
    }
  }
  waveTex.needsUpdate = true;
}

// ---- Update scene for parameter changes ----
function updateScene() {
  buildBarrier();
  resetParticles();
  const col = wavelengthToColor(wavelength);
  srcGlowMat.color.setRGB(col.r, col.g, col.b);
  srcGlowMat.emissive.setRGB(col.r, col.g, col.b);
  outerGlowMat.color.setRGB(col.r, col.g, col.b);
  srcHaloMat.color.setRGB(col.r, col.g, col.b);
  ptLight.color.setRGB(col.r, col.g, col.b);
  computePattern();
}
updateScene();

// ---- Animation loop ----
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Update wave particles
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const d = particleData[i];
    d.z += d.speed * 0.02;
    if (d.z > 6.2) {
      // Reset: start just after barrier
      d.z = 0.1 + Math.random() * 0.3;
      d.slitY = mode === 'single' ? 0 : (Math.random() < 0.5 ? slitSep / 2 : -slitSep / 2);
      d.spreadAngle = (Math.random() - 0.5) * Math.PI * 0.65;
      d.brightness = 0.3 + Math.random() * 0.7;
    }
    updateParticlePosition(i);
  }
  particleGeo.attributes.position.needsUpdate = true;
  particleGeo.attributes.color.needsUpdate = true;

  // Subtle source pulse
  const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.08;
  outerGlow.scale.setScalar(pulse);
  ptLight.intensity = 8 * pulse;

  renderer.render(scene, camera);
}

animate();

// ---- Resize ----
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// ---- UI Controls ----
document.getElementById('slit-width').addEventListener('input', (e) => {
  slitWidth = parseFloat(e.target.value);
  document.getElementById('slit-width-val').textContent = slitWidth.toFixed(1);
  updateScene();
});
document.getElementById('slit-sep').addEventListener('input', (e) => {
  slitSep = parseFloat(e.target.value);
  document.getElementById('slit-sep-val').textContent = slitSep.toFixed(1);
  updateScene();
});
document.getElementById('wavelength').addEventListener('input', (e) => {
  wavelength = parseInt(e.target.value);
  document.getElementById('wavelength-val').textContent = wavelength + 'nm';
  updateScene();
});

const singleBtn = document.getElementById('btn-single');
const doubleBtn = document.getElementById('btn-double');
singleBtn.addEventListener('click', () => {
  mode = 'single';
  singleBtn.classList.add('active');
  doubleBtn.classList.remove('active');
  document.getElementById('slit-sep').parentElement.style.opacity = '0.35';
  document.getElementById('slit-sep').parentElement.style.pointerEvents = 'none';
  updateScene();
});
doubleBtn.addEventListener('click', () => {
  mode = 'double';
  doubleBtn.classList.add('active');
  singleBtn.classList.remove('active');
  document.getElementById('slit-sep').parentElement.style.opacity = '1';
  document.getElementById('slit-sep').parentElement.style.pointerEvents = 'auto';
  updateScene();
});

// ---- Theme toggle ----
document.getElementById('theme-btn').addEventListener('click', () => {
  darkMode = !darkMode;
  const tcol = darkMode ? themeColors.dark : themeColors.light;
  document.body.classList.toggle('light', !darkMode);
  document.getElementById('theme-btn').textContent = darkMode ? '☀️' : '🌙';

  // Update Three.js scene
  scene.background = new THREE.Color(tcol.bg);
  scene.fog = new THREE.Fog(tcol.bg, 15, 40);
  floorMat.color.set(tcol.floor);
  barrierMat.color.set(tcol.barrier);
  barrierEdgeMat.color.set(tcol.barrierEdge);
  frameMat.color.set(tcol.frame);

  // Recreate grid (dispose old one first)
  scene.remove(gridHelper);
  gridHelper.geometry.dispose();
  if (Array.isArray(gridHelper.material)) {
    gridHelper.material.forEach(m => m.dispose());
  } else if (gridHelper.material) {
    gridHelper.material.dispose();
  }
  gridHelper = new THREE.PolarGridHelper(10, 32, 24, 64, tcol.grid, tcol.grid2);
  scene.add(gridHelper);

  // Rebuild barrier with new colors
  buildBarrier();
  computePattern();
});

