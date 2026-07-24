/* Site Analyzer — V2 Unequal-Bay 4-Bay House */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, ROOF_H, EAVE_H, ROOF_PITCH, WALL_T, INT_WALL_T, BAY_WIDTHS, BAY_X, BAY_CX, BAY_COUNT, HW2, HD2, FLOOR_H, BAND_Y, BASE_H, CROSS_Z_FRONT, CROSS_Z_BACK, DEPTH_FRONT, DEPTH_CORRIDOR, DEPTH_BACK } from '../config.js';

export function analyzeSite(parts, PART_DEFS) {
  const report = {};

  report.footprint = {
    width: HOUSE_W, depth: HOUSE_D,
    groundH: WALL_H1, upperH: WALL_H2,
    roofPeak: ROOF_H, eaveH: EAVE_H, roofPitch: ROOF_PITCH,
    baseH: BASE_H,
    bayWidths: BAY_WIDTHS,
    depthLayout: `${DEPTH_FRONT.toFixed(1)}m前房 + ${DEPTH_CORRIDOR.toFixed(1)}m走廊 + ${DEPTH_BACK.toFixed(1)}m后房`,
  };

  report.bays = [];
  for (let b = 0; b < BAY_COUNT; b++) {
    report.bays.push({
      name: `开间${b + 1}`,
      width: BAY_WIDTHS[b],
      center: BAY_CX[b],
      xRange: [BAY_X[b], BAY_X[b + 1]],
      frontRoom: { zRange: [CROSS_Z_FRONT, HD2], area: (HD2 - CROSS_Z_FRONT) * BAY_WIDTHS[b] },
      corridor:  { zRange: [CROSS_Z_BACK, CROSS_Z_FRONT], area: (CROSS_Z_FRONT - CROSS_Z_BACK) * BAY_WIDTHS[b] },
      backRoom:  { zRange: [-HD2, CROSS_Z_BACK], area: (CROSS_Z_BACK + HD2) * BAY_WIDTHS[b] },
    });
  }

  report.structure = {
    exteriorWalls: [
      { name: '前墙', pos: `z=${HD2.toFixed(1)}` },
      { name: '后墙', pos: `z=${-HD2.toFixed(1)}` },
      { name: '左墙', pos: `x=${-HW2.toFixed(1)}` },
      { name: '右墙', pos: `x=${HW2.toFixed(1)}` },
    ],
    interiorWalls: [
      `纵墙 x=${BAY_X.slice(1, -1).join(', ')} (${BAY_COUNT - 1}道不等距)`,
      `前走廊墙 z=${CROSS_Z_FRONT.toFixed(1)}, 后走廊墙 z=${CROSS_Z_BACK.toFixed(1)}`,
    ],
    columns: `10根 — 前${BAY_COUNT + 1}根 + 后${BAY_COUNT + 1}根 (不等距)`,
  };

  report.zones = [
    { name: '老人房',   floor: '1F', bay: 1, area: '前房', desc: '朝南☀️, 西梢间' },
    { name: '次卧1F',   floor: '1F', bay: 2, area: '前房', desc: '朝南☀️, 次间' },
    { name: '堂屋',     floor: '1F', bay: 3, area: '前房', desc: '朝南☀️, 明间5m宽' },
    { name: '储藏',     floor: '1F', bay: 4, area: '前房', desc: '东梢间, 靠路隔音' },
    { name: '书房',     floor: '1F', bay: 1, area: '后房', desc: '安静🌙' },
    { name: '卫生间1F', floor: '1F', bay: 2, area: '后房', desc: '夹在楼梯旁' },
    { name: '厨房',     floor: '1F', bay: 3, area: '后房', desc: '东厨, 灶王位' },
    { name: '餐厅',     floor: '1F', bay: 4, area: '后房', desc: '临后门' },
    { name: '儿童房1',  floor: '2F', bay: 1, area: '前房', desc: '朝南☀️' },
    { name: '次卧2F',   floor: '2F', bay: 2, area: '前房', desc: '朝南☀️' },
    { name: '主卧',     floor: '2F', bay: 3, area: '前房', desc: '朝南☀️, 明间5m' },
    { name: '杂物间',   floor: '2F', bay: 4, area: '前房', desc: '朝南☀️' },
    { name: '儿童房2',  floor: '2F', bay: 1, area: '后房', desc: '安静🌙' },
    { name: '卫生间2F', floor: '2F', bay: 2, area: '后房', desc: '夹在楼梯旁' },
    { name: '起居厅',   floor: '2F', bay: 3, area: '后房', desc: '休闲' },
    { name: '走廊',     floor: '1F', bay: 0, area: '走廊', desc: '1.5m宽通廊, 连通四开间' },
    { name: '走廊',     floor: '2F', bay: 0, area: '走廊', desc: '1.5m宽通廊' },
  ];

  report.ventilation = '石基北6孔(冷进气) + 南6孔(热排气)';
  report.orientation = '坐北朝南，东侧上坡马路';
  report.climate = '大别山北亚热带，冬冷夏热，低层高保温+接地通风';

  const bayLabels = report.bays.map(b => `${b.name}(${b.xRange[0]}→${b.xRange[1]}, ${b.width}m)`).join(' | ');
  console.group('%c📍 Site Analysis — V2 Unequal-Bay House', 'color:#4af; font-size:14px;');
  console.log('%cFootprint:%c %dm × %dm, 1F=%dm, 2F=%dm, Base=%dm, Roof=%.1fm (%.0f°)',
    'color:#aaa;', '', HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, BASE_H, ROOF_H, ROOF_PITCH);
  console.log('%cDepth:%c %s', 'color:#aaa;', '', report.footprint.depthLayout);
  console.log('%c4 Unequal Bays:%c %s', 'color:#aaa;', '', bayLabels);
  console.log('%cCross Walls:%c z=%s (前走廊), z=%s (后走廊)', 'color:#aaa;', '', CROSS_Z_FRONT, CROSS_Z_BACK);
  console.log('%cZones:%c 1F:老人房·次卧1F·堂屋·储藏·书房·卫1F·厨房·餐厅 | 2F:主卧·次卧2F·儿童房×2·杂物间·卫2F·起居厅',
    'color:#aaa;', '');
  console.log('%cClimate:%c 大别山·低层高保温(%.1f+%.1fm)·石基通风道·坡顶%.0f°',
    'color:#aaa;', '', WALL_H1, WALL_H2, ROOF_PITCH);
  console.log('%cLight:%c 前窗×4朝南☀️ · 后窗×3朝北🌥️ · 二层窗×8', 'color:#aaa;', '');
  console.log('%cDoors:%c 前门明间(堂屋)·后门东梢(餐厅)', 'color:#aaa;', '');
  console.log('%cVentilation:%c 北6冷进气+南6热排气 (石基穿孔)', 'color:#aaa;', '');
  console.groupEnd();

  return report;
}
