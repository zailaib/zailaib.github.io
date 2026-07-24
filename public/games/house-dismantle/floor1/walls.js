/* 1F — exterior + interior walls */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_T, INT_WALL_T, BAY_W, BAY_COUNT, HW2, HD2, WY1 } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor1Walls(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  function makeWall(name, w, h, d, px, py, pz) {
    const grp = parts.get(name).group;
    const m = box(w, h, d, MATS.wall);
    m.position.set(px, py, pz);
    addTo(name, m); grp.add(m);
  }

  // Exterior walls
  makeWall('wallFront', HOUSE_W, WALL_H1, WALL_T, 0, WY1, HD2);
  makeWall('wallBack', HOUSE_W, WALL_H1, WALL_T, 0, WY1, -HD2);
  makeWall('wallLeft', WALL_T, WALL_H1, HOUSE_D, -HW2, WY1, 0);
  makeWall('wallRight', WALL_T, WALL_H1, HOUSE_D, HW2, WY1, 0);

  // Interior walls
  const iwGrp = parts.get('interiorWalls').group;

  // 3 longitudinal walls at x = -BAY_W, 0, BAY_W
  for (const ix of [-BAY_W, 0, BAY_W]) {
    const iw = box(INT_WALL_T, WALL_H1, HOUSE_D - WALL_T * 2, MATS.interior);
    iw.position.set(ix, WY1, 0);
    addTo('interiorWalls', iw); iwGrp.add(iw);
  }

  // Cross wall at z=0 — 4 segments with doorways
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
