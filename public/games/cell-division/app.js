/* Cell Division — 3D Mitosis Animation */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---- State ----
let progress = 0;        // 0-1 across all phases
let playing = false;
let playSpeed = 0.6;
let phaseNames = ['interphase', 'prophase', 'metaphase', 'anaphase', 'telophase', 'cytokinesis'];

// ---- Scene ----
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a14);
scene.fog = new THREE.Fog(0x0a0a14, 12, 35);

const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.3, 40);
camera.position.set(4, 3.5, 7);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.autoRotate = true; controls.autoRotateSpeed = 0.4;
controls.minDistance = 3; controls.maxDistance = 18;
controls.target.set(0, 0, 0);
controls.update();

// Lighting
scene.add(new THREE.AmbientLight(0x334466, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 1.5);
key.position.set(5, 8, 5); scene.add(key);
scene.add(new THREE.DirectionalLight(0x8899cc, 0.5).position.set(-3, 0, -3));

// ---- Cell membrane (outer sphere) ----
const membraneGeo = new THREE.SphereGeometry(2.2, 64, 48);
const membraneMat = new THREE.MeshPhysicalMaterial({
  color: 0xddaa88, roughness: 0.2, metalness: 0, transparent: true,
  opacity: 0.18, depthWrite: false, clearcoat: 0.1,
});
const membrane = new THREE.Mesh(membraneGeo, membraneMat);
scene.add(membrane);

// ---- Cleavage furrow ring (hidden until cytokinesis) ----
const furrowGroup = new THREE.Group();
const furrowGeo = new THREE.TorusGeometry(2.2, 0.06, 16, 80);
const furrowMat = new THREE.MeshStandardMaterial({
  color: 0xff6644, roughness: 0.3, emissive: 0xff4422, emissiveIntensity: 0.4,
});
const furrow = new THREE.Mesh(furrowGeo, furrowMat);
furrow.rotation.x = Math.PI / 2;
furrow.visible = false;
furrowGroup.add(furrow);
scene.add(furrowGroup);

// ---- Nuclear envelope ----
const nucleusGroup = new THREE.Group();
const nucEnvGeo = new THREE.SphereGeometry(1.1, 48, 36);
const nucEnvMat = new THREE.MeshPhysicalMaterial({
  color: 0x8899cc, roughness: 0.15, metalness: 0, transparent: true,
  opacity: 0.25, depthWrite: false,
});
const nucEnv = new THREE.Mesh(nucEnvGeo, nucEnvMat);
nucleusGroup.add(nucEnv);

// Nucleolus
const nucleolusGeo = new THREE.SphereGeometry(0.3, 32, 24);
const nucleolusMat = new THREE.MeshStandardMaterial({
  color: 0x445588, roughness: 0.2, emissive: 0x334466, emissiveIntensity: 0.4,
});
nucleusGroup.add(new THREE.Mesh(nucleolusGeo, nucleolusMat));
scene.add(nucleusGroup);

// ---- Centrosomes (2 poles) ----
const centrosomes = [];
[-1, 1].forEach(sign => {
  const group = new THREE.Group();
  const bodyGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffaa44, roughness: 0.2, emissive: 0xff8844, emissiveIntensity: 0.5,
  });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));
  // Aster rays
  for (let i = 0; i < 8; i++) {
    const phi = Math.random() * Math.PI * 0.6;
    const theta = Math.random() * Math.PI * 2;
    const rayGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4);
    const ray = new THREE.Mesh(rayGeo, new THREE.MeshBasicMaterial({
      color: 0xffcc66, transparent: true, opacity: 0.4, depthWrite: false,
    }));
    ray.position.set(
      Math.sin(phi) * Math.cos(theta) * 0.15,
      Math.sin(phi) * Math.sin(theta) * 0.15,
      Math.cos(phi) * 0.15
    );
    ray.lookAt(new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * 0.5,
      Math.sin(phi) * Math.sin(theta) * 0.5,
      Math.cos(phi) * 0.5
    ));
    group.add(ray);
  }
  group.position.set(0, sign * 1.8, 0);
  group.name = `centrosome-${sign}`;
  scene.add(group);
  centrosomes.push(group);
});

// ---- Chromosomes (4 pairs = 8 chromatid pairs, each X-shaped) ----
const chromosomes = [];
function makeChromosome(color) {
  const group = new THREE.Group();
  const armLen = 0.55;
  const armRadius = 0.05;

  // Create X shape: two arms crossing at centromere
  [{ rotZ: 0.35, rotY: 0 }, { rotZ: -0.35, rotY: Math.PI }].forEach(({ rotZ, rotY }, idx) => {
    const armGroup = new THREE.Group();
    // Upper arm
    const upperGeo = new THREE.CylinderGeometry(armRadius, armRadius * 0.7, armLen, 8);
    const upper = new THREE.Mesh(upperGeo, new THREE.MeshStandardMaterial({
      color, roughness: 0.3, metalness: 0.1, emissive: color, emissiveIntensity: 0.15,
    }));
    upper.position.y = armLen / 2;
    armGroup.add(upper);
    // Lower arm (mirror)
    const lower = new THREE.Mesh(upperGeo, upper.material);
    lower.position.y = -armLen / 2;
    armGroup.add(lower);
    // Centromere dot
    const dotGeo = new THREE.SphereGeometry(armRadius * 1.3, 8, 8);
    armGroup.add(new THREE.Mesh(dotGeo, new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.3,
    })));

    armGroup.rotation.z = rotZ;
    armGroup.rotation.y = rotY;
    armGroup.name = `chromatid-${idx}`;
    group.add(armGroup);
  });

  return group;
}

const chrColors = [0xcc4444, 0x4488cc, 0x44aa55, 0xcc8844, 0x9944cc, 0x44aaaa, 0xcc6699, 0x88aa44];
for (let i = 0; i < 8; i++) {
  const chr = makeChromosome(chrColors[i]);
  // Random initial position within nucleus
  const phi = Math.acos(2 * Math.random() - 1);
  const theta = Math.random() * Math.PI * 2;
  const r = Math.random() * 0.6;
  chr.position.set(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
  chr.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  chr.userData = {
    color: chrColors[i],
    homePos: chr.position.clone(),
    scatterPos: chr.position.clone(),
    equatorTarget: new THREE.Vector3((Math.random() - 0.5) * 1.2, 0, (Math.random() - 0.5) * 1.2),
    poleSign: i < 4 ? 1 : -1,
    angle: Math.random() * Math.PI * 2,
    radius: 0.3 + Math.random() * 0.4,
  };
  scene.add(chr);
  chromosomes.push(chr);
}

// ---- Spindle fibers (drawn dynamically each frame) ----
const spindleGroup = new THREE.Group();
scene.add(spindleGroup);

function updateSpindles() {
  while (spindleGroup.children.length > 0) {
    const c = spindleGroup.children[0];
    if (c.geometry) c.geometry.dispose();
    if (c.material) c.material.dispose();
    spindleGroup.remove(c);
  }
  // Only visible during metaphase→anaphase
  const spindleAlpha = progress < 0.2 ? 0 : progress < 0.35 ? (progress - 0.2) / 0.15 : progress < 0.8 ? 1 : (0.9 - progress) / 0.1;
  if (spindleAlpha <= 0) return;

  centrosomes.forEach(cs => {
    const polePos = cs.position.clone();
    chromosomes.forEach(chr => {
      const chrPos = chr.position.clone();
      const mid = new THREE.Vector3().addVectors(polePos, chrPos).multiplyScalar(0.5);
      const dir = new THREE.Vector3().subVectors(chrPos, polePos);
      const len = dir.length();
      const geo = new THREE.CylinderGeometry(0.012, 0.012, len, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x88aacc, transparent: true, opacity: spindleAlpha * 0.3, depthWrite: false,
      });
      const fiber = new THREE.Mesh(geo, mat);
      fiber.position.copy(mid);
      fiber.lookAt(chrPos);
      fiber.rotateX(Math.PI / 2);
      spindleGroup.add(fiber);
    });
  });
}

// ---- Progress → phase mapping ----
function getPhase(p) {
  if (p < 0.15) return { name: 'interphase', local: p / 0.15 };
  if (p < 0.35) return { name: 'prophase', local: (p - 0.15) / 0.2 };
  if (p < 0.55) return { name: 'metaphase', local: (p - 0.35) / 0.2 };
  if (p < 0.75) return { name: 'anaphase', local: (p - 0.55) / 0.2 };
  if (p < 0.90) return { name: 'telophase', local: (p - 0.75) / 0.15 };
  return { name: 'cytokinesis', local: (p - 0.90) / 0.1 };
}

function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

// ---- Update scene for current progress ----
function updateScene() {
  const phase = getPhase(progress);
  const t = ease(phase.local);

  // --- Nuclear envelope ---
  if (progress < 0.15) {
    nucEnv.visible = true;
    nucEnv.material.opacity = 0.25;
    nucleolusMat.opacity = 1;
  } else if (progress < 0.3) {
    nucEnv.visible = true;
    nucEnv.material.opacity = 0.25 * (1 - (progress - 0.15) / 0.15);
    nucleolusMat.opacity = 1 - (progress - 0.15) / 0.15;
  } else {
    nucEnv.visible = false;
    nucleolusMat.opacity = 0;
  }

  // --- Centrosome positions ---
  centrosomes.forEach(cs => {
    const sign = cs.position.y > 0 ? 1 : -1;
    const poleDist = progress < 0.15 ? 1.8 : progress < 0.35 ? 1.8 + (progress - 0.15) / 0.2 * 0.4 : 2.2;
    cs.position.y = sign * poleDist;
  });

  // --- Chromosomes ---
  chromosomes.forEach(chr => {
    const ud = chr.userData;

    if (progress < 0.15) {
      // Interphase: scattered in nucleus, decondensed (fatter)
      chr.position.lerp(ud.scatterPos, 0.05);
      chr.scale.setScalar(0.7 + Math.sin(Date.now() * 0.003 + ud.angle) * 0.05);
    } else if (progress < 0.35) {
      // Prophase: condensing → thinner, more distinct, moving toward equator
      const pt = (progress - 0.15) / 0.2;
      chr.scale.setScalar(0.7 + (1 - pt) * 0.3);
      chr.position.lerp(
        new THREE.Vector3(ud.equatorTarget.x, ud.equatorTarget.y * (1 - pt * 0.5), ud.equatorTarget.z),
        0.02
      );
    } else if (progress < 0.55) {
      // Metaphase: aligned at equator (y≈0)
      chr.scale.setScalar(1.0);
      const mt = (progress - 0.35) / 0.2;
      const target = new THREE.Vector3(ud.equatorTarget.x, 0, ud.equatorTarget.z);
      chr.position.lerp(target, 0.05);
      // Slight rotation oscillation
      chr.rotation.y += 0.01;
    } else if (progress < 0.75) {
      // Anaphase: sister chromatids separate
      chr.scale.setScalar(1.0);
      const at = (progress - 0.55) / 0.2;
      const separation = at * 1.6;
      // Split the X: move chromatid halves apart
      chr.children.forEach((arm, idx) => {
        if (arm.name === 'chromatid-0') arm.position.y = separation;
        if (arm.name === 'chromatid-1') arm.position.y = -separation;
      });
      // Move whole chromosome toward pole
      const poleTarget = ud.poleSign * (0.5 + at * 1.3);
      chr.position.y += (poleTarget - chr.position.y) * 0.03;
    } else if (progress < 0.90) {
      // Telophase: chromatids at poles, decondensing
      const tt = (progress - 0.75) / 0.15;
      chr.scale.setScalar(1.0 - tt * 0.3);
    } else {
      // Cytokinesis: cell divides, chromosomes in daughter cells
      const ct = (progress - 0.90) / 0.1;
      chr.scale.setScalar(0.7 - ct * 0.1);
    }
  });

  // --- Cleavage furrow ---
  if (progress >= 0.88) {
    furrow.visible = true;
    const ct = Math.min(1, (progress - 0.88) / 0.12);
    furrow.scale.set(1 - ct * 0.7, 1 - ct * 0.7, 1);
    furrow.material.opacity = ct;
  } else {
    furrow.visible = false;
  }

  // --- Spindle fibers ---
  updateSpindles();

  // --- Nuclear envelope reforming (telophase) ---
  if (progress >= 0.78 && progress < 0.90) {
    nucEnv.visible = true;
    nucEnv.material.opacity = (progress - 0.78) / 0.12 * 0.2;
    nucEnv.scale.setScalar(0.5 + (progress - 0.78) / 0.12 * 0.2);
  } else if (progress >= 0.90) {
    nucEnv.visible = true;
    nucEnv.material.opacity = 0.2;
    nucEnv.scale.setScalar(0.7);
  }

  // --- Membrane deformation during cytokinesis ---
  if (progress >= 0.92) {
    const ct = (progress - 0.92) / 0.08;
    membrane.scale.set(1, 1 - ct * 0.15, 1);
  } else {
    membrane.scale.set(1, 1, 1);
  }

  // --- Update UI ---
  updateUI(phase);
}

// ---- UI updates ----
const phaseInfo = {
  interphase: { zh: '间期 · Interphase', descZh: 'DNA 复制，染色质松散分布于细胞核中', descEn: 'DNA replicates, chromatin loosely distributed in nucleus' },
  prophase: { zh: '前期 · Prophase', descZh: '染色体凝缩，核膜解体，纺锤体开始形成', descEn: 'Chromosomes condense, nuclear envelope breaks down, spindle forms' },
  metaphase: { zh: '中期 · Metaphase', descZh: '染色体排列在赤道板，纺锤丝连接着丝粒', descEn: 'Chromosomes align at metaphase plate, spindle fibers attach to kinetochores' },
  anaphase: { zh: '后期 · Anaphase', descZh: '姐妹染色单体分离，向细胞两极移动', descEn: 'Sister chromatids separate, pulled toward opposite poles' },
  telophase: { zh: '末期 · Telophase', descZh: '染色单体到达两极，核膜重新形成，染色体解旋', descEn: 'Chromatids reach poles, nuclear envelopes reform, chromosomes decondense' },
  cytokinesis: { zh: '胞质分裂 · Cytokinesis', descZh: '细胞质分裂，形成两个子细胞', descEn: 'Cytoplasm divides, two daughter cells form' },
};

function updateUI(phase) {
  document.querySelectorAll('.phase-step').forEach(el => {
    const idx = phaseNames.indexOf(el.dataset.phase);
    const curIdx = phaseNames.indexOf(phase.name);
    el.classList.toggle('active', idx === curIdx);
    el.classList.toggle('done', idx < curIdx);
  });

  const info = phaseInfo[phase.name];
  document.querySelector('.phase-title').textContent = info.zh;
  document.querySelector('.phase-desc').textContent = info.descZh;

  document.getElementById('progress-slider').value = progress;
}

// ---- Controls ----
document.getElementById('progress-slider').addEventListener('input', (e) => {
  progress = parseFloat(e.target.value);
  updateScene();
});

document.getElementById('btn-play').addEventListener('click', () => {
  playing = !playing;
  document.getElementById('btn-play').textContent = playing ? '⏸' : '▶';
  document.getElementById('btn-play').classList.toggle('playing', playing);
});

document.getElementById('btn-prev').addEventListener('click', () => {
  playing = false;
  document.getElementById('btn-play').textContent = '▶';
  document.getElementById('btn-play').classList.remove('playing');
  // Jump to previous phase start
  const phase = getPhase(progress);
  const idx = phaseNames.indexOf(phase.name);
  const newIdx = Math.max(0, idx - 1);
  progress = [0, 0.15, 0.35, 0.55, 0.75, 0.90][newIdx];
  updateScene();
});

document.getElementById('btn-next').addEventListener('click', () => {
  playing = false;
  document.getElementById('btn-play').textContent = '▶';
  document.getElementById('btn-play').classList.remove('playing');
  const phase = getPhase(progress);
  const idx = phaseNames.indexOf(phase.name);
  const newIdx = Math.min(5, idx + 1);
  progress = [0, 0.15, 0.35, 0.55, 0.75, 0.90][newIdx];
  updateScene();
});

document.getElementById('btn-reset').addEventListener('click', () => {
  playing = false;
  progress = 0;
  document.getElementById('btn-play').textContent = '▶';
  document.getElementById('btn-play').classList.remove('playing');
  updateScene();
});

document.getElementById('speed-slider').addEventListener('input', (e) => {
  playSpeed = parseFloat(e.target.value);
});

// Phase bar clicks
document.querySelectorAll('.phase-step').forEach(el => {
  el.addEventListener('click', () => {
    const idx = phaseNames.indexOf(el.dataset.phase);
    progress = [0, 0.15, 0.35, 0.55, 0.75, 0.90][idx];
    updateScene();
  });
});

// ---- Resize ----
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// ---- Animation ----
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - (animate.last || now)) / 1000, 0.08);
  animate.last = now;

  if (playing) {
    progress += playSpeed * dt * 0.08;
    if (progress >= 1) { progress = 1; playing = false;
      document.getElementById('btn-play').textContent = '▶';
      document.getElementById('btn-play').classList.remove('playing');
    }
    updateScene();
  }

  controls.update();
  renderer.render(scene, camera);
}
animate.last = performance.now();

// ---- Init ----
updateScene();
requestAnimationFrame(animate);

// Theme toggle
document.getElementById('theme-btn').addEventListener('click', () => {
  const light = document.body.classList.toggle('light');
  document.getElementById('theme-btn').textContent = light ? '🌙' : '☀️';
  const bg = light ? 0xd8dae8 : 0x0a0a14;
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, 12, 35);
  membraneMat.color.set(light ? 0x996644 : 0xddaa88);
});
