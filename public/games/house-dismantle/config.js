/* House Dismantle — Configuration & Part Registry */

import * as THREE from 'three';

// ── Dimensions (meters, 1 unit = 1m) ──────────────────────────────
export const HOUSE_W   = 12;      // width (3 bays × 4m)
export const HOUSE_D   = 7;       // depth
export const WALL_H1   = 2.8;     // first floor wall height
export const WALL_H2   = 1.5;     // upper half-story wall height (2.8→4.3m)
export const ROOF_H    = 5.5;     // roof ridge height from ground
export const EAVE_H    = WALL_H1 + WALL_H2; // eave height = 4.3m
export const WALL_T    = 0.24;    // wall thickness
export const FLOOR_H   = 0.2;     // floor platform thickness
export const BASE_H    = 0.45;    // stone foundation thickness
export const ROOF_OH   = 1.0;     // roof overhang beyond walls
export const BAY_W     = HOUSE_W / 3; // ~4m per bay

export const HW2 = HOUSE_W / 2;
export const HD2 = HOUSE_D / 2;

// Wall center Y positions
export const WY1 = WALL_H1 / 2 + FLOOR_H;           // first floor
export const WY2 = WALL_H1 + WALL_H2 / 2 + FLOOR_H; // upper half-story
export const BAND_Y = WALL_H1 + FLOOR_H;             // floor separator band

// ── Materials ─────────────────────────────────────────────────────
export const MATS = {
  // Structure
  roofTile:    new THREE.MeshStandardMaterial({ color: 0x4a4a5a, roughness: 0.7, metalness: 0.05, side: THREE.DoubleSide }),
  roofFrame:   new THREE.MeshStandardMaterial({ color: 0x5a3a28, roughness: 0.6, metalness: 0.0 }),
  wall:        new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.8, metalness: 0.0 }),
  upperWall:   new THREE.MeshStandardMaterial({ color: 0xc4b898, roughness: 0.8, metalness: 0.0 }),
  interior:    new THREE.MeshStandardMaterial({ color: 0xede6d8, roughness: 0.8, metalness: 0.0 }),
  floor:       new THREE.MeshStandardMaterial({ color: 0x908878, roughness: 0.7, metalness: 0.05 }),
  column:      new THREE.MeshStandardMaterial({ color: 0x6b3a20, roughness: 0.5, metalness: 0.0 }),
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
  shrineMat:   new THREE.MeshStandardMaterial({ color: 0x4a2010, roughness: 0.4, metalness: 0.1 }),
  // Yard
  chickenBody: new THREE.MeshStandardMaterial({ color: 0xd4a030, roughness: 0.7, metalness: 0.0 }),
  chickenComb: new THREE.MeshStandardMaterial({ color: 0xcc2200, roughness: 0.5, metalness: 0.0 }),
  wellStone:   new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.7, metalness: 0.05 }),
  wellRoof:    new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.6, metalness: 0.0 }),
  fenceWood:   new THREE.MeshStandardMaterial({ color: 0x9b8b70, roughness: 0.7, metalness: 0.0 }),
  hayMat:      new THREE.MeshStandardMaterial({ color: 0xb8a040, roughness: 0.9, metalness: 0.0 }),
  // Plumbing
  pipe:        new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.4, metalness: 0.6 }),
  pipeJoint:   new THREE.MeshStandardMaterial({ color: 0x7a5c3e, roughness: 0.35, metalness: 0.7 }),
  // Grain
  grainSack:   new THREE.MeshStandardMaterial({ color: 0xc8b078, roughness: 0.8, metalness: 0.0 }),
  grainMat:    new THREE.MeshStandardMaterial({ color: 0x9b8030, roughness: 0.7, metalness: 0.0 }),
};

// ── Part Registry ─────────────────────────────────────────────────
// { name, label, color, deps[], cat }
// deps = parts that MUST be removed before this one
export const PART_DEFS = [
  // ── Foundation ──
  { name: 'base',        label: '石基平台',  color: '#6e6e6e', deps: ['floor','columns'], cat: 'base' },
  { name: 'floor',       label: '地板平台',  color: '#908878', deps: ['wallFront','wallBack','wallLeft','wallRight','interiorWall1','interiorWall2'], cat: 'base' },

  // ── Structure ──
  { name: 'columns',     label: '木柱',      color: '#6b3a20', deps: ['roofFrame'], cat: 'structure' },
  { name: 'wallFront',   label: '前墙(一层)', color: '#f2ece0', deps: ['upperWallFront'], cat: 'structure' },
  { name: 'wallBack',    label: '后墙(一层)', color: '#f2ece0', deps: ['upperWallBack'], cat: 'structure' },
  { name: 'wallLeft',    label: '左墙(一层)', color: '#f2ece0', deps: ['upperWallLeft'], cat: 'structure' },
  { name: 'wallRight',   label: '右墙(一层)', color: '#f2ece0', deps: ['upperWallRight'], cat: 'structure' },
  { name: 'interiorWall1', label: '隔墙(左)', color: '#ede6d8', deps: ['upperWallFront','upperWallBack'], cat: 'structure' },
  { name: 'interiorWall2', label: '隔墙(右)', color: '#ede6d8', deps: ['upperWallFront','upperWallBack'], cat: 'structure' },
  { name: 'upperWallFront', label: '前墙(二层)', color: '#d4c8b0', deps: ['roofFrame'], cat: 'structure' },
  { name: 'upperWallBack',  label: '后墙(二层)', color: '#d4c8b0', deps: ['roofFrame'], cat: 'structure' },
  { name: 'upperWallLeft',  label: '山墙(左)',   color: '#ccc0a8', deps: ['roofFrame'], cat: 'structure' },
  { name: 'upperWallRight', label: '山墙(右)',   color: '#ccc0a8', deps: ['roofFrame'], cat: 'structure' },

  // ── Roof ──
  { name: 'roofTiles',   label: '瓦片屋顶',  color: '#4a4a5a', deps: [], cat: 'roof' },
  { name: 'roofFrame',   label: '屋架(梁檩)', color: '#5a3a28', deps: ['roofTiles'], cat: 'roof' },

  // ── Openings ──
  { name: 'doors',       label: '门',        color: '#4a2818', deps: ['wallFront'], cat: 'openings' },
  { name: 'windows',     label: '窗户',      color: '#5a3828', deps: ['wallFront','wallBack'], cat: 'openings' },
  { name: 'stairs',      label: '楼梯',      color: '#8b6914', deps: ['upperWallFront','upperWallBack'], cat: 'openings' },

  // ── Interior ──
  { name: 'beds',        label: '床铺',      color: '#7a4a20', deps: ['wallRight','interiorWall2'], cat: 'interior' },
  { name: 'tableChairs', label: '桌椅',      color: '#8b6914', deps: ['wallFront','wallBack','interiorWall1','interiorWall2'], cat: 'interior' },
  { name: 'stove',       label: '灶台',      color: '#8b5a3a', deps: ['wallLeft','interiorWall1'], cat: 'interior' },
  { name: 'shrine',      label: '神龛',      color: '#4a2010', deps: ['wallBack'], cat: 'interior' },

  // ── Yard ──
  { name: 'well',        label: '水井',      color: '#7a7a7a', deps: [], cat: 'yard' },

  // ── Plumbing ──
  { name: 'pipelines',   label: '排水系统',  color: '#8b6b4a', deps: ['base'], cat: 'plumbing' },
];

// ── Categories (for filter UI) ────────────────────────────────────
export const CATEGORIES = {
  roof:      { label: '屋顶',  parts: ['roofTiles','roofFrame'],                              color: '#4a4a5a' },
  structure: { label: '结构',  parts: ['wallFront','wallBack','wallLeft','wallRight','interiorWall1','interiorWall2','upperWallFront','upperWallBack','upperWallLeft','upperWallRight','columns'], color: '#d4c8b0' },
  base:      { label: '地基',  parts: ['base','floor'],                                        color: '#6e6e6e' },
  openings:  { label: '门窗梯',parts: ['doors','windows','stairs'],                            color: '#8b6914' },
  interior:  { label: '家具',  parts: ['beds','tableChairs','stove','shrine'],               color: '#7a4a20' },
  yard:      { label: '院子',  parts: ['well'],                                                 color: '#80a050' },
  plumbing:  { label: '管道',  parts: ['pipelines'],                                           color: '#8b6b4a' },
};

// ── Disassemble offsets ───────────────────────────────────────────
export function getDisassembleOffset(name) {
  const d = 3.5;
  const map = {
    // Roof
    roofTiles:        [0, d, 0],
    roofFrame:        [0, d * 0.7, 0],
    // Upper walls
    upperWallFront:   [0, 0.3, d * 0.6],
    upperWallBack:    [0, 0.3, -d * 0.6],
    upperWallLeft:    [-d * 0.5, 0.3, 0],
    upperWallRight:   [d * 0.5, 0.3, 0],
    // First floor walls
    wallFront:        [0, 0, d],
    wallBack:         [0, 0, -d],
    wallLeft:         [-d, 0, 0],
    wallRight:        [d, 0, 0],
    interiorWall1:    [0, 2, -0.5],
    interiorWall2:    [0, 2, 0.5],
    // Foundation
    floor:            [0, -d * 0.3, 0],
    base:             [0, -d * 0.7, 0],
    // Columns
    columns:          [0, d * 0.5, d * 0.4],
    // Openings
    doors:            [0, 0.5, d * 1.2],
    windows:          [0, 0.3, d * 1.1],
    stairs:           [0, 1.5, -2.5],
    // Interior
    beds:             [d * 0.7, 0, 0],
    tableChairs:      [0, 1.5, 1.5],
    stove:            [-d * 0.7, 0.3, 0],
    shrine:           [0, 0.5, -2],
    // Yard
    well:             [0, -0.5, -2.5],
    // Plumbing
    pipelines:        [0, -1.0, 0],
  };
  return map[name] || [0, d * 0.5, 0];
}
