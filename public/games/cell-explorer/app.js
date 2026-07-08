/* Cell Explorer — 3D Cell Structure Visualization */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---- State ----
let cellType = 'plant';
let hoveredOrg = null;
let cellGroup = new THREE.Group();

// ---- Three.js setup ----
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080814);
scene.fog = new THREE.Fog(0x080814, 8, 25);

const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.3, 40);
camera.position.set(3, 2, 7);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.minDistance = 2;
controls.maxDistance = 14;
controls.zoomSpeed = 0.5;
controls.target.set(0, 0, 0);
controls.update();

// Lighting
scene.add(new THREE.AmbientLight(0x334466, 1.6));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
keyLight.position.set(5, 8, 5);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x8899cc, 0.6);
fillLight.position.set(-3, 0, -3);
scene.add(fillLight);
const rimLight = new THREE.DirectionalLight(0xaaccff, 0.8);
rimLight.position.set(0, -1, 5);
scene.add(rimLight);

// Background particles
const starsGeo = new THREE.BufferGeometry();
const starsPos = new Float32Array(600);
for (let i = 0; i < 200; i++) {
  starsPos[i * 3] = (Math.random() - 0.5) * 16;
  starsPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
  starsPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ size: 0.02, color: 0x6677aa, transparent: true, opacity: 0.5, depthWrite: false })));

// Grid
const grid = new THREE.PolarGridHelper(6, 24, 16, 64, 0x222244, 0x161630);
scene.add(grid);

scene.add(cellGroup);

// ---- Material helpers ----
function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: opts.roughness ?? 0.3, metalness: opts.metalness ?? 0.05,
    transparent: opts.transparent ?? false, opacity: opts.opacity ?? 1,
    emissive: opts.emissive ?? color, emissiveIntensity: opts.emissiveIntensity ?? 0.1,
  });
}
function glassMat(color, opacity = 0.25) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: 0.1, metalness: 0, transparent: true, opacity,
    envMapIntensity: 0.4, clearcoat: 0.1,
  });
}

// ---- Organelle builders ----
function makeEllipsoid(rx, ry, rz, color, opacity = 1) {
  const geo = new THREE.SphereGeometry(1, 32, 20);
  const mesh = new THREE.Mesh(geo, mat(color, { roughness: 0.35, transparent: opacity < 1, opacity }));
  mesh.scale.set(rx, ry, rz);
  return mesh;
}

function makeMitochondrion() {
  const group = new THREE.Group();
  // Outer membrane (capsule)
  const outer = makeEllipsoid(0.45, 0.22, 0.22, '#e07060');
  group.add(outer);
  // Cristae (inner folds)
  for (let i = -2; i <= 2; i++) {
    const crista = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.03, 8, 16, Math.PI),
      mat('#c04040', { roughness: 0.2 })
    );
    crista.position.x = i * 0.12;
    crista.rotation.z = Math.PI / 2;
    crista.scale.set(0.6, 0.5, 0.5);
    group.add(crista);
  }
  return group;
}

function makeChloroplast() {
  const group = new THREE.Group();
  // Outer envelope
  const outer = makeEllipsoid(0.5, 0.25, 0.3, '#2d8a4e', 0.85);
  group.add(outer);
  // Thylakoid stacks (grana) — small green discs
  for (let i = 0; i < 5; i++) {
    const stack = new THREE.Group();
    const n = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < n; j++) {
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16),
        mat('#1a6b35', { roughness: 0.2, emissiveIntensity: 0.3 })
      );
      disc.position.y = j * 0.04;
      stack.add(disc);
    }
    stack.position.set((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.2);
    stack.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
    group.add(stack);
  }
  return group;
}

function makeGolgi() {
  const group = new THREE.Group();
  // Stacked curved cisternae
  for (let i = 0; i < 5; i++) {
    const cisterna = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.04, 8, 24, Math.PI * 0.7),
      mat('#d4a860', { roughness: 0.25, emissiveIntensity: 0.15 })
    );
    cisterna.position.y = i * 0.1 - 0.2;
    cisterna.rotation.x = 0.2;
    cisterna.rotation.z = Math.PI / 2;
    cisterna.scale.set(1, 1, 0.3);
    group.add(cisterna);
  }
  // Vesicles
  for (let i = 0; i < 3; i++) {
    const vesicle = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat('#e8c878', { roughness: 0.2 }));
    vesicle.position.set(0.3 + Math.random() * 0.2, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.2);
    group.add(vesicle);
  }
  return group;
}

function makeNucleus(radius = 0.45) {
  const group = new THREE.Group();
  // Nuclear envelope (double membrane look)
  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 36),
    mat('#5b3a8c', { roughness: 0.2, emissiveIntensity: 0.2, transparent: true, opacity: 0.75 })
  );
  group.add(envelope);
  // Nuclear pores (small dots on surface)
  for (let i = 0; i < 16; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const pore = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), mat('#9988bb', { roughness: 0.1 }));
    pore.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
    group.add(pore);
  }
  // Nucleolus
  const nucleolus = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.4, 32, 24), mat('#3a2060', { roughness: 0.15, emissiveIntensity: 0.3 }));
  group.add(nucleolus);
  return group;
}

function makeVacuole(size = 0.9) {
  const group = new THREE.Group();
  // Tonoplast (membrane)
  const membrane = new THREE.Mesh(new THREE.SphereGeometry(size, 48, 36), glassMat('#5599cc', 0.3));
  group.add(membrane);
  // Inner fluid
  const fluid = new THREE.Mesh(new THREE.SphereGeometry(size * 0.9, 32, 24), glassMat('#88bbee', 0.2));
  group.add(fluid);
  return group;
}

// ---- Cell model builders ----
function disposeMeshes(group) {
  group.traverse(c => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) (Array.isArray(c.material) ? c.material : [c.material]).forEach(m => m.dispose());
  });
}
function clearCell() {
  while (cellGroup.children.length > 0) {
    const c = cellGroup.children[0];
    disposeMeshes(c);
    cellGroup.remove(c);
  }
}

function buildCell(type) {
  clearCell();
  const parts = [];

  switch (type) {
    case 'plant': buildPlantCell(parts); break;
    case 'animal': buildAnimalCell(parts); break;
    case 'virus': buildVirus(parts); break;
    case 'chlorella': buildChlorella(parts); break;
  }

  // Add all parts to group
  parts.forEach(p => {
    if (p.group) cellGroup.add(p.group);
  });

  // Update legend
  updateLegend(parts);
  // Store parts for raycaster
  cellGroup.userData.parts = parts;
}

function buildPlantCell(parts) {
  // Cell wall (rigid outer box)
  const wallGeo = new THREE.BoxGeometry(2.8, 2.0, 2.0);
  const wall = new THREE.Mesh(wallGeo, glassMat('#c8b878', 0.2));
  wall.name = 'cellWall';
  parts.push({ group: wall, name: 'Cell Wall', nameZh: '细胞壁', color: '#c8b878', descZh: '纤维素构成的刚性外壁，维持细胞形状', descEn: 'Rigid cellulose outer layer maintaining cell shape' });

  // Inner membrane
  const membrane = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.85, 1.85), glassMat('#d4c898', 0.15));
  parts.push({ group: membrane, name: 'Cell Membrane', nameZh: '细胞膜', color: '#d4c898', descZh: '选择性透过膜，控制物质进出', descEn: 'Selectively permeable membrane' });

  // Large central vacuole
  const vacuole = makeVacuole(0.75);
  vacuole.position.set(0.15, 0.05, 0);
  parts.push({ group: vacuole, name: 'Central Vacuole', nameZh: '中央液泡', color: '#5599cc', descZh: '储存水分和代谢产物，维持渗透压', descEn: 'Stores water & metabolites, maintains turgor pressure' });

  // Nucleus (pushed to side by vacuole)
  const nucleus = makeNucleus(0.35);
  nucleus.position.set(-0.65, 0.2, 0.15);
  parts.push({ group: nucleus, name: 'Nucleus', nameZh: '细胞核', color: '#5b3a8c', descZh: '含DNA，基因表达调控中心', descEn: 'Contains DNA, control center of gene expression' });

  // Chloroplasts
  for (let i = 0; i < 5; i++) {
    const chloro = makeChloroplast();
    const angle = (i / 5) * Math.PI * 2 + 0.3;
    chloro.position.set(
      (Math.cos(angle) * 0.7) * 0.8,
      (Math.sin(angle) * 0.35) * 0.8 + 0.1,
      (i % 2 === 0 ? 0.5 : -0.5)
    );
    parts.push({ group: chloro, name: 'Chloroplast', nameZh: '叶绿体', color: '#2d8a4e', descZh: '光合作用场所，含叶绿素和类囊体', descEn: 'Site of photosynthesis, contains chlorophyll & thylakoids' });
  }

  // Mitochondria
  for (let i = 0; i < 3; i++) {
    const mito = makeMitochondrion();
    mito.position.set(-0.3 + i * 0.3, -0.5, 0.6);
    mito.rotation.set(0, i * 1.2, 0.3);
    parts.push({ group: mito, name: 'Mitochondrion', nameZh: '线粒体', color: '#e07060', descZh: '细胞呼吸场所，产生ATP', descEn: 'Cellular respiration, produces ATP' });
  }

  // Golgi
  const golgi = makeGolgi();
  golgi.position.set(-0.7, -0.4, -0.45);
  parts.push({ group: golgi, name: 'Golgi Apparatus', nameZh: '高尔基体', color: '#d4a860', descZh: '蛋白质修饰、分选和运输', descEn: 'Protein modification, sorting & transport' });

  // ER (use wavy tubes)
  const erGroup = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.9 + i * 0.15, 0.15, 0.3),
      new THREE.Vector3(-0.7 + i * 0.1, 0.2 + i * 0.05, 0.2),
      new THREE.Vector3(-0.5 + i * 0.08, 0.35, 0.15),
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.03, 8, false), mat('#c8b0d8', { roughness: 0.4 }));
    erGroup.add(tube);
  }
  parts.push({ group: erGroup, name: 'Endoplasmic Reticulum', nameZh: '内质网', color: '#c8b0d8', descZh: '蛋白质合成（粗面）和脂质合成（滑面）', descEn: 'Protein synthesis (rough) & lipid synthesis (smooth)' });

  // Ribosomes (tiny dots on ER and free)
  const riboGroup = new THREE.Group();
  for (let i = 0; i < 30; i++) {
    const ribo = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), mat('#a090c0', { roughness: 0.1, emissiveIntensity: 0.4 }));
    ribo.position.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2);
    riboGroup.add(ribo);
  }
  parts.push({ group: riboGroup, name: 'Ribosomes', nameZh: '核糖体', color: '#a090c0', descZh: '蛋白质合成的分子机器', descEn: 'Molecular machines for protein synthesis' });
}

function buildAnimalCell(parts) {
  // Cell membrane (sphere)
  const membrane = new THREE.Mesh(new THREE.SphereGeometry(1.3, 64, 48), glassMat('#e8c0a0', 0.2));
  parts.push({ group: membrane, name: 'Cell Membrane', nameZh: '细胞膜', color: '#e8c0a0', descZh: '磷脂双分子层，流动性屏障', descEn: 'Phospholipid bilayer, fluid barrier' });

  // Nucleus (central)
  const nucleus = makeNucleus(0.5);
  parts.push({ group: nucleus, name: 'Nucleus', nameZh: '细胞核', color: '#5b3a8c', descZh: '含DNA，基因表达调控中心', descEn: 'Contains DNA, gene expression control center' });

  // Mitochondria (scattered)
  for (let i = 0; i < 5; i++) {
    const mito = makeMitochondrion();
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = 0.8;
    mito.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
    mito.lookAt(new THREE.Vector3(0, 0, 0));
    parts.push({ group: mito, name: 'Mitochondrion', nameZh: '线粒体', color: '#e07060', descZh: '细胞呼吸场所，ATP生产', descEn: 'Cellular respiration, ATP production' });
  }

  // Golgi
  const golgi = makeGolgi();
  golgi.position.set(0.6, 0.2, 0.4);
  parts.push({ group: golgi, name: 'Golgi Apparatus', nameZh: '高尔基体', color: '#d4a860', descZh: '蛋白质修饰、分选和运输', descEn: 'Protein modification, sorting & transport' });

  // ER
  const erGroup = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.4, -0.1 + i * 0.15, 0.5),
      new THREE.Vector3(0.55, i * 0.12, 0.35),
      new THREE.Vector3(0.65, 0.1 + i * 0.1, 0.2),
    ]);
    erGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.025, 8, false), mat('#c8b0d8', { roughness: 0.4 })));
  }
  parts.push({ group: erGroup, name: 'Endoplasmic Reticulum', nameZh: '内质网', color: '#c8b0d8', descZh: '蛋白质与脂质合成网络', descEn: 'Protein & lipid synthesis network' });

  // Lysosomes
  for (let i = 0; i < 4; i++) {
    const lyso = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), mat('#e8a040', { roughness: 0.2, emissiveIntensity: 0.3 }));
    lyso.position.set((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1, (Math.random() - 0.5) * 1);
    parts.push({ group: lyso, name: 'Lysosome', nameZh: '溶酶体', color: '#e8a040', descZh: '含消化酶，分解大分子', descEn: 'Contains digestive enzymes, breaks down macromolecules' });
  }

  // Centrioles (pair of small cylinders)
  const centrioleGroup = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16), mat('#666688', { roughness: 0.3 }));
    cyl.position.x = i * 0.12 - 0.06;
    if (i === 1) cyl.rotation.z = Math.PI / 2;
    centrioleGroup.add(cyl);
  }
  centrioleGroup.position.set(0.6, 0.55, 0.1);
  parts.push({ group: centrioleGroup, name: 'Centrioles', nameZh: '中心粒', color: '#666688', descZh: '参与细胞分裂中纺锤体的形成', descEn: 'Involved in spindle formation during cell division' });

  // Ribosomes
  const riboGroup = new THREE.Group();
  for (let i = 0; i < 35; i++) {
    const ribo = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), mat('#a090c0', { roughness: 0.1, emissiveIntensity: 0.4 }));
    ribo.position.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6);
    riboGroup.add(ribo);
  }
  parts.push({ group: riboGroup, name: 'Ribosomes', nameZh: '核糖体', color: '#a090c0', descZh: '蛋白质合成的分子机器', descEn: 'Molecular machines for protein synthesis' });
}

function buildVirus(parts) {
  // T4 Bacteriophage
  // Head (icosahedron)
  const headGeo = new THREE.IcosahedronGeometry(0.45, 1);
  const head = new THREE.Mesh(headGeo, mat('#4466aa', { roughness: 0.25, emissiveIntensity: 0.2 }));
  head.position.y = 0.9;
  head.scale.set(1, 1.15, 0.7);
  parts.push({ group: head, name: 'Capsid Head', nameZh: '衣壳头部', color: '#4466aa', descZh: '蛋白质外壳，保护病毒DNA', descEn: 'Protein shell protecting viral DNA' });

  // DNA inside head
  const dna = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), mat('#334488', { roughness: 0.1, emissiveIntensity: 0.4 }));
  dna.position.copy(head.position);
  dna.scale.set(0.7, 0.8, 0.6);
  parts.push({ group: dna, name: 'Viral DNA', nameZh: '病毒DNA', color: '#334488', descZh: '遗传物质，注入宿主细胞', descEn: 'Genetic material injected into host cell' });

  // Collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.12, 16), mat('#5577bb', { roughness: 0.3 }));
  collar.position.y = 0.45;
  parts.push({ group: collar, name: 'Collar', nameZh: '颈部', color: '#5577bb', descZh: '连接头部和尾鞘', descEn: 'Connects head and tail sheath' });

  // Tail sheath
  const sheath = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16), mat('#6688cc', { roughness: 0.3 }));
  sheath.position.y = 0.0;
  parts.push({ group: sheath, name: 'Tail Sheath', nameZh: '尾鞘', color: '#6688cc', descZh: '可收缩的蛋白质管，注射DNA', descEn: 'Contractile protein tube for DNA injection' });

  // Tail sheath striations (rings)
  const ringsGroup = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.015, 8, 16), mat('#7799dd', { roughness: 0.2 }));
    ring.position.y = -0.3 + i * 0.15;
    ringsGroup.add(ring);
  }
  parts.push({ group: ringsGroup, name: 'Sheath Rings', nameZh: '尾鞘环纹', color: '#7799dd', descZh: '尾鞘的结构蛋白环', descEn: 'Structural protein rings of the sheath' });

  // Base plate
  const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.08, 16), mat('#5577bb', { roughness: 0.3 }));
  basePlate.position.y = -0.44;
  parts.push({ group: basePlate, name: 'Base Plate', nameZh: '基板', color: '#5577bb', descZh: '尾丝附着点，识别宿主', descEn: 'Tail fiber attachment, host recognition' });

  // Tail fibers (6 legs)
  const fibersGroup = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const fiberGroup = new THREE.Group();
    // Upper segment
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), mat('#99bb88', { roughness: 0.3 }));
    upper.position.y = -0.25;
    upper.rotation.z = Math.PI * 0.35;
    fiberGroup.add(upper);
    // Lower segment (kink)
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.4, 8), mat('#88aa77', { roughness: 0.3 }));
    lower.position.set(0.2, -0.55, 0);
    lower.rotation.z = Math.PI * 0.15;
    fiberGroup.add(lower);
    fiberGroup.rotation.y = angle;
    fibersGroup.add(fiberGroup);
  }
  parts.push({ group: fibersGroup, name: 'Tail Fibers', nameZh: '尾丝', color: '#99bb88', descZh: '识别并结合宿主细胞表面受体', descEn: 'Recognize and bind host cell surface receptors' });
}

function buildChlorella(parts) {
  // Cell wall
  const wall = new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 36), glassMat('#b8c878', 0.2));
  parts.push({ group: wall, name: 'Cell Wall', nameZh: '细胞壁', color: '#b8c878', descZh: '含纤维素的刚性外壁', descEn: 'Rigid cellulose-containing outer layer' });

  // Membrane
  const membrane = new THREE.Mesh(new THREE.SphereGeometry(1.02, 48, 36), glassMat('#c8d888', 0.12));
  parts.push({ group: membrane, name: 'Cell Membrane', nameZh: '细胞膜', color: '#c8d888', descZh: '选择性透过膜', descEn: 'Selectively permeable membrane' });

  // Cup-shaped chloroplast (occupies ~60% of the cell)
  const chloroGroup = new THREE.Group();
  // Main chloroplast body (cup shape using a hemisphere-like arrangement)
  const chloroMain = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.65),
    mat('#2d8a4e', { roughness: 0.3, emissiveIntensity: 0.2, transparent: true, opacity: 0.8 })
  );
  chloroGroup.add(chloroMain);

  // Thylakoid layers inside chloroplast
  for (let i = 0; i < 4; i++) {
    const thylakoid = new THREE.Mesh(
      new THREE.SphereGeometry(0.7 + i * 0.04, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
      mat('#1a6b35', { roughness: 0.2, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 })
    );
    chloroGroup.add(thylakoid);
  }
  chloroGroup.rotation.x = -0.4;
  parts.push({ group: chloroGroup, name: 'Cup-shaped Chloroplast', nameZh: '杯状叶绿体', color: '#2d8a4e', descZh: '大型杯状叶绿体，占细胞大部分，光合作用', descEn: 'Large cup-shaped chloroplast, occupies most of the cell' });

  // Pyrenoid (starch storage within chloroplast)
  const pyrenoid = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), mat('#e8e0c0', { roughness: 0.2, emissiveIntensity: 0.3 }));
  pyrenoid.position.set(0, -0.45, 0.55);
  parts.push({ group: pyrenoid, name: 'Pyrenoid', nameZh: '淀粉核', color: '#e8e0c0', descZh: '储存淀粉，CO₂浓缩机制', descEn: 'Starch storage, CO₂ concentration mechanism' });

  // Nucleus (small, near pyrenoid)
  const nucleus = makeNucleus(0.2);
  nucleus.position.set(-0.3, 0.2, 0.6);
  parts.push({ group: nucleus, name: 'Nucleus', nameZh: '细胞核', color: '#5b3a8c', descZh: '含遗传物质', descEn: 'Contains genetic material' });

  // Mitochondria (few, small)
  for (let i = 0; i < 2; i++) {
    const mito = makeMitochondrion();
    mito.position.set((i === 0 ? 0.3 : -0.35), -0.2, 0.65);
    mito.scale.set(0.7, 0.7, 0.7);
    parts.push({ group: mito, name: 'Mitochondrion', nameZh: '线粒体', color: '#e07060', descZh: '细胞呼吸，ATP生产', descEn: 'Cellular respiration, ATP production' });
  }
}

// ---- Legend ----
function updateLegend(parts) {
  const legend = document.getElementById('legend');
  // Deduplicate by name
  const seen = new Set();
  const unique = parts.filter(p => { if (seen.has(p.name)) return false; seen.add(p.name); return true; });
  legend.innerHTML = unique.map(p =>
    `<div class="legend-item" data-name="${p.name}">
      <span class="legend-dot" style="background:${p.color}"></span>${p.nameZh}
    </div>`
  ).join('');
}

function highlightLegend(name) {
  document.querySelectorAll('.legend-item').forEach(el => {
    el.classList.toggle('highlight', el.dataset.name === name);
  });
}

// ---- Info panel ----
function showInfo(part) {
  const panel = document.getElementById('info-panel');
  panel.innerHTML = `
    <div class="cell-type" style="color:${part.color}">${part.nameZh} · ${part.name}</div>
    <div class="org-name" style="color:${part.color}">${part.nameZh}</div>
    <div class="org-desc">${part.descZh}</div>
  `;
}

// ---- Raycaster for hover/click ----
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getIntersections(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const meshes = [];
  (cellGroup.userData.parts || []).forEach(p => {
    p.group.traverse(child => { if (child.isMesh) meshes.push(child); });
  });
  return raycaster.intersectObjects(meshes, false);
}

renderer.domElement.addEventListener('mousemove', (e) => {
  const hits = getIntersections(e);
  if (hits.length > 0) {
    // Find which part the hit mesh belongs to
    const parts = cellGroup.userData.parts || [];
    let foundPart = null;
    for (const p of parts) {
      let matched = false;
      p.group.traverse(child => { if (child === hits[0].object) matched = true; });
      if (matched) { foundPart = p; break; }
    }
    if (foundPart && foundPart !== hoveredOrg) {
      hoveredOrg = foundPart;
      highlightLegend(foundPart.name);
      showInfo(foundPart);
      document.body.style.cursor = 'pointer';
    }
  } else if (hoveredOrg) {
    hoveredOrg = null;
    highlightLegend(null);
    document.body.style.cursor = 'grab';
  }
});

// ---- UI ----
function switchCell(type) {
  cellType = type;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  buildCell(type);
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchCell(btn.dataset.type));
});

// ---- Animation ----
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// ---- Resize ----
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// ---- Init ----
buildCell('plant');
animate();
