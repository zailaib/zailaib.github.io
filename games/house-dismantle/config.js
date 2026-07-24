/* House Dismantle  Configuration & Part Registry
   Dabie Mountain 4-bay 2-story house */

import * as THREE from 'three';

// ── Dimensions (meters, 1 unit = 1m) ──────────────────────────────
export const BAY_COUNT = 4;
export const BAY_W = 4; // legacy: avg bay width for validate rules
export const BAY_WIDTHS = [3, 4.5, 5, 3.5]; // 梢/次/明/梢 不等宽
export const BAY_X = []; // bay boundaries: -8, -5, -0.5, 4.5, 8
let bx = -8; for (const w of BAY_WIDTHS) { BAY_X.push(bx); bx += w; } BAY_X.push(bx);
export const BAY_CX = BAY_WIDTHS.map((w, i) => BAY_X[i] + w/2); // bay centers
export const HOUSE_W = 16;
export const HOUSE_D = 9;
export const DEPTH_FRONT = 4;    // 前房进深
export const DEPTH_CORRIDOR = 1.5; // 走廊宽
export const DEPTH_BACK = 3.5;   // 后房进深
export const WALL_H1 = 2.6;
export const WALL_H2 = 2.5;
export const BASE_H  = 0.55;
export const FLOOR_H = BASE_H;
export const ROOF_PITCH = 28;
export const ROOF_RISE = Math.tan(ROOF_PITCH * Math.PI / 180) * (HOUSE_D / 2);
export const EAVE_H  = FLOOR_H + WALL_H1 + WALL_H2;
export const ROOF_H  = EAVE_H + ROOF_RISE;
export const WALL_T  = 0.24;
export const INT_WALL_T = 0.15;
export const ROOF_OH = 1.0;
export const HW2 = HOUSE_W / 2; // 8
export const HD2 = HOUSE_D / 2; // 4.5
export const WY1 = WALL_H1 / 2 + FLOOR_H; // 1.85
export const WY2 = WALL_H1 + WALL_H2 / 2 + FLOOR_H; // 4.40
export const BAND_Y = WALL_H1 + FLOOR_H; // 3.15

// Cross wall Z positions
export const CROSS_Z_FRONT = HD2 - DEPTH_FRONT; // +0.5  前走廊墙
export const CROSS_Z_BACK  = HD2 - DEPTH_FRONT - DEPTH_CORRIDOR; // -1.0 后走廊墙

// ── Materials ─────────────────────────────────────────────────────
export const MATS = {
  // Structure
  roofTile:    new THREE.MeshStandardMaterial({ color: 0x4a4a5a, roughness: 0.7, metalness: 0.05, side: THREE.DoubleSide }),
  roofFrame:   new THREE.MeshStandardMaterial({ color: 0x5a3a28, roughness: 0.6, metalness: 0.0 }),
  wall:        new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.8, metalness: 0.0 }),
  upperWall:   new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.8, metalness: 0.0 }), // unified with wall
  interior:    new THREE.MeshStandardMaterial({ color: 0xede6d8, roughness: 0.8, metalness: 0.0 }),
  floor:       new THREE.MeshStandardMaterial({ color: 0x908878, roughness: 0.7, metalness: 0.05 }),
  column:      new THREE.MeshStandardMaterial({ color: 0xb8b8b8, roughness: 0.35, metalness: 0.05 }),
  concreteFloor: new THREE.MeshStandardMaterial({ color: 0xc8c0b8, roughness: 0.5, metalness: 0.05 }),
  ridge:       new THREE.MeshStandardMaterial({ color: 0x3a3a48, roughness: 0.6, metalness: 0.05 }),
  band:        new THREE.MeshStandardMaterial({ color: 0x5a4a38, roughness: 0.5, metalness: 0.05 }),
  base:        new THREE.MeshStandardMaterial({ color: 0x6e6e6e, roughness: 0.75, metalness: 0.05 }),
  baseDark:    new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, metalness: 0 }),
  cornerStone: new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7, metalness: 0.05 }),
  // Doors & Windows
  door:        new THREE.MeshStandardMaterial({ color: 0x4a2818, roughness: 0.5, metalness: 0.0 }),
  doorPanel:   new THREE.MeshStandardMaterial({ color: 0x5a3020, roughness: 0.4, metalness: 0.05 }),
  window:      new THREE.MeshStandardMaterial({ color: 0x5a3828, roughness: 0.4, metalness: 0.0, emissive: 0x331100, emissiveIntensity: 0.3 }),
  interiorDoor:new THREE.MeshStandardMaterial({ color: 0x6b4830, roughness: 0.5, metalness: 0.0 }),
  // Furniture
  wood:        new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.55, metalness: 0.0 }),
  woodDark:    new THREE.MeshStandardMaterial({ color: 0x6b4a20, roughness: 0.5, metalness: 0.0 }),
  woodLight:   new THREE.MeshStandardMaterial({ color: 0xa07830, roughness: 0.5, metalness: 0.0 }),
  bedFrame:    new THREE.MeshStandardMaterial({ color: 0x7a4a20, roughness: 0.45, metalness: 0.0 }),
  bedMat:      new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.85, metalness: 0.0 }),
  mattress:    new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.9, metalness: 0.0 }),
  stoveBrick:  new THREE.MeshStandardMaterial({ color: 0x8b5a3a, roughness: 0.85, metalness: 0.0 }),
  stoveDark:   new THREE.MeshStandardMaterial({ color: 0x5a3a28, roughness: 0.8, metalness: 0.0 }),
  wokMetal:    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.3, metalness: 0.8 }),
  // Plumbing
  pipe:        new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.4, metalness: 0.6 }),
  pipeJoint:   new THREE.MeshStandardMaterial({ color: 0x7a5c3e, roughness: 0.35, metalness: 0.7 }),
  // Grain
  grainSack:   new THREE.MeshStandardMaterial({ color: 0xc8b078, roughness: 0.8, metalness: 0.0 }),
  grainMat:    new THREE.MeshStandardMaterial({ color: 0x9b8030, roughness: 0.7, metalness: 0.0 }),
};

// ── Part Registry ─────────────────────────────────────────────────
export const PART_DEFS = [
  { name: 'base',        label: '石基平台',   color: '#6e6e6e', deps: [] },
  { name: 'ventDucts',   label: '接地通风道', color: '#555555', deps: [] },
  { name: 'floor',       label: '一层地板',   color: '#908878', deps: [] },
  { name: 'floor2',      label: '二层楼板',   color: '#c0b8a8', deps: [] },
  { name: 'columns',     label: '水泥柱',     color: '#b0b0b0', deps: [] },
  { name: 'wallFront',   label: '前墙(一层)', color: '#f2ece0', deps: [] },
  { name: 'wallBack',    label: '后墙(一层)', color: '#f2ece0', deps: [] },
  { name: 'wallLeft',    label: '左墙(一层)', color: '#f2ece0', deps: [] },
  { name: 'wallRight',   label: '右墙(一层)', color: '#f2ece0', deps: [] },
  { name: 'interiorWalls', label: '一层内隔墙', color: '#ede6d8', deps: [] },
  { name: 'upperWallFront', label: '前墙(二层)', color: '#f2ece0', deps: [] },
  { name: 'upperWallBack',  label: '后墙(二层)', color: '#f2ece0', deps: [] },
  { name: 'upperWallLeft',  label: '山墙(左)',   color: '#f2ece0', deps: [] },
  { name: 'upperWallRight', label: '山墙(右)',   color: '#f2ece0', deps: [] },
  { name: 'upperInteriorWalls', label: '二层内隔墙', color: '#ede6d8', deps: [] },
  { name: 'roofTiles',   label: '青瓦屋顶',   color: '#4a4a5a', deps: [] },
  { name: 'roofFrame',   label: '屋架梁檩',   color: '#5a3a28', deps: [] },
  { name: 'doors1F',     label: '一层门',     color: '#4a2818', deps: [] },
  { name: 'windows1F',   label: '一层窗户',   color: '#5a3828', deps: [] },
  { name: 'windows2F',   label: '二层窗户',   color: '#5a3828', deps: [] },
  { name: 'stairs',      label: '楼梯',       color: '#8b6914', deps: [] },
  { name: 'screen',      label: '屏风',       color: '#8b6914', deps: [] },
  { name: 'elderRoom',   label: '老人房',     color: '#7a4a20', deps: [] },
  { name: 'secondBed1F', label: '次卧(一层)', color: '#7a4a20', deps: [] },
  { name: 'mainHall',    label: '堂屋',       color: '#8b6914', deps: [] },
  { name: 'storage1F',   label: '储藏',       color: '#8b6914', deps: [] },
  { name: 'study1F',     label: '书房',       color: '#8b6914', deps: [] },
  { name: 'bathroom1F',  label: '一层卫生间', color: '#c8d8e8', deps: [] },
  { name: 'kitchen',     label: '厨房',       color: '#8b5a3a', deps: [] },
  { name: 'diningRoom',  label: '餐厅',       color: '#8b6914', deps: [] },
  { name: 'childRoom1',  label: '儿童房1',    color: '#7a4a20', deps: [] },
  { name: 'secondBed2F', label: '次卧(二层)', color: '#7a4a20', deps: [] },
  { name: 'masterBed',   label: '主卧',       color: '#7a4a20', deps: [] },
  { name: 'storage2F',   label: '杂物间',     color: '#8b6914', deps: [] },
  { name: 'childRoom2',  label: '儿童房2',    color: '#7a4a20', deps: [] },
  { name: 'bathroom2F',  label: '二层卫生间', color: '#c8d8e8', deps: [] },
  { name: 'living2F',    label: '起居厅',     color: '#8b6914', deps: [] },
  { name: 'pipelines',   label: '排水系统',   color: '#8b6b4a', deps: [] },
];

// ── Categories  3 layers ─────────────────────────────────────────
export const CATEGORIES = {
  roof:   { label: '屋顶 ↗', parts: ['roofTiles','roofFrame'], color: '#4a4a5a' },
  floor2: { label: '二层 ↗', parts: ['upperWallFront','upperWallBack','upperWallLeft','upperWallRight','upperInteriorWalls','floor2','windows2F','masterBed','secondBed2F','childRoom1','childRoom2','storage2F','living2F','bathroom2F'], color: '#5a8a5a' },
  floor1: { label: '一层 ↗', parts: ['wallFront','wallBack','wallLeft','wallRight','interiorWalls','floor','doors1F','windows1F','elderRoom','secondBed1F','mainHall','storage1F','study1F','bathroom1F','kitchen','diningRoom','stairs','screen','columns','base','ventDucts','pipelines'], color: '#d4c8b0' },
};

// ── Translate offsets ─────────────────────────────────────────────
export function getDisassembleOffset(name) {
  const RR = 20, LL = -20;
  const map = {
    roofTiles: [RR,0,0], roofFrame: [RR,0,0],
    upperWallFront:[LL,0,0], upperWallBack:[LL,0,0], upperWallLeft:[LL,0,0], upperWallRight:[LL,0,0],
    upperInteriorWalls:[LL,0,0], floor2:[LL,0,0], windows2F:[LL,0,0],
    masterBed:[LL,0,0], secondBed2F:[LL,0,0], childRoom1:[LL,0,0], childRoom2:[LL,0,0],
    storage2F:[LL,0,0], living2F:[LL,0,0], bathroom2F:[LL,0,0],
  };
  if (!map[name] && name) map[name] = [0,0,0];
  return map[name] || [0,0,0];
}
