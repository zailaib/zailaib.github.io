/* History Run — Time-travel road trip through 5500 years */
import * as THREE from 'three';

// ---- Scene ----
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a15);
scene.fog = new THREE.Fog(0x0a0a15, 5, 25);
const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.3, 40);
camera.position.set(0, 2.5, 3.5);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x334466, 1.2));
const sun = new THREE.DirectionalLight(0xffeedd, 2.5);
sun.position.set(5, 8, -3); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 35;
scene.add(sun);

// Stars
const stGeo = new THREE.BufferGeometry();
const stPos = new Float32Array(400);
for (let i = 0; i < 200; i++) {
  stPos[i * 3] = (Math.random() - 0.5) * 30;
  stPos[i * 3 + 1] = 4 + Math.random() * 8;
  stPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
}
stGeo.setAttribute('position', new THREE.BufferAttribute(stPos, 3));
scene.add(new THREE.Points(stGeo, new THREE.PointsMaterial({ size: 0.04, color: 0x8899cc, transparent: true, opacity: 0.5, depthWrite: false })));

// ---- Constants ----
const TIME_MIN = -35, TIME_MAX = 21; // -3500 to 2025 in centuries
function y2x(y) { return y / 100; }
function x2y(x) { return Math.round(x * 100); }

// ---- Eras & Vehicles ----
const ERAS = [
  { start: -3500, end: -800, name: '上古', nameEn: 'Ancient', vehicle: 'walker', color: 0x8b7355, road: 0x5c4033, emoji: '🚶' },
  { start: -800, end: 500, name: '古典', nameEn: 'Classical', vehicle: 'horse', color: 0xb8860b, road: 0x8b7355, emoji: '🐴' },
  { start: 500, end: 1500, name: '中世', nameEn: 'Medieval', vehicle: 'elephant', color: 0x708090, road: 0x696969, emoji: '🐘' },
  { start: 1500, end: 1700, name: '大航海', nameEn: 'Discovery', vehicle: 'ship', color: 0x4682b4, road: 0x1e5a8a, emoji: '⛵' },
  { start: 1700, end: 1850, name: '蒸汽', nameEn: 'Steam', vehicle: 'steam', color: 0x8b4513, road: 0x654321, emoji: '🚂' },
  { start: 1850, end: 1920, name: '工业', nameEn: 'Industrial', vehicle: 'car', color: 0x2f4f4f, road: 0x444444, emoji: '🚗' },
  { start: 1920, end: 2025, name: '现代', nameEn: 'Modern', vehicle: 'rocket', color: 0x1e3a5f, road: 0x333355, emoji: '🚀' },
];

function getEra(year) { return ERAS.find(e => year >= e.start && year < e.end) || ERAS[ERAS.length - 1]; }

// ---- Events ----
const EVENTS = [
  { year: -3100, title: '古埃及统一', desc: '美尼斯统一上下埃及', emoji: '👑', region: '中东' },
  { year: -2560, title: '胡夫金字塔', desc: '古埃及第四王朝', emoji: '🔺', region: '中东' },
  { year: -2070, title: '夏朝建立', desc: '中国第一个世袭朝代', emoji: '🏯', region: '中国' },
  { year: -1750, title: '汉谟拉比法典', desc: '最早的成文法典', emoji: '📜', region: '中东' },
  { year: -1600, title: '商朝·甲骨文', desc: '青铜文明与文字', emoji: '🐢', region: '中国' },
  { year: -1046, title: '周朝·封建', desc: '分封制与礼乐', emoji: '🎵', region: '中国' },
  { year: -563, title: '佛陀诞生', desc: '释迦牟尼', emoji: '🧘', region: '印度' },
  { year: -551, title: '孔子诞生', desc: '儒家思想创始人', emoji: '📖', region: '中国' },
  { year: -500, title: '孙子兵法', desc: '兵学圣典', emoji: '⚔️', region: '中国' },
  { year: -399, title: '苏格拉底之死', desc: '雅典民主与哲学', emoji: '🏺', region: '欧洲' },
  { year: -336, title: '亚历山大东征', desc: '希腊化时代开始', emoji: '🐎', region: '欧洲' },
  { year: -221, title: '秦统一六国', desc: '书同文·车同轨', emoji: '👊', region: '中国' },
  { year: -138, title: '张骞出使西域', desc: '丝绸之路开通', emoji: '🐫', region: '中国' },
  { year: -44, title: '凯撒遇刺', desc: '罗马共和国终结', emoji: '🗡️', region: '欧洲' },
  { year: 105, title: '蔡伦造纸', desc: '四大发明之一', emoji: '📄', region: '中国' },
  { year: 220, title: '三国时代', desc: '魏蜀吴鼎立', emoji: '🏴', region: '中国' },
  { year: 330, title: '君士坦丁堡', desc: '罗马帝国新都', emoji: '🏰', region: '欧洲' },
  { year: 476, title: '西罗马灭亡', desc: '中世纪开始', emoji: '💀', region: '欧洲' },
  { year: 618, title: '大唐建立', desc: '黄金时代·万国来朝', emoji: '👑', region: '中国' },
  { year: 627, title: '贞观之治', desc: '李世民·天可汗', emoji: '🌟', region: '中国' },
  { year: 750, title: '伊斯兰黄金时代', desc: '智慧宫·代数·医学', emoji: '🕌', region: '中东' },
  { year: 830, title: '巴格达智慧宫', desc: '百年翻译运动', emoji: '📚', region: '中东' },
  { year: 960, title: '宋朝·活字印刷', desc: '经济巅峰·火药·指南针', emoji: '🧨', region: '中国' },
  { year: 1096, title: '十字军东征', desc: '东西方碰撞', emoji: '✝️', region: '欧洲' },
  { year: 1271, title: '马可波罗', desc: '元朝·东西交流', emoji: '🧳', region: '中国' },
  { year: 1347, title: '黑死病', desc: '欧洲人口减半', emoji: '🦠', region: '欧洲' },
  { year: 1405, title: '郑和下西洋', desc: '宝船舰队·七下西洋', emoji: '⛵', region: '中国' },
  { year: 1440, title: '古腾堡印刷', desc: '知识传播革命', emoji: '🖨️', region: '欧洲' },
  { year: 1492, title: '哥伦布', desc: '发现新大陆', emoji: '🌎', region: '欧洲' },
  { year: 1526, title: '莫卧儿帝国', desc: '泰姬陵时代', emoji: '🏛️', region: '印度' },
  { year: 1644, title: '明朝灭亡', desc: '清军入关', emoji: '🏯', region: '中国' },
  { year: 1687, title: '牛顿·原理', desc: '经典力学诞生', emoji: '🍎', region: '欧洲' },
  { year: 1760, title: '工业革命', desc: '蒸汽机·工厂·城市化', emoji: '🏭', region: '欧洲' },
  { year: 1776, title: '美国独立', desc: '独立宣言', emoji: '🗽', region: '美洲' },
  { year: 1789, title: '法国大革命', desc: '自由·平等·博爱', emoji: '🏴', region: '欧洲' },
  { year: 1840, title: '鸦片战争', desc: '近代史开端', emoji: '💣', region: '中国' },
  { year: 1914, title: '第一次世界大战', desc: '1914-1918', emoji: '💥', region: '欧洲' },
  { year: 1939, title: '第二次世界大战', desc: '1939-1945', emoji: '🔥', region: '欧洲' },
  { year: 1949, title: '新中国成立', desc: '中华人民共和国', emoji: '🇨🇳', region: '中国' },
  { year: 1969, title: '人类登月', desc: '阿波罗11号', emoji: '🌕', region: '美洲' },
  { year: 1990, title: '互联网时代', desc: '万维网诞生', emoji: '💻', region: '全球' },
];

// ---- Road construction ----
const roadGroup = new THREE.Group();
scene.add(roadGroup);
const ROAD_WIDTH = 3.0;

// Build road segments per era
ERAS.forEach(era => {
  const x1 = y2x(era.start), x2 = y2x(era.end);
  const w = x2 - x1;
  const cx = (x1 + x2) / 2;
  const roadGeo = new THREE.PlaneGeometry(w, ROAD_WIDTH);
  const road = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ color: era.road, roughness: 0.7 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(cx, 0.005, 0);
  road.receiveShadow = true;
  roadGroup.add(road);

  // Lane markings (dashed center line)
  for (let m = x1; m < x2; m += 0.5) {
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.01, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xddcc88, emissive: 0x332200, emissiveIntensity: 0.3 })
    );
    dash.position.set(m + 0.125, 0.015, 0);
    roadGroup.add(dash);
  }

  // Side decorations: trees or pillars for each era
  const decorColor = era.road === 0x1e5a8a ? 0x4488cc : 0x336633; // water waves for ship era
  for (let d = x1; d < x2; d += 2 + Math.random() * 3) {
    const treeH = 0.4 + Math.random() * 0.8;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, treeH, 6),
      new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 })
    );
    const side = Math.random() > 0.5 ? 1 : -1;
    trunk.position.set(d, treeH / 2, side * (ROAD_WIDTH / 2 + 0.4));
    trunk.castShadow = true;
    roadGroup.add(trunk);

    if (era.road !== 0x1e5a8a) {
      const crown = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.4, 6),
        new THREE.MeshStandardMaterial({ color: decorColor, roughness: 0.6 })
      );
      crown.position.set(d, treeH + 0.15, side * (ROAD_WIDTH / 2 + 0.4));
      crown.castShadow = true;
      roadGroup.add(crown);
    }
  }

  // Era transition arch
  const archPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8),
    new THREE.MeshStandardMaterial({ color: era.color, roughness: 0.4, emissive: era.color, emissiveIntensity: 0.2 })
  );
  archPillar.position.set(x1, 0.9, ROAD_WIDTH / 2 + 0.2);
  roadGroup.add(archPillar);
  const archPillar2 = archPillar.clone();
  archPillar2.position.z = -ROAD_WIDTH / 2 - 0.2;
  roadGroup.add(archPillar2);
  const archTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.1, ROAD_WIDTH + 0.8),
    new THREE.MeshStandardMaterial({ color: era.color, roughness: 0.4, emissive: era.color, emissiveIntensity: 0.2 })
  );
  archTop.position.set(x1, 1.75, 0);
  roadGroup.add(archTop);
});

// ---- Event collectibles (floating orbs) ----
const eventGroup = new THREE.Group();
scene.add(eventGroup);
const eventMeshes = [];

EVENTS.forEach(e => {
  const x = y2x(e.year);
  const geo = new THREE.SphereGeometry(0.12, 12, 12);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd700, roughness: 0.2, metalness: 0.5,
    emissive: 0xffd700, emissiveIntensity: 0.5,
  });
  const orb = new THREE.Mesh(geo, mat);
  orb.position.set(x, 0.6, 0);
  orb.userData = { event: e, collected: false };
  orb.castShadow = true;
  eventGroup.add(orb);
  eventMeshes.push(orb);

  // Light pillar below
  const pillarGeo = new THREE.CylinderGeometry(0.02, 0.05, 0.5, 8);
  const pillar = new THREE.Mesh(pillarGeo, new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.3, depthWrite: false }));
  pillar.position.set(x, 0.25, 0);
  eventGroup.add(pillar);
});

// ---- Player vehicle ----
const playerGroup = new THREE.Group();
scene.add(playerGroup);

const vehicleParts = {};
function buildVehicle(type) {
  while (playerGroup.children.length > 0) playerGroup.remove(playerGroup.children[0]);
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0.4 });

  switch (type) {
    case 'walker': {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.5, 8), mat(0xddbb99));
      body.position.y = 0.25; playerGroup.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), mat(0xffddbb));
      head.position.y = 0.6; playerGroup.add(head);
      break;
    }
    case 'horse': {
      const horseBody = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.6), mat(0x8b4513));
      horseBody.position.y = 0.35; playerGroup.add(horseBody);
      const horseHead = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.2), mat(0x8b4513));
      horseHead.position.set(0, 0.5, 0.35); playerGroup.add(horseHead);
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6), mat(0x654321));
        leg.position.set(i < 2 ? -0.1 : 0.1, 0.15, i % 2 === 0 ? 0.15 : -0.15);
        leg.name = 'leg'; playerGroup.add(leg);
      }
      const rider = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8), mat(0xcc8844));
      rider.position.y = 0.6; playerGroup.add(rider);
      break;
    }
    case 'elephant': {
      const eBody = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.8), mat(0x888888));
      eBody.position.y = 0.4; playerGroup.add(eBody);
      const eHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mat(0x888888));
      eHead.position.set(0, 0.55, 0.45); playerGroup.add(eHead);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.5, 8), mat(0x777777));
      trunk.position.set(0, 0.3, 0.6); trunk.rotation.x = 0.6; playerGroup.add(trunk);
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 8), mat(0x666666));
        leg.position.set(i < 2 ? -0.12 : 0.12, 0.18, i % 2 === 0 ? 0.2 : -0.2);
        leg.name = 'leg'; playerGroup.add(leg);
      }
      break;
    }
    case 'ship': {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.8), mat(0x8b4513));
      hull.position.y = 0.25; playerGroup.add(hull);
      const bow = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 6, 8), mat(0x8b4513));
      bow.rotation.x = -Math.PI / 2; bow.position.set(0, 0.2, 0.5); playerGroup.add(bow);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), mat(0x654321));
      mast.position.y = 0.5; playerGroup.add(mast);
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.5), new THREE.MeshStandardMaterial({ color: 0xfffff0, roughness: 0.6, side: THREE.DoubleSide }));
      sail.position.set(0, 0.75, 0); playerGroup.add(sail);
      break;
    }
    case 'steam': {
      const loco = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.65), mat(0x2f2f2f));
      loco.position.y = 0.3; playerGroup.add(loco);
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.4, 8), mat(0x444444));
      chimney.position.set(0, 0.55, 0.15); playerGroup.add(chimney);
      const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5, depthWrite: false }));
      smoke.position.set(0, 0.8, 0.15); smoke.name = 'smoke'; playerGroup.add(smoke);
      for (let i = 0; i < 4; i++) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12), mat(0x333333));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(i < 2 ? -0.12 : 0.12, 0.1, i % 2 === 0 ? 0.15 : -0.15);
        wheel.name = 'wheel'; playerGroup.add(wheel);
      }
      break;
    }
    case 'car': {
      const cBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.55), mat(0xcc2222));
      cBody.position.y = 0.22; playerGroup.add(cBody);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.13, 0.25), mat(0x88aacc));
      cabin.position.set(0, 0.35, 0.05); playerGroup.add(cabin);
      for (let i = 0; i < 4; i++) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12), mat(0x111111));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(i < 2 ? -0.1 : 0.1, 0.08, i % 2 === 0 ? 0.15 : -0.18);
        wheel.name = 'wheel'; playerGroup.add(wheel);
      }
      break;
    }
    case 'rocket': {
      const rBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.5, 8), mat(0xeeeeee));
      rBody.rotation.x = -Math.PI / 2; rBody.position.y = 0.3; playerGroup.add(rBody);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 8), mat(0xff3333));
      nose.rotation.x = -Math.PI / 2; nose.position.set(0, 0.3, 0.3); playerGroup.add(nose);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0xff8844, depthWrite: false }));
      flame.rotation.x = Math.PI / 2; flame.position.set(0, 0.3, -0.3); flame.name = 'flame'; playerGroup.add(flame);
      const finGeo = new THREE.BoxGeometry(0.02, 0.1, 0.12);
      for (let i = 0; i < 3; i++) {
        const fin = new THREE.Mesh(finGeo, mat(0xcc3333));
        fin.position.set(0, 0.15, -0.2); fin.rotation.y = i * Math.PI * 2 / 3;
        fin.position.x = Math.cos(fin.rotation.y) * 0.12;
        playerGroup.add(fin);
      }
      break;
    }
  }
}

// ---- State ----
let playerX = y2x(-3000); // start at 3000 BCE
let playerSpeed = 0; // centuries per second
let currentVehicle = 'walker';
let collectCount = 0;
let targetSpeed = 0.6;

playerGroup.position.set(playerX, 0, 0);
buildVehicle(currentVehicle);

// ---- Camera follow ----
function updateCamera() {
  const tx = playerX - 2.5;
  camera.position.lerp(new THREE.Vector3(tx, 2.2, 3.2), 0.06);
  camera.lookAt(playerX + 1, 0.6, 0);
}

// ---- UI helpers ----
function updateHUD() {
  const yr = x2y(playerX);
  const era = getEra(yr);
  const eraLabel = document.getElementById('era-label');
  const eraYear = document.getElementById('era-year');
  const eraRange = document.getElementById('era-range');
  const prefix = yr < 0 ? '公元前 ' + (-yr) : '公元 ' + yr;
  eraYear.textContent = prefix + ' 年';
  eraLabel.textContent = era.emoji + ' ' + era.name + '时代';
  eraLabel.style.color = '#' + era.color.toString(16).padStart(6, '0');
  eraRange.textContent = (era.start < 0 ? '前' + (-era.start) : era.start) + ' — ' + era.end + '年';

  if (era.vehicle !== currentVehicle) {
    currentVehicle = era.vehicle;
    buildVehicle(currentVehicle);
    document.getElementById('vehicle-ind').textContent = era.emoji;
  }
}

function addEventCard(event) {
  const feed = document.getElementById('event-feed');
  const card = document.createElement('div');
  card.className = 'event-card';
  card.innerHTML = `
    <span class="evt-year">${event.emoji} ${event.year < 0 ? '前'+(-event.year)+'年' : event.year+'年'} · ${event.region}</span>
    <div class="evt-title">${event.title}</div>
    <div class="evt-desc">${event.desc}</div>
  `;
  feed.insertBefore(card, feed.firstChild);

  // Remove old cards (keep max 5)
  const cards = feed.querySelectorAll('.event-card');
  cards.forEach((c, i) => {
    if (i >= 5) {
      c.classList.add('fading');
      setTimeout(() => c.remove(), 500);
    }
  });
}

// ---- Animation ----
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - (animate.last || now)) / 1000, 0.08);
  animate.last = now;

  // Smooth speed
  playerSpeed += (targetSpeed - playerSpeed) * 3 * dt;
  playerX += playerSpeed * dt;
  playerX = Math.max(TIME_MIN, Math.min(TIME_MAX, playerX));
  playerGroup.position.x = playerX;

  // Bob animation
  const bob = Math.sin(now * 0.015) * 0.06;
  playerGroup.position.y = bob;
  // slight forward tilt
  playerGroup.rotation.x = -0.05 + Math.sin(now * 0.02) * 0.03;

  // Animate wheels
  playerGroup.children.forEach(c => {
    if (c.name === 'wheel') c.rotation.x += playerSpeed * 15 * dt;
    if (c.name === 'leg') { /* legs stay static for simplicity */ }
    if (c.name === 'flame') c.scale.setScalar(0.6 + Math.random() * 0.8);
    if (c.name === 'smoke') { c.position.y = 0.8 + Math.sin(now * 0.01) * 0.1; c.scale.setScalar(0.8 + Math.sin(now * 0.015) * 0.4); }
  });

  // Check event collection
  eventMeshes.forEach(orb => {
    if (orb.userData.collected) return;
    const dist = Math.abs(playerX - orb.position.x);
    if (dist < 0.25) {
      orb.userData.collected = true;
      orb.material.color.set(0x44ff44);
      orb.material.emissive.set(0x226622);
      orb.scale.setScalar(0.5);
      collectCount++;
      document.getElementById('collect-count').textContent = '📦 ' + collectCount + '/' + EVENTS.length;
      addEventCard(orb.userData.event);
    }
  });

  // Pulsate uncollected orbs
  const t = now * 0.002;
  eventMeshes.forEach(orb => {
    if (!orb.userData.collected) {
      orb.position.y = 0.6 + Math.sin(t * 2 + orb.position.x) * 0.2;
      orb.rotation.y += 0.02;
    }
  });

  updateCamera();
  updateHUD();
  renderer.render(scene, camera);
}
animate.last = performance.now();

// ---- Controls ----
document.getElementById('btn-slower').addEventListener('click', () => { targetSpeed = Math.max(0.1, targetSpeed - 0.3); updateSpeedDisplay(); });
document.getElementById('btn-faster').addEventListener('click', () => { targetSpeed = Math.min(5, targetSpeed + 0.3); updateSpeedDisplay(); });
document.getElementById('btn-pause').addEventListener('click', () => {
  targetSpeed = targetSpeed < 0.01 ? 0.6 : 0;
  document.getElementById('btn-pause').textContent = targetSpeed < 0.01 ? '▶' : '⏸';
  updateSpeedDisplay();
});

function updateSpeedDisplay() {
  document.getElementById('speed-display').textContent = targetSpeed < 0.01 ? '⏸' : targetSpeed.toFixed(1) + 'x';
}

// Jump buttons
document.querySelectorAll('.jump-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    playerX = parseFloat(btn.dataset.x);
    updateCamera();
  });
});

// Resize
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// Init
buildVehicle('walker');
document.getElementById('vehicle-ind').textContent = '🚶';
document.getElementById('collect-count').textContent = '📦 0/' + EVENTS.length;
updateSpeedDisplay();
requestAnimationFrame(animate);

// Theme toggle
document.getElementById('theme-btn').addEventListener('click', () => {
  const light = document.body.classList.toggle('light');
  document.getElementById('theme-btn').textContent = light ? '🌙' : '☀️';
  const bg = light ? 0xd0d4e0 : 0x0a0a15;
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, 5, 25);
});
