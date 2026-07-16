/* Cosmic Velocity — Orbital Mechanics 3D Demo */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { hideLoading, setupThemeToggle, setupResizeHandler, createStarfield } from '/games/shared/three-utils.js';

// ---- Constants ----
const R_EARTH = 2;            // display units (Earth radius)
const MU = 25;                // gravitational parameter (display units)
const KM_PER_UNIT = 6371 / R_EARTH;  // km per display unit
const V_CIRC_DISPLAY = Math.sqrt(MU / R_EARTH); // ~3.54 display-units/s at surface
const SPEED_TO_KMS = 7.9 / V_CIRC_DISPLAY; // multiply display speed → km/s (~2.23)
const SPEED_TO_DISPLAY = 1 / SPEED_TO_KMS;  // multiply km/s → display speed (~0.447)

// Cosmic velocities (km/s)
const V1 = 7.9;   // first cosmic: circular orbit at surface
const V2 = 11.2;  // second cosmic: escape from Earth
const V3 = 16.7;  // third cosmic: escape from Sun

// ---- State ----
let launchSpeed = 7.9;       // km/s
let altitude = 200;          // km above surface
let rocketFlying = false;
let rocketAngle = 0;         // current angle in orbit
let orbitParams = null;      // { e, h, a, rp, type }
let trailPoints = [];
let viewMode = 'earth';      // 'earth' | 'solar'
let time = 0;
let orbitLine = null;
let rocketGroup = null;
let solarSystemGroup = null;
let rocketTrailLine = null;

// ---- Three.js setup ----
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);
const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.5, 80);
camera.position.set(0, 5, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3;
controls.maxDistance = 30;
controls.zoomSpeed = 0.5;
controls.target.set(0, 0, 0);
controls.update();

// Lighting
scene.add(new THREE.AmbientLight(0x112244, 1.8));
const sunLight = new THREE.DirectionalLight(0xffffff, 2);
sunLight.position.set(10, 5, 10);
scene.add(sunLight);

// Stars
scene.add(createStarfield({ count: 200, radius: 20, radiusRange: 25 }));

// ---- Earth ----
const earthGroup = new THREE.Group();
// Planet surface
const earthGeo = new THREE.SphereGeometry(R_EARTH, 64, 48);
const earthMat = new THREE.MeshStandardMaterial({ color: 0x2266aa, roughness: 0.5, metalness: 0.1 });
const earthMesh = new THREE.Mesh(earthGeo, earthMat);
earthGroup.add(earthMesh);

// Continents hint (green-brown patches)
const landGeo = new THREE.SphereGeometry(R_EARTH + 0.01, 64, 48);
const landCanvas = document.createElement('canvas'); landCanvas.width = 256; landCanvas.height = 128;
const lctx = landCanvas.getContext('2d');
lctx.fillStyle = '#2255aa'; lctx.fillRect(0, 0, 256, 128);
// Simple continent shapes
lctx.fillStyle = '#338844'; lctx.fillRect(40, 30, 60, 25);
lctx.fillRect(120, 20, 40, 35);
lctx.fillRect(160, 50, 30, 20);
lctx.fillRect(50, 60, 35, 28);
lctx.fillRect(140, 70, 50, 20);
lctx.fillStyle = '#888888'; lctx.fillRect(180, 70, 20, 35); // Antarctica
lctx.fillStyle = '#559944'; lctx.fillRect(75, 35, 20, 15);
const landTex = new THREE.CanvasTexture(landCanvas);
const landMat = new THREE.MeshStandardMaterial({ map: landTex, roughness: 0.55, metalness: 0.05, transparent: true, opacity: 0.7 });
earthGroup.add(new THREE.Mesh(landGeo, landMat));

// Atmosphere glow
const atmoGeo = new THREE.SphereGeometry(R_EARTH + 0.15, 64, 48);
const atmoMat = new THREE.MeshBasicMaterial({ color: 0x4488cc, transparent: true, opacity: 0.12, depthWrite: false });
earthGroup.add(new THREE.Mesh(atmoGeo, atmoMat));
const atmo2Geo = new THREE.SphereGeometry(R_EARTH + 0.3, 64, 48);
earthGroup.add(new THREE.Mesh(atmo2Geo, new THREE.MeshBasicMaterial({ color: 0x6699dd, transparent: true, opacity: 0.04, depthWrite: false })));
scene.add(earthGroup);

// ---- Orbital guides (rings) ----
const orbitGuides = new THREE.Group();
const orbits = [
  { alt: 300, label: 'LEO 300km', color: 0x44aaff, speed: 7.7 },
  { alt: 2000, label: 'MEO', color: 0x888888, speed: 6.9 },
  { alt: 35786, label: 'GEO 35786km', color: 0xffaa44, speed: 3.07 },
];
orbits.forEach(o => {
  const r = R_EARTH + o.alt / KM_PER_UNIT;
  const ringGeo = new THREE.TorusGeometry(r, 0.015, 8, 120);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: o.color, transparent: true, opacity: 0.4, depthWrite: false }));
  ring.rotation.x = Math.PI / 2;
  orbitGuides.add(ring);
});
scene.add(orbitGuides);

// ---- Rocket ----
rocketGroup = new THREE.Group();
// Body
const bodyGeo = new THREE.ConeGeometry(0.06, 0.3, 8, 4);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3, metalness: 0.6 });
const body = new THREE.Mesh(bodyGeo, bodyMat); body.rotation.x = Math.PI / 2; body.position.y = 0.15;
rocketGroup.add(body);
// Nose cone
const noseGeo = new THREE.ConeGeometry(0.06, 0.1, 8, 8);
const nose = new THREE.Mesh(noseGeo, new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.3, emissive: 0xff2222, emissiveIntensity: 0.5 }));
nose.rotation.x = Math.PI / 2; nose.position.y = 0.32;
rocketGroup.add(nose);
// Fins
for (let i = 0; i < 3; i++) {
  const finGeo = new THREE.BoxGeometry(0.01, 0.1, 0.08);
  const fin = new THREE.Mesh(finGeo, new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.3, emissive: 0x441111, emissiveIntensity: 0.3 }));
  fin.position.y = -0.05;
  fin.rotation.y = (i / 3) * Math.PI * 2;
  fin.position.x = Math.cos(fin.rotation.y) * 0.06;
  fin.position.z = Math.sin(fin.rotation.y) * 0.06;
  rocketGroup.add(fin);
}
// Flame
const flameGeo = new THREE.ConeGeometry(0.04, 0.2, 8, 8);
const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8844, transparent: true, opacity: 0.8, depthWrite: false });
const flame = new THREE.Mesh(flameGeo, flameMat); flame.rotation.x = -Math.PI / 2; flame.position.y = -0.2;
flame.name = 'flame';
rocketGroup.add(flame);
rocketGroup.position.set(R_EARTH + altitude / KM_PER_UNIT, 0, 0);
rocketGroup.visible = true;
scene.add(rocketGroup);

// ---- Solar system (hidden initially) ----
solarSystemGroup = new THREE.Group();
solarSystemGroup.visible = false;
// Sun
const sunGeo = new THREE.SphereGeometry(0.5, 48, 36);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
solarSystemGroup.add(new THREE.Mesh(sunGeo, sunMat));
const sunGlowGeo = new THREE.SphereGeometry(0.65, 32, 32);
solarSystemGroup.add(new THREE.Mesh(sunGlowGeo, new THREE.MeshBasicMaterial({ color: 0xffaa22, transparent: true, opacity: 0.3, depthWrite: false })));
// Planets
const planets = [
  { name: 'Mercury', r: 0.03, dist: 1.5, color: 0xaaaaaa, period: 0.24 },
  { name: 'Venus', r: 0.06, dist: 2.2, color: 0xddcc88, period: 0.62 },
  { name: 'Earth', r: 0.065, dist: 3.0, color: 0x2266aa, period: 1 },
  { name: 'Mars', r: 0.04, dist: 4.0, color: 0xcc6644, period: 1.88 },
  { name: 'Jupiter', r: 0.2, dist: 6.5, color: 0xddaa77, period: 11.86 },
  { name: 'Saturn', r: 0.17, dist: 8.5, color: 0xddcc88, period: 29.46, ring: true },
  { name: 'Uranus', r: 0.1, dist: 11, color: 0x88ccdd, period: 84 },
  { name: 'Neptune', r: 0.095, dist: 13, color: 0x4466dd, period: 164.8 },
];
planets.forEach(p => {
  const orbitRing = new THREE.Mesh(
    new THREE.TorusGeometry(p.dist, 0.008, 8, 80),
    new THREE.MeshBasicMaterial({ color: 0x333355, transparent: true, opacity: 0.3, depthWrite: false })
  );
  orbitRing.rotation.x = Math.PI / 2;
  solarSystemGroup.add(orbitRing);

  const planetGeo = new THREE.SphereGeometry(p.r, 24, 18);
  const planet = new THREE.Mesh(planetGeo, new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.5 }));
  planet.position.set(p.dist, 0, 0);
  planet.userData = { dist: p.dist, period: p.period, angle: Math.random() * Math.PI * 2 };
  planet.name = p.name;
  solarSystemGroup.add(planet);

  if (p.ring) {
    const ringGeo = new THREE.TorusGeometry(p.r * 1.6, p.r * 0.35, 8, 32);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xccaa66, transparent: true, opacity: 0.5, depthWrite: false }));
    ring.rotation.x = Math.PI * 0.4;
    planet.add(ring);
  }
});
solarSystemGroup.position.set(-3, 2, -5);
solarSystemGroup.scale.setScalar(1.8);
scene.add(solarSystemGroup);

// ---- Compute orbit ----
function computeOrbit(vKms, altKm) {
  const r0 = R_EARTH + altKm / KM_PER_UNIT;
  const vCirc = Math.sqrt(MU / r0);
  const vEsc = Math.sqrt(2) * vCirc;
  const v0 = vKms * SPEED_TO_DISPLAY; // km/s → display units/s
  const h = r0 * v0;
  const energy = v0 * v0 / 2 - MU / r0;
  let e, type, desc;

  if (v0 < vCirc * 0.99) {
    // Suborbital: rocket will crash
    e = 1 - r0 * v0 * v0 / MU; // negative eccentricity for suborbital (periapsis inside Earth)
    type = 'suborbital';
    desc = '亚轨道 · 落回地球';
  } else if (Math.abs(v0 - vCirc) < vCirc * 0.01) {
    e = 0;
    type = 'circular';
    desc = '圆轨道';
  } else if (v0 < vEsc * 0.99) {
    e = r0 * v0 * v0 / MU - 1;
    type = 'elliptical';
    desc = '椭圆轨道';
  } else if (Math.abs(v0 - vEsc) < vEsc * 0.01) {
    e = 1;
    type = 'parabolic';
    desc = '逃逸轨道 · 离开地球';
  } else {
    e = r0 * v0 * v0 / MU - 1;
    type = 'hyperbolic';
    desc = '双曲线轨道 · 高速逃逸';
  }
  return { r0, e, h, type, desc, vCirc: vCirc * SPEED_TO_KMS, vEsc: vEsc * SPEED_TO_KMS };
}

// ---- Build orbit path line ----
function buildOrbitLine(params) {
  if (orbitLine) { scene.remove(orbitLine); orbitLine.geometry.dispose(); }
  const pts = [];
  const { r0, e, h } = params;

  // Determine theta range for orbit line
  let thetaMax;
  if (params.type === 'suborbital') {
    // For suborbital: only show arc above Earth surface
    // r(θ) = h²/(μ(1+e*cosθ)) = R_EARTH → cosθ = (h²/(μ*R_EARTH) - 1) / e
    const cosSurface = (h * h / (MU * R_EARTH) - 1) / e;
    thetaMax = (cosSurface >= -1 && cosSurface <= 1)
      ? Math.acos(Math.max(-1, Math.min(1, cosSurface)))
      : Math.PI;
  } else if (e >= 1) {
    const acosArg = Math.max(-1, Math.min(1, -1 / e));
    thetaMax = Math.acos(acosArg) - 0.05;
  } else {
    thetaMax = Math.PI * 2;
  }
  if (isNaN(thetaMax)) return;
  const nPts = 200;
  for (let i = 0; i <= nPts; i++) {
    const theta = -thetaMax + (i / nPts) * thetaMax * 2;
    const denom = MU * (1 + e * Math.cos(theta));
    if (Math.abs(denom) < 0.001) continue; // avoid division by near-zero
    const r = h * h / denom;
    if (isNaN(r) || !isFinite(r)) continue;
    if (r > 0 && r < 25 && r >= R_EARTH) {
      const x = r * Math.cos(theta), z = r * Math.sin(theta);
      if (isNaN(x) || isNaN(z)) continue;
      pts.push(new THREE.Vector3(x, 0, z));
    }
  }

  if (pts.length < 2) return;

  // Color by type
  const colors = { suborbital: 0xff4444, circular: 0x44ff88, elliptical: 0xffcc44, parabolic: 0x44aaff, hyperbolic: 0xaa44ff };
  const color = colors[params.type] || 0xffffff;
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 1, transparent: true, opacity: 0.7, depthWrite: false });
  orbitLine = new THREE.Line(geo, mat);
  scene.add(orbitLine);
}

// ---- Update rocket position along orbit ----
function updateRocketPosition(params, theta) {
  const { r0, e, h } = params;
  const denom = MU * (1 + e * Math.cos(theta));
  if (Math.abs(denom) < 0.0001) return false;
  const r = h * h / denom;
  if (isNaN(r) || !isFinite(r)) return false;
  if (r < R_EARTH * 0.95) return false; // crashed
  rocketGroup.position.set(r * Math.cos(theta), 0, r * Math.sin(theta));
  rocketGroup.rotation.z = -theta - Math.PI / 2;
  rocketGroup.rotation.y = 0;
  // Flame visible when flying
  const flameMesh = rocketGroup.getObjectByName('flame');
  if (flameMesh) flameMesh.visible = rocketFlying;
  return true;
}

// ---- Launch ----
function launch() {
  // Clean up previous explosion
  explosionGroup.visible = false;
  explosionGroup.clear();
  explosionParticles = [];
  // Reset HUD crash message
  document.getElementById('hud-type').style.color = '';
  rocketGroup.visible = true;

  orbitParams = computeOrbit(launchSpeed, altitude);
  // Suborbital: rocket starts at apogee (highest point), θ=π
  // All other orbits: rocket starts at perigee, θ=0
  rocketAngle = orbitParams.type === 'suborbital' ? Math.PI : 0;
  rocketFlying = true;
  trailPoints = [];
  if (rocketTrailLine) { scene.remove(rocketTrailLine); rocketTrailLine = null; }
  buildOrbitLine(orbitParams);
  updateRocketPosition(orbitParams, 0);
  document.getElementById('launch-btn').textContent = '🔄 重置';
  document.getElementById('launch-btn').classList.add('reset-mode');
}

function resetRocket() {
  rocketFlying = false;
  rocketAngle = 0;
  rocketGroup.position.set(R_EARTH + altitude / KM_PER_UNIT, 0, 0);
  rocketGroup.rotation.set(0, 0, -Math.PI / 2);
  if (orbitLine) { scene.remove(orbitLine); orbitLine.geometry.dispose(); orbitLine = null; }
  if (rocketTrailLine) { scene.remove(rocketTrailLine); rocketTrailLine = null; }
  trailPoints = [];
  document.getElementById('launch-btn').textContent = '🚀 发射';
  document.getElementById('launch-btn').classList.remove('reset-mode');
}

document.getElementById('launch-btn').addEventListener('click', () => {
  if (rocketFlying) resetRocket();
  else launch();
});

// ---- UI ----
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
const speedLabel = document.getElementById('speed-label');
const presetBtns = document.querySelectorAll('.preset-btn');

function updateSpeedDisplay() {
  speedVal.textContent = launchSpeed.toFixed(1);
  speedLabel.textContent = 'km/s';
  speedSlider.value = launchSpeed;

  // Highlight active preset
  presetBtns.forEach(b => {
    const v = parseFloat(b.dataset.speed);
    b.classList.toggle('active', Math.abs(launchSpeed - v) < 0.2);
  });

  // Update marker highlights
  document.querySelectorAll('.marker').forEach(m => {
    const v = parseFloat(m.dataset.speed);
    m.classList.toggle('active', Math.abs(launchSpeed - v) < 0.3);
  });

  // Preview orbit when not flying
  if (!rocketFlying) {
    const params = computeOrbit(launchSpeed, altitude);
    buildOrbitLine(params);
    rocketGroup.position.set(R_EARTH + altitude / KM_PER_UNIT, 0, 0);
    rocketGroup.rotation.set(0, 0, -Math.PI / 2);
  }
}

speedSlider.addEventListener('input', () => {
  launchSpeed = parseFloat(speedSlider.value);
  updateSpeedDisplay();
});

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    launchSpeed = parseFloat(btn.dataset.speed);
    updateSpeedDisplay();
  });
});

// Altitude slider
const altSlider = document.getElementById('alt-slider');
const altVal = document.getElementById('alt-val');
altSlider.addEventListener('input', () => {
  altitude = parseInt(altSlider.value);
  altVal.textContent = altitude + ' km';
  if (!rocketFlying) {
    rocketGroup.position.set(R_EARTH + altitude / KM_PER_UNIT, 0, 0);
    updateSpeedDisplay();
  }
});

// View toggle
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    viewMode = btn.dataset.view;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === viewMode));
    if (viewMode === 'solar') {
      solarSystemGroup.visible = true;
      earthGroup.visible = false;
      orbitGuides.visible = false;
      if (orbitLine) orbitLine.visible = false;
      rocketGroup.visible = false;
      controls.target.set(-3, 2, -5);
      camera.position.set(-3, 5, 2);
      controls.update();
    } else {
      solarSystemGroup.visible = false;
      earthGroup.visible = true;
      orbitGuides.visible = true;
      if (orbitLine) orbitLine.visible = true;
      rocketGroup.visible = true;
      controls.target.set(0, 0, 0);
    }
  });
});

// ---- Explosion effect ----
let explosionParticles = [];
const explosionGroup = new THREE.Group();
explosionGroup.visible = false;
scene.add(explosionGroup);

function spawnExplosion(pos) {
  // Create burst of 40 particles
  explosionGroup.position.copy(pos);
  explosionGroup.visible = true;
  explosionGroup.children.forEach(c => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) c.material.dispose();
  });
  explosionGroup.clear();
  explosionParticles = [];

  for (let i = 0; i < 40; i++) {
    const geo = new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.08 + Math.random() * 0.12, 1, 0.4 + Math.random() * 0.6),
      transparent: true, opacity: 1, depthWrite: false,
    });
    const particle = new THREE.Mesh(geo, mat);
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize();
    particle.userData = { vel: dir.multiplyScalar(0.5 + Math.random() * 2), life: 0.8 + Math.random() * 0.8 };
    explosionGroup.add(particle);
    explosionParticles.push(particle);
  }

  // Flash
  const flashGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xff8844, transparent: true, opacity: 0.9, depthWrite: false });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.userData = { life: 0.3, isFlash: true };
  explosionGroup.add(flash);
  explosionParticles.push(flash);

  // Camera shake
  const origPos = camera.position.clone();
  const shakeStart = performance.now();
  function shake(now) {
    const elapsed = (now - shakeStart) / 1000;
    if (elapsed > 0.4) { camera.position.copy(origPos); return; }
    const intensity = (1 - elapsed / 0.4) * 0.2;
    camera.position.x = origPos.x + (Math.random() - 0.5) * intensity;
    camera.position.y = origPos.y + (Math.random() - 0.5) * intensity;
    camera.position.z = origPos.z + (Math.random() - 0.5) * intensity * 0.5;
    requestAnimationFrame(shake);
  }
  requestAnimationFrame(shake);

  // HUD crash message
  document.getElementById('hud-type').textContent = '💥 坠毁！速度不足以入轨';
  document.getElementById('hud-type').style.color = '#ff4444';
}

// ---- Animation ----
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - (animate.lastTime || now)) / 1000, 0.05);
  animate.lastTime = now;

  if (rocketFlying && orbitParams) {
    const { r0, e, h } = orbitParams;
    // Angular velocity from conservation of angular momentum
    const r = rocketGroup.position.length();
    const omega = h / (r * r);
    rocketAngle += omega * dt * 1.5; // speed up for visual appeal

    const alive = updateRocketPosition(orbitParams, rocketAngle);
    if (!alive) {
      // Rocket crashed — spawn explosion
      const crashPos = rocketGroup.position.clone();
      rocketFlying = false;
      spawnExplosion(crashPos);
      rocketGroup.visible = false;
      document.getElementById('launch-btn').textContent = '🚀 发射';
      document.getElementById('launch-btn').classList.remove('reset-mode');
    }

    // Update trail
    trailPoints.push(rocketGroup.position.clone());
    if (trailPoints.length > 80) trailPoints.shift();
    if (rocketTrailLine) { scene.remove(rocketTrailLine); rocketTrailLine.geometry.dispose(); }
    if (trailPoints.length > 1) {
      const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPoints);
      rocketTrailLine = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.5, depthWrite: false }));
      scene.add(rocketTrailLine);
    }

    // Update HUD
    const actualSpeed = omega * r * SPEED_TO_KMS; // display → km/s
    const altNow = (r - R_EARTH) * KM_PER_UNIT;
    document.getElementById('hud-speed').textContent = actualSpeed.toFixed(1) + ' km/s';
    document.getElementById('hud-alt').textContent = Math.max(0, Math.round(altNow)) + ' km';
    document.getElementById('hud-type').textContent = orbitParams.desc;
  }

  // Animate solar system planets
  if (viewMode === 'solar') {
    solarSystemGroup.children.forEach(child => {
      if (child.userData?.period) {
        child.userData.angle += dt * 0.3 / child.userData.period;
        child.position.x = child.userData.dist * Math.cos(child.userData.angle);
        child.position.z = child.userData.dist * Math.sin(child.userData.angle);
      }
    });
  }

  // Animate explosion particles
  if (explosionGroup.visible) {
    let allDead = true;
    explosionParticles.forEach(p => {
      p.userData.life -= dt;
      if (p.userData.life <= 0) { p.visible = false; return; }
      allDead = false;
      p.material.opacity = Math.max(0, p.userData.life / (p.userData.isFlash ? 0.3 : 1.6));
      if (!p.userData.isFlash && p.userData.vel) {
        p.position.add(p.userData.vel.clone().multiplyScalar(dt));
        p.userData.vel.multiplyScalar(0.96); // drag
      }
      if (p.userData.isFlash) p.scale.setScalar(1 + (0.3 - p.userData.life) * 5);
    });
    if (allDead) {
      explosionGroup.visible = false;
      explosionGroup.clear();
      explosionParticles = [];
    }
  }

  // Flame flicker
  const flameMesh = rocketGroup.getObjectByName('flame');
  if (flameMesh && rocketFlying) {
    flameMesh.scale.setScalar(0.7 + Math.random() * 0.6);
  }

  controls.update();
  renderer.render(scene, camera);
}
animate.lastTime = performance.now();

// ---- Resize ----
setupResizeHandler(renderer, camera, container);

// ---- Init ----
updateSpeedDisplay();
requestAnimationFrame(animate);
hideLoading();

// Theme toggle
setupThemeToggle({
  scene, fogNear: 15, fogFar: 40,
  onThemeChange: (light) => {
    earthMat.color.set(light ? 0x5588cc : 0x2266aa);
  },
});
