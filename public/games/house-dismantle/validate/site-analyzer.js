/* Site Analyzer — 4-Bay Dabie Mountain House */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, ROOF_H, EAVE_H, ROOF_PITCH, WALL_T, INT_WALL_T, BAY_W, BAY_COUNT, HW2, HD2, FLOOR_H, BAND_Y, BASE_H } from '../config.js';

export function analyzeSite(parts, PART_DEFS) {
  const report = {};

  report.footprint = { width: HOUSE_W, depth: HOUSE_D, groundH: WALL_H1, upperH: WALL_H2, roofPeak: ROOF_H, eaveH: EAVE_H, roofPitch: ROOF_PITCH, baseH: BASE_H, bayW: BAY_W, bayCount: BAY_COUNT };

  const crossZ = 0;
  report.bays = [];
  for (let b = 0; b < BAY_COUNT; b++) {
    const bx = -HW2 + b * BAY_W + BAY_W / 2;
    report.bays.push({
      name: `开间${b + 1}`,
      center: bx,
      xRange: [-HW2 + b * BAY_W, -HW2 + (b + 1) * BAY_W],
      front: { zRange: [crossZ, HD2], area: (HD2 - crossZ) * BAY_W },
      back: { zRange: [-HD2, crossZ], area: (HD2 + crossZ) * BAY_W },
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
      `间隔 x=-4, 0, 4 (${BAY_COUNT - 1}道纵墙)`,
      `前后隔墙 z=${crossZ}，4门洞`,
    ],
    columns: '14根 — 前5+后5+中4(楼梯处跳过x=0)',
  };

  report.zones = [
    { name: '老人房1', floor: '1F', bay: 1, area: '前', desc: '朝南☀️' },
    { name: '老人房2', floor: '1F', bay: 2, area: '前', desc: '朝南☀️' },
    { name: '客厅', floor: '1F', bay: 3, area: '前', desc: '朝南☀️, 主入口' },
    { name: '厨房', floor: '1F', bay: 4, area: '前', desc: '靠东临路,隔音' },
    { name: '餐厅', floor: '1F', bay: 1, area: '后' },
    { name: '楼梯间+卫1', floor: '1F', bay: 2, area: '后' },
    { name: '堂屋(过厅)', floor: '1F', bay: 3, area: '后' },
    { name: '卫2+储藏', floor: '1F', bay: 4, area: '后' },
    { name: '主卧', floor: '2F', bay: 1, area: '前', desc: '朝南☀️' },
    { name: '次卧', floor: '2F', bay: 2, area: '前', desc: '朝南☀️' },
    { name: '书房', floor: '2F', bay: 3, area: '前', desc: '朝南☀️' },
    { name: '儿童房1', floor: '2F', bay: 4, area: '前', desc: '朝南☀️' },
    { name: '儿童房2', floor: '2F', bay: 1, area: '后' },
    { name: '卫3+走廊', floor: '2F', bay: 2, area: '后' },
    { name: '走廊', floor: '2F', bay: 3, area: '后' },
    { name: '卫4+走廊', floor: '2F', bay: 4, area: '后' },
  ];

  report.ventilation = '石基北6孔(冷进气) + 南6孔(热排气)';
  report.orientation = '坐北朝南，东侧上坡马路';
  report.climate = '大别山北亚热带，冬冷夏热，低层高保温+接地通风';

  const bayLabels = report.bays.map(b => `${b.name}(${b.xRange[0]}→${b.xRange[1]})`).join(' | ');
  console.group('%c📍 Site Analysis — Dabie Mountain 4-Bay House', 'color:#4af; font-size:14px;');
  console.log('%cFootprint:%c %dm × %dm, GF=%dm, UF=%dm, Base=%dm, Roof=%.1fm (%.0f°)',
    'color:#aaa;', '', HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, BASE_H, ROOF_H, ROOF_PITCH);
  console.log('%c4 Bays:%c %s, crossWall @ z=%d', 'color:#aaa;', '', bayLabels, crossZ);
  console.log('%cZones:%c 1F:老人房×2·客厅·厨房·餐厅·卫×2 | 2F:主卧·次卧·书房·儿童房×2·卫×2', 'color:#aaa;', '');
  console.log('%cClimate:%c 大别山·低层高保温(2.6+2.5m)·石基通风道·坡顶%.0f°',
    'color:#aaa;', '', ROOF_PITCH);
  console.log('%cLight:%c 前窗×4朝南☀️ · 后窗×4朝北🌥️ · 二层窗×8', 'color:#aaa;', '');
  console.log('%cDoors:%c 前门厅(中偏右)·后门厨房(东)', 'color:#aaa;', '');
  console.log('%cVentilation:%c 北6冷进气+南6热排气 (石基穿孔)', 'color:#aaa;', '');
  console.groupEnd();

  return report;
}
