/* History Timeline — 3D Historical Gantt Chart */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---- Scene setup ----
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.Fog(0x0a0a12, 15, 45);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.5, 60);
camera.position.set(-15, 8, 8);
camera.lookAt(0, 0, 2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 2.5);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 3; controls.maxDistance = 30;
controls.maxPolarAngle = Math.PI * 0.45;
controls.update();

// Lights
scene.add(new THREE.AmbientLight(0x334466, 2));
const key = new THREE.DirectionalLight(0xffeedd, 3);
key.position.set(5, 12, 5); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 0.5; key.shadow.camera.far = 50;
key.shadow.camera.left = -20; key.shadow.camera.right = 20;
key.shadow.camera.top = 15; key.shadow.camera.bottom = -5;
scene.add(key);
scene.add(new THREE.DirectionalLight(0x8899cc, 0.6).position.set(-5, 2, -3));

// ---- Constants ----
// X: time (1 unit = 100 years), range ~ -35 (3500 BCE) to 20 (2025 CE)
// Z: civilization tracks, Y: height

const tracks = [
  { name: '中国 China', nameZh: '中国', z: 0, color: 0xd4534a },
  { name: '欧洲 Europe', nameZh: '欧洲', z: 1.8, color: 0x4a90d9 },
  { name: '中东 Middle East', nameZh: '中东', z: 3.6, color: 0xd4a040 },
  { name: '印度 India', nameZh: '印度', z: 5.4, color: 0xe08830 },
  { name: '美洲 Americas', nameZh: '美洲', z: 7.2, color: 0x48a060 },
];

function yearToX(y) { return y / 100; }
function xToYear(x) { return Math.round(x * 100); }

// ---- Floor grid with time markings ----
const floorGeo = new THREE.PlaneGeometry(70, 16);
const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.7 }));
floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.05, 1.5);
floor.receiveShadow = true;
scene.add(floor);

// Century markers on the floor
const rulerGroup = new THREE.Group();
for (let year = -3500; year <= 2025; year += 100) {
  const x = yearToX(year);
  const isMilestone = year % 500 === 0;
  const h = isMilestone ? 0.4 : 0.2;
  const pole = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, h, 0.03),
    new THREE.MeshStandardMaterial({ color: isMilestone ? 0x666688 : 0x333355, roughness: 0.5 })
  );
  pole.position.set(x, h / 2, -0.2);
  rulerGroup.add(pole);
}
scene.add(rulerGroup);

// Time axis line
const timeLineGeo = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-36, 0.01, -0.2), new THREE.Vector3(21, 0.01, -0.2),
]);
scene.add(new THREE.Line(timeLineGeo, new THREE.LineBasicMaterial({ color: 0x444466, transparent: true, opacity: 0.5 })));

// ---- Data: Dynasties / Periods ----
// [nameZh, startYear, endYear, trackZ, color, description]
const dynasties = [
  // China
  ['夏', -2070, -1600, 0, 0xc97a6a, '传说中中国第一个世袭制朝代'],
  ['商', -1600, -1046, 0, 0xd47660, '青铜文明 · 甲骨文'],
  ['周', -1046, -256, 0, 0xd07050, '分封制 · 诸子百家'],
  ['秦', -221, -206, 0, 0xcc4020, '首次大一统 · 书同文车同轨'],
  ['汉', -206, 220, 0, 0xd44830, '丝绸之路 · 造纸术'],
  ['三国两晋', 220, 420, 0, 0xc86050, '分裂时期'],
  ['南北朝', 420, 589, 0, 0xc06050, '佛教传入 · 民族融合'],
  ['隋', 581, 618, 0, 0xd05040, '大运河 · 科举制'],
  ['唐', 618, 907, 0, 0xcc3020, '黄金时代 · 唐诗 · 长安'],
  ['宋', 960, 1279, 0, 0xd44830, '活字印刷 · 火药 · 经济巅峰'],
  ['元', 1271, 1368, 0, 0xc05040, '蒙古帝国 · 马可波罗'],
  ['明', 1368, 1644, 0, 0xd44830, '郑和下西洋 · 紫禁城'],
  ['清', 1644, 1912, 0, 0xc45040, '最后王朝'],
  ['民国', 1912, 1949, 0, 0xcc4422, '辛亥革命'],
  ['新中国', 1949, 2025, 0, 0xdd1111, '中华人民共和国'],
  // Europe
  ['古希腊', -800, -146, 1.8, 0x5588cc, '民主制 · 哲学 · 奥林匹克'],
  ['罗马共和国', -509, -27, 1.8, 0x4a7db8, '元老院 · 法律体系'],
  ['罗马帝国', -27, 476, 1.8, 0x4070aa, '凯撒 · 万神殿'],
  ['中世纪', 476, 1400, 1.8, 0x3a6090, '封建制度 · 十字军'],
  ['文艺复兴', 1400, 1600, 1.8, 0x5088cc, '达芬奇 · 米开朗基罗'],
  ['启蒙时代', 1600, 1800, 1.8, 0x6098dd, '科学革命 · 伏尔泰'],
  ['工业革命', 1760, 1900, 1.8, 0x4a80c0, '蒸汽机 · 城市化'],
  ['现代欧洲', 1900, 2025, 1.8, 0x5588dd, '欧盟'],
  // Middle East
  ['古埃及', -3100, -30, 3.6, 0xddb040, '金字塔 · 象形文字'],
  ['两河流域', -3500, -539, 3.6, 0xd4a030, '苏美尔 · 巴比伦 · 楔形文字'],
  ['波斯帝国', -550, -330, 3.6, 0xcc9020, '居鲁士 · 大流士'],
  ['伊斯兰黄金', 750, 1258, 3.6, 0xddb050, '代数 · 医学 · 天文学'],
  ['奥斯曼帝国', 1299, 1922, 3.6, 0xc89030, '横跨欧亚非'],
  // India
  ['印度河文明', -3300, -1300, 5.4, 0xe89040, '最早的城市文明之一'],
  ['吠陀时期', -1500, -500, 5.4, 0xe08030, '印度教起源'],
  ['孔雀王朝', -322, -185, 5.4, 0xe89040, '阿育王 · 佛教传播'],
  ['笈多王朝', 320, 550, 5.4, 0xe08030, '印度黄金时代 · 零的发明'],
  ['莫卧儿帝国', 1526, 1857, 5.4, 0xe89040, '泰姬陵'],
  ['英属印度', 1858, 1947, 5.4, 0xd07030, '殖民地时期'],
  ['印度共和国', 1947, 2025, 5.4, 0xff6600, '独立'],
  // Americas
  ['奥尔梅克', -1500, -400, 7.2, 0x50a068, '中美洲母文明'],
  ['玛雅', -2000, 1500, 7.2, 0x48a060, '金字塔 · 历法 · 文字'],
  ['阿兹特克', 1345, 1521, 7.2, 0x509850, '特诺奇蒂特兰'],
  ['印加', 1438, 1533, 7.2, 0x58a868, '马丘比丘 · 道路系统'],
  ['殖民时期', 1492, 1800, 7.2, 0x408050, '哥伦布 · 殖民地'],
  ['美国', 1776, 2025, 7.2, 0x4488cc, '独立宣言 · 超级大国'],
];

// Key events [nameZh, year, trackZ, color]
const events = [
  ['孔子', -551, 0, 0xffcc88], ['孙子兵法', -500, 0, 0xffcc88],
  ['焚书坑儒', -213, 0, 0xff8866], ['蔡伦造纸', 105, 0, 0xffdd88],
  ['张骞出使西域', -138, 0, 0xffdd88], ['贞观之治', 627, 0, 0xffcc88],
  ['安史之乱', 755, 0, 0xff8866], ['岳飞抗金', 1140, 0, 0xff8866],
  ['郑和下西洋', 1405, 0, 0xffdd88], ['鸦片战争', 1840, 0, 0xff6666],

  ['苏格拉底', -399, 1.8, 0x88ccff], ['亚历山大', -336, 1.8, 0x88ccff],
  ['凯撒遇刺', -44, 1.8, 0x88ddff], ['君士坦丁堡', 330, 1.8, 0x88ccff],
  ['查士丁尼法典', 529, 1.8, 0x88ccff], ['黑死病', 1347, 1.8, 0xff8888],
  ['古腾堡印刷', 1440, 1.8, 0x88ddff], ['哥伦布', 1492, 1.8, 0x88ddff],
  ['法国大革命', 1789, 1.8, 0xff9966], ['第一次世界大战', 1914, 1.8, 0xff6666],
  ['第二次世界大战', 1939, 1.8, 0xff4444], ['登月', 1969, 1.8, 0x88ddff],

  ['胡夫金字塔', -2560, 3.6, 0xffdd88], ['汉谟拉比法典', -1750, 3.6, 0xffdd88],
  ['巴比伦之囚', -586, 3.6, 0xff8866], ['智慧宫', 830, 3.6, 0xffdd88],
  ['十字军东征', 1096, 3.6, 0xff8866],

  ['佛陀诞生', -563, 5.4, 0xffcc88], ['阿育王皈依', -260, 5.4, 0xffcc88],
  ['泰姬陵建成', 1653, 5.4, 0xffdd88], ['甘地非暴力', 1930, 5.4, 0xffcc88],

  ['玛雅历法', 250, 7.2, 0x88dd88], ['马丘比丘', 1450, 7.2, 0x88dd88],
  ['美国独立', 1776, 7.2, 0x88ccff], ['南北战争', 1861, 7.2, 0xff8866],
];

// ---- Build 3D scene ----
const timelineGroup = new THREE.Group();
scene.add(timelineGroup);
const allBars = []; // for raycaster

// Track labels (floating text using small spheres as markers)
tracks.forEach(t => {
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshBasicMaterial({ color: t.color }));
  marker.position.set(-36.5, 0.4, t.z);
  timelineGroup.add(marker);
});

// Dynasty bars
dynasties.forEach(d => {
  const [name, start, end, z, color, desc] = d;
  const x1 = yearToX(start), x2 = yearToX(end);
  const w = Math.max(0.15, x2 - x1);
  const cx = (x1 + x2) / 2;
  const barGeo = new THREE.BoxGeometry(w, 0.3, 0.9);
  const bar = new THREE.Mesh(barGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1 }));
  bar.position.set(cx, 0.15, z);
  bar.castShadow = true; bar.receiveShadow = true;
  bar.userData = { name, start, end, desc, color, type: 'dynasty' };
  bar.name = name;
  timelineGroup.add(bar);
  allBars.push(bar);

  // Thin connector line from bar to track center
  const connGeo = new THREE.BoxGeometry(w, 0.03, 0.03);
  const conn = new THREE.Mesh(connGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
  conn.position.set(cx, 0.02, z);
  timelineGroup.add(conn);
});

// Event pillars
events.forEach(e => {
  const [name, year, z, color] = e;
  const x = yearToX(year);
  const pillarGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.8, 8);
  const pillar = new THREE.Mesh(pillarGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.2, emissive: color, emissiveIntensity: 0.3 }));
  pillar.position.set(x, 0.4, z);
  pillar.castShadow = true;
  pillar.userData = { name, year, desc: '', color, type: 'event' };
  pillar.name = name;
  timelineGroup.add(pillar);
  allBars.push(pillar);

  // Small sphere on top
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8),
    new THREE.MeshBasicMaterial({ color }));
  top.position.set(x, 0.85, z);
  timelineGroup.add(top);
});

// Track separator lines (thin lines running along time axis at each Z)
tracks.forEach(t => {
  const segs = [];
  for (let y = -35; y <= 21; y += 5) {
    segs.push(new THREE.Vector3(y, 0.01, t.z));
  }
  const lineGeo = new THREE.BufferGeometry().setFromPoints(segs);
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: t.color, transparent: true, opacity: 0.2 }));
  timelineGroup.add(line);
});

// ---- Raycaster interaction ----
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const popup = document.getElementById('info-popup');
let hoveredObj = null;

renderer.domElement.addEventListener('mousemove', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(allBars);
  if (hits.length > 0) {
    const obj = hits[0].object;
    if (obj !== hoveredObj) {
      hoveredObj = obj;
      const d = obj.userData;
      if (d && d.name) {
        popup.innerHTML = `
          <div class="pop-title" style="color:#${d.color?.toString(16).padStart(6,'0')}">${d.name}</div>
          <div class="pop-date">${d.type === 'dynasty' ? d.start + ' — ' + d.end : d.year + '年'}</div>
          ${d.desc ? '<div class="pop-desc">' + d.desc + '</div>' : ''}
        `;
        popup.classList.add('show');
        popup.style.left = (e.clientX + 20) + 'px';
        popup.style.top = (e.clientY - 30) + 'px';
        document.body.style.cursor = 'pointer';
      }
    }
  } else if (hoveredObj) {
    hoveredObj = null;
    popup.classList.remove('show');
    document.body.style.cursor = 'grab';
  }
});

// ---- Time indicator ----
const timeInd = document.getElementById('time-indicator');
function updateTimeIndicator() {
  const cx = controls.target.x;
  const yr = xToYear(cx);
  const era = yr < 0 ? '公元前 ' + (-yr) + ' 年' : '公元 ' + yr + ' 年';
  timeInd.textContent = '📅 ' + era + ' | 🖱 滚动时间轴看历史对比';
}

// ---- Jump buttons ----
document.querySelectorAll('.jump-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetX = parseFloat(btn.dataset.x);
    controls.target.set(targetX, 0, 2.5);
    controls.update();
  });
});

// ---- Resize ----
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// ---- Animate ----
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateTimeIndicator();
  renderer.render(scene, camera);
}
animate();
