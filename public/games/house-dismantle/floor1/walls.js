/* 1F  walls: corridor + unequal bays */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_T, INT_WALL_T, BAY_X, BAY_CX, BAY_WIDTHS, HW2, HD2, WY1, CROSS_Z_FRONT, CROSS_Z_BACK, DEPTH_CORRIDOR } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor1Walls(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name); if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }
  function makeWall(name, w, h, d, px, py, pz) {
    const m = box(w, h, d, MATS.wall); m.position.set(px, py, pz); addTo(name, m); parts.get(name).group.add(m);
  }

  // Exterior walls
  makeWall('wallFront', HOUSE_W, WALL_H1, WALL_T, 0, WY1, HD2);
  makeWall('wallBack',  HOUSE_W, WALL_H1, WALL_T, 0, WY1, -HD2);
  makeWall('wallLeft',  WALL_T, WALL_H1, HOUSE_D, -HW2, WY1, 0);
  makeWall('wallRight', WALL_T, WALL_H1, HOUSE_D,  HW2, WY1, 0);

  // Interior walls
  const iwGrp = parts.get('interiorWalls').group;
  const DW = 0.9; // doorway width
  const fz = HD2 - WALL_T, bz = -HD2 + WALL_T;

  // Longitudinal walls at bay boundaries (x = BAY_X[1], BAY_X[2], BAY_X[3])
  for (let i = 1; i < BAY_X.length - 1; i++) {
    const ix = BAY_X[i];
    // Front segment: CROSS_Z_FRONT to fz (with doorway)
    const fLen = (fz - CROSS_Z_FRONT - DW) / 2;
    if (fLen > 0.1) {
      for (const s of [-1, 1]) {
        const seg = box(INT_WALL_T, WALL_H1, fLen, MATS.interior);
        seg.position.set(ix, WY1, CROSS_Z_FRONT + s * (fLen/2 + (DW+fLen)/2));
        addTo('interiorWalls', seg); iwGrp.add(seg);
      }
    }
    // Back segment: bz to CROSS_Z_BACK (with doorway)
    const bLen = (CROSS_Z_BACK - bz - DW) / 2;
    if (bLen > 0.1) {
      for (const s of [-1, 1]) {
        const seg = box(INT_WALL_T, WALL_H1, bLen, MATS.interior);
        seg.position.set(ix, WY1, CROSS_Z_BACK - s * (bLen/2 + (DW+bLen)/2));
        addTo('interiorWalls', seg); iwGrp.add(seg);
      }
    }
  }

  // Cross wall 1 (front corridor wall) at z=CROSS_Z_FRONT
  for (let b = 0; b < BAY_WIDTHS.length; b++) {
    const cx = BAY_CX[b], bw = BAY_WIDTHS[b];
    if (bw < DW + 1.0) continue; // too narrow for door
    const hLen = (bw - DW) / 2;
    for (const s of [-1, 1]) {
      const seg = box(hLen, WALL_H1, INT_WALL_T, MATS.interior);
      seg.position.set(cx + s * (hLen/2 + DW/2), WY1, CROSS_Z_FRONT);
      addTo('interiorWalls', seg); iwGrp.add(seg);
    }
  }

  // Cross wall 2 (back corridor wall) at z=CROSS_Z_BACK  same pattern
  for (let b = 0; b < BAY_WIDTHS.length; b++) {
    const cx = BAY_CX[b], bw = BAY_WIDTHS[b];
    if (bw < DW + 1.0) continue;
    const hLen = (bw - DW) / 2;
    for (const s of [-1, 1]) {
      const seg = box(hLen, WALL_H1, INT_WALL_T, MATS.interior);
      seg.position.set(cx + s * (hLen/2 + DW/2), WY1, CROSS_Z_BACK);
      addTo('interiorWalls', seg); iwGrp.add(seg);
    }
  }
}
