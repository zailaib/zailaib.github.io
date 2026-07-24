/* House Dismantle — Configuration & Part Registry
   Dabie Mountain 4-bay 2-story house */

import * as THREE from 'three';

// ── Dimensions (meters, 1 unit = 1m) ──────────────────────────────
export const BAY_COUNT = 4;
export const HOUSE_W   = BAY_COUNT * 4; // 16m (4 bays × 4m)
export const HOUSE_D   = 9;             // depth
export const WALL_H1   = 2.6;           // first floor clear height
export const WALL_H2   = 2.5;           // second floor clear height
export const BASE_H    = 0.55;          // stone foundation height
export const FLOOR_H   = BASE_H;        // ground floor platform = top of base
export const ROOF_PITCH = 28;           // degrees
export const ROOF_RISE = Math.tan(ROOF_PITCH * Math.PI / 180) * (HOUSE_D / 2); // ~2.4m
export const EAVE_H    = FLOOR_H + WALL_H1 + WALL_H2; // 5.65m
export const ROOF_H    = EAVE_H + ROOF_RISE;          // ~8.05m
export const WALL_T    = 0.24;          // exterior wall thickness
export const INT_WALL_T = 0.15;         // interior wall thickness
export const ROOF_OH   = 1.0;           // roof overhang
export const BAY_W     = 4;             // per bay

export const HW2 = HOUSE_W / 2; // 8
export const HD2 = HOUSE_D / 2; // 4.5

// Wall center Y positions
export const WY1 = WALL_H1 / 2 + FLOOR_H;                    // 1.85
export const WY2 = WALL_H1 + WALL_H2 / 2 + FLOOR_H;          // 4.40
export const BAND_Y = WALL_H1 + FLOOR_H;                      // 3.15

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
  // ── Foundation ──
  { name: 'base',        label: '石基平台',   color: '#6e6e6e', deps: ['floor','floor2','columns'], cat: 'base' },
  { name: 'ventDucts',   label: '接地通风道', color: '#555555', deps: ['base'], cat: 'plumbing' },
  { name: 'floor',       label: '一层地板',   color: '#908878', deps: ['wallFront','wallBack','wallLeft','wallRight','interiorWalls'], cat: 'base' },
  { name: 'floor2',      label: '二层楼板',   color: '#c0b8a8', deps: ['upperWallFront','upperWallBack','upperWallLeft','upperWallRight'], cat: 'base' },

  // ── Structure ──
  { name: 'columns',     label: '水泥柱',     color: '#b0b0b0', deps: ['roofFrame'], cat: 'structure' },
  { name: 'wallFront',   label: '前墙(一层)', color: '#f2ece0', deps: ['upperWallFront'], cat: 'structure' },
  { name: 'wallBack',    label: '后墙(一层)', color: '#f2ece0', deps: ['upperWallBack'], cat: 'structure' },
  { name: 'wallLeft',    label: '左墙(一层)', color: '#f2ece0', deps: ['upperWallLeft'], cat: 'structure' },
  { name: 'wallRight',   label: '右墙(一层)', color: '#f2ece0', deps: ['upperWallRight'], cat: 'structure' },
  { name: 'interiorWalls', label: '一层内隔墙', color: '#ede6d8', deps: ['upperWallFront','upperWallBack'], cat: 'structure' },
  { name: 'upperWallFront', label: '前墙(二层)', color: '#f2ece0', deps: ['roofFrame'], cat: 'structure' },
  { name: 'upperWallBack',  label: '后墙(二层)', color: '#f2ece0', deps: ['roofFrame'], cat: 'structure' },
  { name: 'upperWallLeft',  label: '山墙(左)',   color: '#f2ece0', deps: ['roofFrame'], cat: 'structure' },
  { name: 'upperWallRight', label: '山墙(右)',   color: '#f2ece0', deps: ['roofFrame'], cat: 'structure' },
  { name: 'upperInteriorWalls', label: '二层内隔墙', color: '#ede6d8', deps: ['upperWallFront','upperWallBack'], cat: 'structure' },

  // ── Roof ──
  { name: 'roofTiles',   label: '青瓦屋顶',   color: '#4a4a5a', deps: [], cat: 'roof' },
  { name: 'roofFrame',   label: '屋架梁檩',   color: '#5a3a28', deps: ['roofTiles'], cat: 'roof' },

  // ── Openings ──
  { name: 'doors1F',     label: '一层门',     color: '#4a2818', deps: ['wallFront','wallBack'], cat: 'openings' },
  { name: 'doors2F',     label: '二层门',     color: '#4a2818', deps: ['upperWallFront','upperWallBack'], cat: 'openings' },
  { name: 'windows1F',   label: '一层窗户',   color: '#5a3828', deps: ['wallFront','wallBack'], cat: 'openings' },
  { name: 'windows2F',   label: '二层窗户',   color: '#5a3828', deps: ['upperWallFront','upperWallBack'], cat: 'openings' },
  { name: 'stairs',      label: '楼梯',       color: '#8b6914', deps: [], cat: 'openings' },

  // ── Interior 1F ──
  { name: 'elderRoom1',  label: '老人房1',    color: '#7a4a20', deps: ['wallLeft','interiorWalls'], cat: 'interior' },
  { name: 'elderRoom2',  label: '老人房2',    color: '#7a4a20', deps: ['interiorWalls'], cat: 'interior' },
  { name: 'livingRoom',  label: '客厅',       color: '#8b6914', deps: ['interiorWalls'], cat: 'interior' },
  { name: 'kitchen',     label: '厨房',       color: '#8b5a3a', deps: ['wallRight','interiorWalls'], cat: 'interior' },
  { name: 'diningRoom',  label: '餐厅',       color: '#8b6914', deps: ['wallLeft','interiorWalls'], cat: 'interior' },

  // ── Interior 2F ──
  { name: 'masterBed',   label: '主卧',       color: '#7a4a20', deps: ['upperWallLeft','interiorWalls'], cat: 'interior' },
  { name: 'secondBed',   label: '次卧',       color: '#7a4a20', deps: ['interiorWalls'], cat: 'interior' },
  { name: 'study',       label: '书房',       color: '#8b6914', deps: ['interiorWalls'], cat: 'interior' },
  { name: 'childRoom1',  label: '儿童房1',    color: '#7a4a20', deps: ['upperWallRight','interiorWalls'], cat: 'interior' },
  { name: 'childRoom2',  label: '儿童房2',    color: '#7a4a20', deps: ['upperWallLeft','interiorWalls'], cat: 'interior' },

  // ── Plumbing ──
  { name: 'pipelines',   label: '排水系统',   color: '#8b6b4a', deps: ['base'], cat: 'plumbing' },
];

// ── Categories — 3 layers, click to translate ─────────────────────
export const CATEGORIES = {
  roof:   { label: '屋顶 ↗', parts: ['roofTiles','roofFrame'], color: '#4a4a5a' },
  floor2: { label: '二层 ↗', parts: ['upperWallFront','upperWallBack','upperWallLeft','upperWallRight','upperInteriorWalls','floor2','doors2F','windows2F','masterBed','secondBed','study','childRoom1','childRoom2'], color: '#5a8a5a' },
  floor1: { label: '一层 ↗', parts: ['wallFront','wallBack','wallLeft','wallRight','interiorWalls','floor','doors1F','windows1F','elderRoom1','elderRoom2','livingRoom','kitchen','diningRoom','stairs','columns','base','ventDucts','pipelines'], color: '#d4c8b0' },
};

// ── Translate offsets — roof →, 2F ←, 1F stays ─────────────────
export function getDisassembleOffset(name) {
  const RR = 20; // roof right
  const LL = -20; // 2F left
  const map = {
    roofTiles:      [RR, 0, 0],
    roofFrame:      [RR, 0, 0],
    upperWallFront: [LL, 0, 0],
    upperWallBack:  [LL, 0, 0],
    upperWallLeft:  [LL, 0, 0],
    upperWallRight: [LL, 0, 0],
    floor2:         [LL, 0, 0],
    doors2F:        [LL, 0, 0],
    windows2F:      [LL, 0, 0],
    masterBed:      [LL, 0, 0],
    secondBed:      [LL, 0, 0],
    study:          [LL, 0, 0],
    childRoom1:     [LL, 0, 0],
    childRoom2:     [LL, 0, 0],
  };
  return map[name] || [0, 0, 0];
}
