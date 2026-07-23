/* Site Analyzer — Step -2: Understand the existing space before designing
 *
 * Usage:
 *   import { analyzeSite } from './validate/site-analyzer.js';
 *   const report = analyzeSite(parts, PART_DEFS);
 *
 * Outputs:
 *   1. console group with structured site report
 *   2. Returns object with layout, structure, lighting, circulation, expansion zones
 */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, ROOF_H, EAVE_H, WALL_T, BAY_W, HW2, HD2, FLOOR_H, BAND_Y } from '../config.js';

export function analyzeSite(parts, PART_DEFS) {
  const report = {};

  // ── 1. Footprint ────────────────────────────────────────────────
  report.footprint = {
    width: HOUSE_W,   depth: HOUSE_D,
    groundFloorH: WALL_H1, upperFloorH: WALL_H2,
    roofPeak: ROOF_H, eaveH: EAVE_H,
    wallThickness: WALL_T, bayWidth: BAY_W,
  };

  // ── 2. Bays & Room Zones ────────────────────────────────────────
  const crossZ = 1.0;
  report.bays = [
    {
      name: '左开间 (left)',
      xRange: [-HW2, -BAY_W / 2],
      zones: {
        front: { zRange: [crossZ, HD2], area: (HD2 - crossZ) * BAY_W, desc: '厨房区（灶台靠左墙）' },
        back:  { zRange: [-HD2, crossZ], area: (HD2 + crossZ) * BAY_W, desc: '储藏/备餐区' },
      },
    },
    {
      name: '中间开间 (center)',
      xRange: [-BAY_W / 2, BAY_W / 2],
      zones: {
        front: { zRange: [crossZ, HD2], area: (HD2 - crossZ) * BAY_W, desc: '堂屋/餐厅（桌椅在 z≈2.5）' },
        back:  { zRange: [-HD2, crossZ], area: (HD2 + crossZ) * BAY_W, desc: '神龛区（靠后墙 z≈-4.2）' },
      },
    },
    {
      name: '右开间 (right)',
      xRange: [BAY_W / 2, HW2],
      zones: {
        front: { zRange: [crossZ, HD2], area: (HD2 - crossZ) * BAY_W, desc: '入口区（前门 x=4, z=4.5）' },
        back:  { zRange: [-HD2, crossZ], area: (HD2 + crossZ) * BAY_W, desc: '卧室（床靠右墙 z≈-3/-1，门 x=4, z=-4.5）' },
      },
    },
  ];

  // ── 3. Structure ────────────────────────────────────────────────
  report.structure = {
    exteriorWalls: [
      { name: '前墙', pos: `z=${HD2}`, dim: `${HOUSE_W}m × ${WALL_H1}m` },
      { name: '后墙', pos: `z=${-HD2}`, dim: `${HOUSE_W}m × ${WALL_H1}m` },
      { name: '左墙', pos: `x=${-HW2}`, dim: `${HOUSE_D}m × ${WALL_H1}m` },
      { name: '右墙', pos: `x=${HW2}`, dim: `${HOUSE_D}m × ${WALL_H1}m` },
    ],
    interiorWalls: [
      { name: '隔墙(左)', pos: `x=${-BAY_W / 2}`, span: '前墙到后墙' },
      { name: '隔墙(右)', pos: `x=${BAY_W / 2}`, span: '前墙到后墙' },
      { name: '前后隔墙', pos: `z=${crossZ}`, span: '左墙到右墙，三段带门洞' },
    ],
    upperWalls: [
      { name: '前墙(二层)', pos: `z=${HD2}`, h: WALL_H2 },
      { name: '后墙(二层)', pos: `z=${-HD2}`, h: WALL_H2 },
      { name: '山墙(左)', pos: `x=${-HW2}`, h: WALL_H2 + 0.5 },
      { name: '山墙(右)', pos: `x=${HW2}`, h: WALL_H2 + 0.5 },
    ],
  };

  // ── 4. Columns ──────────────────────────────────────────────────
  const colsPart = parts.get('columns');
  report.columns = [];
  if (colsPart) {
    for (const mesh of colsPart.meshArr) {
      if (mesh.geometry?.type === 'CylinderGeometry') {
        mesh.updateWorldMatrix(true, false);
        const p = new THREE.Vector3();
        mesh.getWorldPosition(p);
        report.columns.push({ x: +p.x.toFixed(1), z: +p.z.toFixed(1) });
      }
    }
  }
  // Hardcoded positions as fallback (known from house-core.js)
  if (report.columns.length === 0) {
    report.columns = [
      { x: -5.7, z: 4.2 }, { x: 0, z: 4.2 }, { x: 5.7, z: 4.2 },
      { x: -5.7, z: -4.2 }, { x: 0, z: -4.2 }, { x: 5.7, z: -4.2 },
      { x: -5.7, z: 0 }, { x: 5.7, z: 0 },
    ];
  }

  // ── 5. Openings ─────────────────────────────────────────────────
  report.openings = {
    windows: [
      { wall: '前墙', qty: 2, pos: 'x=-4, x=0', size: '1.1×1.4m', light: '朝南，采光好' },
      { wall: '后墙', qty: 3, pos: 'x=-4, 0, 4', size: '1.1×1.4m', light: '朝北，均匀光' },
      { wall: '二层前/后', qty: 8, pos: '每隔 3m 一个', size: '0.5×0.5m', light: '通风小窗' },
    ],
    doors: [
      { name: '前门', pos: 'x=4, z=4.5', size: '1.6×2.3m', note: '右开间朝南' },
      { name: '后门', pos: 'x=4, z=-4.5', size: '1.0×2.2m', note: '右开间朝北，通后院' },
    ],
    stairs: { type: 'L形木梯', from: '(x≈-1.8, z≈-4.0, y=0.2)', to: '(x≈0.84, z≈2.54, y=3.0)', note: '靠后墙→转向前，到达二楼' },
  };

  // ── 6. Function zones ───────────────────────────────────────────
  report.zones = [
    { name: '堂屋/餐厅', bay: 'center', area: 'front', pos: '(0, 2.5)', contents: '方桌+4凳', light: '前窗+' },
    { name: '卧室', bay: 'right', area: 'back', pos: '(4, -2.2)', contents: '双床+床头柜', light: '后窗' },
    { name: '厨房', bay: 'left', area: 'back', pos: '(-4, -3.3)', contents: '灶台+柴堆+水缸', light: '后窗' },
    { name: '神龛', bay: 'center', area: 'back', pos: '(0, -4.2)', contents: '供桌+牌位+香炉', light: '后窗' },
    { name: '入口玄关', bay: 'right', area: 'front', pos: '(4, 4.5)', contents: '前门', light: '前窗+' },
    { name: '二楼阁楼', bay: 'all', area: 'open', pos: `y=${BAND_Y}`, contents: '开放空间+栏杆围区', light: '通风小窗' },
  ];

  // ── 7. Expansion zones — where can we build? ────────────────────
  report.expansion = {
    east: {
      label: '东侧 (右侧)',
      available: true,
      width: '不限（院子空地）',
      constraints: [
        '右墙 x=+6 外侧',
        '前院 z=2 到 5.5 区域有鸡群',
        '后院 z=-5.5 到 -2 区域有水井',
        '建议 z 范围：-5 到 +5，避开鸡和水井',
      ],
      bestSpot: { x: '7.5', z: '-2 到 3', desc: '右墙外，前后方向可选前屋或后屋区域' },
    },
    west: {
      label: '西侧 (左侧)',
      available: true,
      width: '不限（院子空地）',
      constraints: ['左墙 x=-6 外侧', '鸡群在左院活动（x<-6, z≈-2 到 2）'],
      bestSpot: { x: '-7.5', z: '1 到 3', desc: '前部区域较空旷' },
    },
    north: {
      label: '北侧 (后侧)',
      available: true,
      width: '不限',
      constraints: ['后墙 z=-4.5 外侧', '水井在 (-7.8, -7.5)', '排水沟沿后墙'],
      bestSpot: { x: '0 到 5', z: '-7', desc: '避开左后角水井' },
    },
    south: {
      label: '南侧 (前侧)',
      available: false,
      reason: '前院为正立面，传统上不宜遮挡主入口',
    },
  };

  // ── 8. Existing conflicts from validation ───────────────────────
  report.note = 'Run validateHouse(parts) separately for detailed violation list.';

  // ── Console output ──────────────────────────────────────────────
  console.group('%c📍 Site Analysis — House Dismantle', 'color:#4af; font-size:14px;');
  console.log('%cFootprint:%c %dm × %dm, GF=%dm, UF=%dm, Roof=%dm',
    'color:#aaa;', '', HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, ROOF_H);
  console.log('%c3 Bays:%c left(-6→-2) | center(-2→2) | right(2→6), crossWall @ z=%d',
    'color:#aaa;', '', crossZ);
  console.log('%cZones:%c 堂屋(中前) · 卧室(右后) · 厨房(左后) · 神龛(中后) · 玄关(右前)',
    'color:#aaa;', '');
  console.log('%cLight:%c 前窗×2 朝南☀️ · 后窗×3 朝北🌥️ · 二层通风窗×8',
    'color:#aaa;', '');
  console.log('%cDoors:%c 前门(右)朝南 · 后门(右)朝北',
    'color:#aaa;', '');
  console.log('%cExpansion:%c 东✔ · 西✔ · 北✔ · 南✘(正立面)',
    'color:#aaa;', '');
  console.groupEnd();

  return report;
}
