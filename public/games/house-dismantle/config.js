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

export const HW2 = HOUSE_W / 2;   // half width
export const HD2 = HOUSE_D / 2;   // half depth

// Wall center Y positions
export const WY1 = WALL_H1 / 2 + FLOOR_H;           // first floor
export const WY2 = WALL_H1 + WALL_H2 / 2 + FLOOR_H; // upper half-story

// ── Materials ─────────────────────────────────────────────────────
export const MATS = {
  roofTile:   new THREE.MeshStandardMaterial({ color: 0x4a4a5a, roughness: 0.7, metalness: 0.05 }),
  roofFrame:  new THREE.MeshStandardMaterial({ color: 0x5a3a28, roughness: 0.6, metalness: 0.0 }),
  wall:       new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.8, metalness: 0.0 }),
  upperWall:  new THREE.MeshStandardMaterial({ color: 0xd4c8b0, roughness: 0.8, metalness: 0.0 }),
  interior:   new THREE.MeshStandardMaterial({ color: 0xede6d8, roughness: 0.8, metalness: 0.0 }),
  floor:      new THREE.MeshStandardMaterial({ color: 0x908878, roughness: 0.7, metalness: 0.05 }),
  column:     new THREE.MeshStandardMaterial({ color: 0x6b3a20, roughness: 0.5, metalness: 0.0 }),
  door:       new THREE.MeshStandardMaterial({ color: 0x4a2818, roughness: 0.5, metalness: 0.0 }),
  doorPanel:  new THREE.MeshStandardMaterial({ color: 0x5a3020, roughness: 0.4, metalness: 0.05 }),
  window:     new THREE.MeshStandardMaterial({ color: 0x5a3828, roughness: 0.4, metalness: 0.0, emissive: 0x331100, emissiveIntensity: 0.3 }),
  ridge:      new THREE.MeshStandardMaterial({ color: 0x3a3a48, roughness: 0.6, metalness: 0.05 }),
  base:       new THREE.MeshStandardMaterial({ color: 0x6e6e6e, roughness: 0.75, metalness: 0.05 }),
  baseDark:   new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, metalness: 0 }),
  cornerStone:new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7, metalness: 0.05 }),
  pipe:       new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.4, metalness: 0.6 }),
  pipeJoint:  new THREE.MeshStandardMaterial({ color: 0x7a5c3e, roughness: 0.35, metalness: 0.7 }),
  band:       new THREE.MeshStandardMaterial({ color: 0x5a4a38, roughness: 0.5, metalness: 0.05 }),
  interiorDoor: new THREE.MeshStandardMaterial({ color: 0x6b4830, roughness: 0.5, metalness: 0.0 }),
};

// ── Part Registry (defines every selectable part) ─────────────────
// Each entry: { name, label, color, deps[], category }
// deps = parts that MUST be removed before this one (structural dependency)
export const PART_DEFS = [
  // ---- Foundation ----
  { name: 'base',       label: '石基平台',  color: '#6e6e6e', deps: ['floor','columns'], cat: 'base' },

  // ---- Floor ----
  { name: 'floor',      label: '地板平台',  color: '#908878', deps: ['wallFront','wallBack','wallLeft','wallRight','interiorWall1','interiorWall2'], cat: 'base' },

  // ---- Columns ----
  { name: 'columns',    label: '木柱',      color: '#6b3a20', deps: ['roofFrame'], cat: 'columns' },

  // ---- First Floor Walls ----
  { name: 'wallFront',  label: '前墙(一层)', color: '#f2ece0', deps: ['upperWallFront'],               cat: 'walls' },
  { name: 'wallBack',   label: '后墙(一层)', color: '#f2ece0', deps: ['upperWallBack'],                cat: 'walls' },
  { name: 'wallLeft',   label: '左墙(一层)', color: '#f2ece0', deps: ['upperWallLeft'],                cat: 'walls' },
  { name: 'wallRight',  label: '右墙(一层)', color: '#f2ece0', deps: ['upperWallRight'],               cat: 'walls' },

  // ---- Interior Walls ----
  { name: 'interiorWall1', label: '隔墙(左)', color: '#ede6d8', deps: ['upperWallFront','upperWallBack'], cat: 'walls' },
  { name: 'interiorWall2', label: '隔墙(右)', color: '#ede6d8', deps: ['upperWallFront','upperWallBack'], cat: 'walls' },

  // ---- Upper Half-Story Walls ----
  { name: 'upperWallFront', label: '前墙(二层)', color: '#d4c8b0', deps: ['roofFrame'], cat: 'walls' },
  { name: 'upperWallBack',  label: '后墙(二层)', color: '#d4c8b0', deps: ['roofFrame'], cat: 'walls' },
  { name: 'upperWallLeft',  label: '山墙(左)',   color: '#ccc0a8', deps: ['roofFrame'], cat: 'walls' },
  { name: 'upperWallRight', label: '山墙(右)',   color: '#ccc0a8', deps: ['roofFrame'], cat: 'walls' },

  // ---- Roof ----
  { name: 'roofTiles',  label: '瓦片屋顶',  color: '#4a4a5a', deps: [],                 cat: 'roof' },
  { name: 'roofFrame',  label: '屋架(梁檩)', color: '#5a3a28', deps: ['roofTiles'],      cat: 'roof' },

  // ---- Doors & Windows ----
  { name: 'doors',      label: '门',        color: '#4a2818', deps: ['wallFront'],       cat: 'doorsWin' },
  { name: 'windows',    label: '窗户',      color: '#5a3828', deps: ['wallFront','wallBack'], cat: 'doorsWin' },

  // ---- Plumbing ----
  { name: 'pipelines',  label: '管道系统',  color: '#8b6b4a', deps: ['roofTiles'],       cat: 'plumbing' },
];

// ── Category groups ───────────────────────────────────────────────
export const CATEGORIES = {
  roof:     { label: '屋顶', parts: ['roofTiles', 'roofFrame'],                            color: '#4a4a5a' },
  walls:    { label: '墙体', parts: ['wallFront','wallBack','wallLeft','wallRight','upperWallFront','upperWallBack','upperWallLeft','upperWallRight','interiorWall1','interiorWall2'], color: '#d4c8b0' },
  doorsWin: { label: '门窗', parts: ['doors', 'windows'],                                   color: '#4a2818' },
  columns:  { label: '柱梁', parts: ['columns'],                                            color: '#6b3a20' },
  base:     { label: '地基', parts: ['base', 'floor'],                                      color: '#6e6e6e' },
  plumbing: { label: '管道', parts: ['pipelines'],                                          color: '#8b6b4a' },
};

// ── Disassemble animation offsets (per part) ──────────────────────
export function getDisassembleOffset(name) {
  const d = 3.5;
  const offsets = {
    roofTiles:       [0, d, 0],
    roofFrame:       [0, d * 0.7, 0],
    upperWallFront:  [0, 0.3, d * 0.6],
    upperWallBack:   [0, 0.3, -d * 0.6],
    upperWallLeft:   [-d * 0.5, 0.3, 0],
    upperWallRight:  [d * 0.5, 0.3, 0],
    wallFront:       [0, 0, d],
    wallBack:        [0, 0, -d],
    wallLeft:        [-d, 0, 0],
    wallRight:       [d, 0, 0],
    interiorWall1:   [0, 2, -0.5],
    interiorWall2:   [0, 2, 0.5],
    doors:           [0, 0.5, d * 1.2],
    windows:         [0, 0.3, d * 1.1],
    columns:         [0, d * 0.5, d * 0.4],
    floor:           [0, -d * 0.3, 0],
    base:            [0, -d * 0.7, 0],
    pipelines:       [0, -d * 0.3, -d * 0.5],
  };
  return offsets[name] || [0, d * 0.5, 0];
}
