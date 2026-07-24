/* 1F — exterior + interior walls (with corridor doorways) */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_T, INT_WALL_T, BAY_W, BAY_COUNT, HW2, HD2, WY1 } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor1Walls(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  // Exterior walls
  function makeWall(name, w, h, d, px, py, pz) {
    const m = box(w, h, d, MATS.wall);
    m.position.set(px, py, pz);
    addTo(name, m); parts.get(name).group.add(m);
  }
  makeWall('wallFront', HOUSE_W, WALL_H1, WALL_T, 0, WY1, HD2);
  makeWall('wallBack', HOUSE_W, WALL_H1, WALL_T, 0, WY1, -HD2);
  makeWall('wallLeft', WALL_T, WALL_H1, HOUSE_D, -HW2, WY1, 0);
  makeWall('wallRight', WALL_T, WALL_H1, HOUSE_D, HW2, WY1, 0);

  // Interior walls
  const iwGrp = parts.get('interiorWalls').group;
  const innerD = HOUSE_D - WALL_T * 2; // full interior depth
  const fz = HD2 - WALL_T; // front inner face
  const bz = -HD2 + WALL_T; // back inner face
  const corridorZ = -2; // corridor center
  const gap = 1.0; // doorway width
  const g0 = corridorZ - gap/2, g1 = corridorZ + gap/2;

  // 2 longitudinal walls at x=-4, 4 (x=0 is open — stairwell)
  for (const ix of [-BAY_W, BAY_W]) {
    const bl = g0 - bz; if (bl > 0.1) { const w = box(INT_WALL_T, WALL_H1, bl, MATS.interior); w.position.set(ix, WY1, (bz+g0)/2); addTo('interiorWalls', w); iwGrp.add(w); }
    const fl = fz - g1; if (fl > 0.1) { const w = box(INT_WALL_T, WALL_H1, fl, MATS.interior); w.position.set(ix, WY1, (g1+fz)/2); addTo('interiorWalls', w); iwGrp.add(w); }
  }
  // x=0: only front piece (back is open stairwell)
  const x0fl = fz - (-2.0); if (x0fl > 0.1) { const w = box(INT_WALL_T, WALL_H1, x0fl, MATS.interior); w.position.set(0, WY1, (-2.0+fz)/2); addTo('interiorWalls', w); iwGrp.add(w); }

  // Cross wall at z=0 — 4 segments with doorways (front-back passage)
  const doorWidth = 0.9;
  for (let b = 0; b < BAY_COUNT; b++) {
    const bx = -HW2 + b * BAY_W + BAY_W / 2;
    const halfSeg = (BAY_W - INT_WALL_T * 2 - doorWidth) / 2;
    for (const side of [-1, 1]) {
      const seg = box(halfSeg, WALL_H1, INT_WALL_T, MATS.interior);
      seg.position.set(bx + side * (halfSeg / 2 + doorWidth / 2), WY1, 0);
      addTo('interiorWalls', seg); iwGrp.add(seg);
    }
  }
}
