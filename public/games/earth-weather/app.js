/* Earth Weather — 3D Climate & Front Systems Demo */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---- Scene ----
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);
const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.5, 50);
camera.position.set(0, 2, 7);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.autoRotate = true; controls.autoRotateSpeed = 0.3;
controls.minDistance = 3.5; controls.maxDistance = 14;
controls.update();

// Lights
scene.add(new THREE.AmbientLight(0x223355, 1.8));
const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

// Stars
const starsGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(600);
for (let i = 0; i < 200; i++) {
  const r = 12 + Math.random() * 15;
  const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
  starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
  starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
  starPos[i * 3 + 2] = r * Math.cos(ph);
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ size: 0.03, color: 0x8899cc, transparent: true, opacity: 0.6, depthWrite: false })));

// ---- Earth globe ----
const R = 2;
const earthGroup = new THREE.Group();
scene.add(earthGroup);

// Ocean base
const oceanGeo = new THREE.SphereGeometry(R, 72, 54);
const oceanMat = new THREE.MeshStandardMaterial({ color: 0x1a4488, roughness: 0.35, metalness: 0.05 });
earthGroup.add(new THREE.Mesh(oceanGeo, oceanMat));

// Continents (simplified procedural patches)
const landGroup = new THREE.Group();
function addLandPatch(lat, lon, w, h, color = 0x338844) {
  // Create a small curved patch on the sphere
  const patchGeo = new THREE.PlaneGeometry(w, h, 4, 4);
  const patch = new THREE.Mesh(patchGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.02 }));
  const phi = (90 - lat) * Math.PI / 180;
  const theta = lon * Math.PI / 180;
  patch.position.set(
    (R + 0.02) * Math.sin(phi) * Math.cos(theta),
    (R + 0.02) * Math.cos(phi),
    -(R + 0.02) * Math.sin(phi) * Math.sin(theta)
  );
  patch.lookAt(new THREE.Vector3(0, 0, 0));
  landGroup.add(patch);
}
// Rough continent shapes (lat, lon, w, h)
const continents = [
  // North America
  [55,-100,1.8,1.2],[45,-95,1.2,1.0],[35,-105,0.8,0.7],[60,-130,0.8,0.6],
  // South America
  [-5,-65,0.7,1.2],[-15,-60,0.5,0.8],[-25,-55,0.3,0.5],
  // Europe
  [52,10,0.9,0.7],[55,40,0.6,0.5],[45,5,0.4,0.5],[60,60,0.5,0.4],
  // Africa
  [10,25,0.9,1.2],[0,30,0.7,1.0],[-15,25,0.5,0.8],[25,30,0.7,0.5],
  // Asia
  [55,80,1.5,1.2],[45,100,1.0,0.9],[35,110,0.8,0.7],[60,110,0.6,0.8],[30,75,0.6,0.7],
  // Southeast Asia + islands
  [5,105,0.4,0.5],[0,115,0.3,0.4],[-5,120,0.3,0.3],
  // Australia
  [-25,135,0.6,0.7],[-30,145,0.3,0.5],
  // Antarctica
  [-85,0,1.5,2.5],
  // Greenland
  [70,-40,0.3,0.4],
  // India
  [22,78,0.3,0.5],
  // Japan
  [36,138,0.1,0.25],
  // Central America
  [15,-85,0.15,0.3],
];
continents.forEach(c => addLandPatch(...c));
// Desert patches
[[25,15,0.4,0.3,0xaa9944],[25,45,0.3,0.3,0x998833],[-20,25,0.2,0.3,0x996633],
 [30,-110,0.3,0.2,0x998844],[-25,135,0.3,0.3,0xbb9944]].forEach(c => addLandPatch(...c));
earthGroup.add(landGroup);

// Atmosphere glow
const atmoGeo = new THREE.SphereGeometry(R + 0.2, 64, 48);
earthGroup.add(new THREE.Mesh(atmoGeo, new THREE.MeshBasicMaterial({ color: 0x4488cc, transparent: true, opacity: 0.08, depthWrite: false })));

// ---- Helpers ----
function latLonTo3D(lat, lon, radius = R + 0.05) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = lon * Math.PI / 180;
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    -radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ---- Ocean currents ----
const currentsGroup = new THREE.Group();
earthGroup.add(currentsGroup);
const currentParticles = [];

// Define major currents as [lat, lon] paths
const currentPaths = {
  'Gulf Stream': { pts: [[25,-80],[30,-78],[35,-74],[40,-67],[45,-55],[50,-40],[55,-20],[60,-5]], color: 0xff6644, warm: true },
  'Kuroshio':      { pts: [[15,125],[22,130],[28,135],[33,140],[38,145],[42,148],[45,150]], color: 0xff5533, warm: true },
  'Brazil':        { pts: [[0,-35],[-5,-37],[-15,-40],[-25,-45],[-30,-48]], color: 0xff6644, warm: true },
  'Agulhas':       { pts: [[-25,35],[-28,33],[-32,28],[-34,22],[-34,18]], color: 0xff6644, warm: true },
  'E.Australian':  { pts: [[-15,148],[-20,150],[-27,153],[-33,153],[-37,150]], color: 0xff5533, warm: true },
  'Antarctic Circumpolar': { pts: [[-55,-70],[-55,-30],[-55,10],[-55,50],[-55,90],[-55,130],[-55,170]], color: 0x44aacc, warm: false },
  'California':    { pts: [[48,-128],[42,-125],[35,-121],[28,-118]], color: 0x3388bb, warm: false },
  'Peru/Humboldt': { pts: [[-10,-82],[-15,-78],[-22,-74],[-30,-72]], color: 0x3388bb, warm: false },
  'Benguela':      { pts: [[-28,15],[-25,13],[-20,11],[-15,9]], color: 0x3388bb, warm: false },
  'Canary':        { pts: [[33,-14],[28,-16],[23,-18],[18,-19]], color: 0x3388bb, warm: false },
};

function buildCurrents() {
  while (currentsGroup.children.length > 0) currentsGroup.remove(currentsGroup.children[0]);
  currentParticles.length = 0;

  for (const [name, cfg] of Object.entries(currentPaths)) {
    const pts3D = cfg.pts.map(p => latLonTo3D(p[0], p[1]));

    // Draw flow line
    if (pts3D.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(pts3D);
      const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.025, 8, false);
      const tube = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.7, depthWrite: false }));
      tube.name = name;
      currentsGroup.add(tube);

      // Add arrows along the path
      for (let t = 0.05; t < 1; t += 0.18) {
        const pt = curve.getPointAt(t);
        const tg = curve.getTangentAt(t).normalize();
        const arrowGeo = new THREE.ConeGeometry(0.06, 0.15, 6, 6);
        const arrow = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: cfg.color }));
        arrow.position.copy(pt);
        arrow.lookAt(pt.clone().add(tg));
        arrow.rotateX(Math.PI / 2);
        currentsGroup.add(arrow);
      }

      // Create particles for animation
      for (let i = 0; i < 12; i++) {
        currentParticles.push({
          curve, t: Math.random(), speed: 0.08 + Math.random() * 0.12,
          mesh: null, color: cfg.color,
        });
      }
    }
  }

  // Create particle meshes
  currentParticles.forEach(p => {
    const dotGeo = new THREE.SphereGeometry(0.04, 6, 6);
    p.mesh = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: p.color, depthWrite: false }));
    currentsGroup.add(p.mesh);
  });
}

// ---- Wind circulation ----
const windGroup = new THREE.Group();
earthGroup.add(windGroup);
const windParticles = [];

// Define circulation cells as curved arrows on the globe
function buildWinds() {
  while (windGroup.children.length > 0) windGroup.remove(windGroup.children[0]);
  windParticles.length = 0;

  // Trade winds (easterlies) — surface winds toward equator
  const tradeWindLons = [-120, -60, 0, 60, 120, 180];
  tradeWindLons.forEach(lon => {
    // NE trades (northern hemisphere)
    const nePts = [latLonTo3D(25, lon, R + 0.1), latLonTo3D(15, lon + 15, R + 0.1), latLonTo3D(5, lon + 30, R + 0.1)];
    const neCurve = new THREE.CatmullRomCurve3(nePts);
    const neTube = new THREE.Mesh(new THREE.TubeGeometry(neCurve, 16, 0.02, 6, false),
      new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.5, depthWrite: false }));
    windGroup.add(neTube);
    // SE trades (southern hemisphere)
    const sePts = [latLonTo3D(-25, lon, R + 0.1), latLonTo3D(-15, lon + 15, R + 0.1), latLonTo3D(-5, lon + 30, R + 0.1)];
    const seCurve = new THREE.CatmullRomCurve3(sePts);
    windGroup.add(new THREE.Mesh(new THREE.TubeGeometry(seCurve, 16, 0.02, 6, false),
      new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.5, depthWrite: false })));

    // Create wind particles for these paths
    for (let i = 0; i < 6; i++) {
      windParticles.push({ curve: neCurve, t: Math.random(), speed: 0.1 + Math.random() * 0.15, mesh: null, color: 0xffaa44 });
      windParticles.push({ curve: seCurve, t: Math.random(), speed: 0.1 + Math.random() * 0.15, mesh: null, color: 0xffcc66 });
    }
  });

  // Westerlies (mid-latitudes, blowing east)
  [30, 45, -30, -45].forEach(lat => {
    const lon0 = -160 + Math.random() * 20;
    const wPts = [];
    for (let i = 0; i < 6; i++) wPts.push(latLonTo3D(lat, lon0 + i * 40, R + 0.1));
    const wCurve = new THREE.CatmullRomCurve3(wPts);
    windGroup.add(new THREE.Mesh(new THREE.TubeGeometry(wCurve, 24, 0.018, 6, false),
      new THREE.MeshBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.5, depthWrite: false })));
    for (let i = 0; i < 8; i++) {
      windParticles.push({ curve: wCurve, t: Math.random(), speed: 0.06 + Math.random() * 0.1, mesh: null, color: 0x88aacc });
    }
  });

  // Create wind particle meshes
  windParticles.forEach(p => {
    const dotGeo = new THREE.SphereGeometry(0.03, 4, 4);
    p.mesh = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: p.color, depthWrite: false }));
    windGroup.add(p.mesh);
  });
}

// ---- Front system & Rain ----
const frontGroup = new THREE.Group();
scene.add(frontGroup);
const rainGroup = new THREE.Group();
scene.add(rainGroup);
const rainDrops = [];

function buildFrontSystem() {
  while (frontGroup.children.length > 0) frontGroup.remove(frontGroup.children[0]);
  while (rainGroup.children.length > 0) rainGroup.remove(rainGroup.children[0]);
  rainDrops.length = 0;

  // Position the front system over the North Atlantic (~45°N, -40°W)
  const center = latLonTo3D(45, -40, R + 0.15);

  // Cold front (blue, west side) — dense cold air mass
  const coldGeo = new THREE.SphereGeometry(0.4, 32, 24);
  const coldMesh = new THREE.Mesh(coldGeo, new THREE.MeshBasicMaterial({ color: 0x4488dd, transparent: true, opacity: 0.35, depthWrite: false }));
  coldMesh.position.copy(center).add(new THREE.Vector3(-0.3, 0.15, 0));
  coldMesh.scale.set(1.3, 0.6, 0.8);
  coldMesh.name = 'cold-front';
  frontGroup.add(coldMesh);

  // Cold front label arrow (blue triangles pointing direction of movement)
  const coldArrowGeo = new THREE.ConeGeometry(0.15, 0.35, 4, 4);
  const coldArrow = new THREE.Mesh(coldArrowGeo, new THREE.MeshBasicMaterial({ color: 0x3388ff }));
  coldArrow.position.copy(center).add(new THREE.Vector3(-0.5, 0.35, 0));
  coldArrow.rotation.z = -Math.PI / 2;
  frontGroup.add(coldArrow);

  // Warm front (red, east side) — warm moist air mass
  const warmGeo = new THREE.SphereGeometry(0.4, 32, 24);
  const warmMesh = new THREE.Mesh(warmGeo, new THREE.MeshBasicMaterial({ color: 0xdd4433, transparent: true, opacity: 0.35, depthWrite: false }));
  warmMesh.position.copy(center).add(new THREE.Vector3(0.3, 0.05, 0));
  warmMesh.scale.set(1.2, 0.55, 0.8);
  warmMesh.name = 'warm-front';
  frontGroup.add(warmMesh);

  // Warm front label (red semi-circles)
  const warmArcGeo = new THREE.TorusGeometry(0.12, 0.03, 6, 8, Math.PI);
  const warmArc = new THREE.Mesh(warmArcGeo, new THREE.MeshBasicMaterial({ color: 0xff4422 }));
  warmArc.position.copy(center).add(new THREE.Vector3(0.5, 0.3, 0));
  frontGroup.add(warmArc);

  // Convergence zone — where they meet = rain
  const rainZoneGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.8, 16, 8);
  const rainZone = new THREE.Mesh(rainZoneGeo, new THREE.MeshBasicMaterial({ color: 0x889999, transparent: true, opacity: 0.25, depthWrite: false }));
  rainZone.position.copy(center).add(new THREE.Vector3(0, -0.1, 0));
  frontGroup.add(rainZone);

  // Rain particles in the convergence zone
  for (let i = 0; i < 200; i++) {
    const dropGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 4, 4);
    const drop = new THREE.Mesh(dropGeo, new THREE.MeshBasicMaterial({ color: 0x88bbee, transparent: true, opacity: 0.7, depthWrite: false }));
    const angle = Math.random() * Math.PI * 2;
    const rad = Math.random() * 0.35;
    drop.position.copy(center).add(new THREE.Vector3(Math.cos(angle) * rad, 0.2 + Math.random() * 0.5, Math.sin(angle) * rad));
    rainGroup.add(drop);
    rainDrops.push({ mesh: drop, baseY: drop.position.y, speed: 1.5 + Math.random() * 3, cx: center.x, cz: center.z, rad, angle });
  }

  document.getElementById('front-label').innerHTML =
    '<span style="color:#4488dd">● 冷锋</span>  ↘  <span style="color:#889999">雨区</span>  ↙  <span style="color:#dd4433">● 暖锋</span>';
}

// ---- Layer visibility ----
const layers = {
  currents: true,
  winds: true,
  fronts: true,
};

function updateLayers() {
  currentsGroup.visible = layers.currents;
  windGroup.visible = layers.winds;
  frontGroup.visible = layers.fronts;
  rainGroup.visible = layers.fronts;
  document.getElementById('front-label').style.opacity = layers.fronts ? '1' : '0';
}

document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const layer = btn.dataset.layer;
    layers[layer] = !layers[layer];
    btn.classList.toggle('on', layers[layer]);
    updateLayers();
  });
});

// ---- Season toggle ----
let season = 'summer';
document.querySelectorAll('.season-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    season = btn.dataset.season;
    document.querySelectorAll('.season-btn').forEach(b => b.classList.toggle('active', b.dataset.season === season));
    document.getElementById('info').textContent =
      season === 'summer' ? '☀️ 夏季：南亚季风从海洋吹向大陆（暖湿）· 热带辐合带北移' :
      '❄️ 冬季：南亚季风从大陆吹向海洋（干冷）· 热带辐合带南移';
    document.getElementById('info').classList.add('show');
    setTimeout(() => document.getElementById('info').classList.remove('show'), 3000);
  });
});

// ---- Animate particles along curves ----
function animateParticles(particles, dt) {
  particles.forEach(p => {
    p.t += p.speed * dt;
    if (p.t > 1) p.t -= 1;
    const pt = p.curve.getPointAt(Math.max(0, Math.min(1, p.t)));
    p.mesh.position.copy(pt);
  });
}

// ---- Animate rain ----
function animateRain(dt) {
  rainDrops.forEach(d => {
    d.mesh.position.y -= d.speed * dt;
    if (d.mesh.position.y < d.baseY - 0.7) {
      d.mesh.position.y = d.baseY;
      d.angle += 0.3;
      d.mesh.position.x = d.cx + Math.cos(d.angle) * d.rad;
      d.mesh.position.z = d.cz + Math.sin(d.angle) * d.rad;
    }
    d.mesh.material.opacity = 0.3 + 0.7 * (1 - (d.baseY - d.mesh.position.y) / 0.7);
  });
}

// ---- Front animation (subtle movement) ----
let frontPhase = 0;
function animateFronts(dt) {
  if (!layers.fronts) return;
  frontPhase += dt * 0.3;
  const coldMesh = frontGroup.getObjectByName('cold-front');
  const warmMesh = frontGroup.getObjectByName('warm-front');
  if (coldMesh) coldMesh.position.x += Math.sin(frontPhase) * 0.003;
  if (warmMesh) warmMesh.position.x -= Math.sin(frontPhase) * 0.003;
}

// ---- Resize ----
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// ---- Init ----
buildCurrents();
buildWinds();
buildFrontSystem();
updateLayers();

// ---- Animation loop ----
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - (animate.lastTime || now)) / 1000, 0.06);
  animate.lastTime = now;

  animateParticles(currentParticles, dt);
  animateParticles(windParticles, dt);
  animateRain(dt);
  animateFronts(dt);

  controls.update();
  renderer.render(scene, camera);
}
animate.lastTime = performance.now();
requestAnimationFrame(animate);
