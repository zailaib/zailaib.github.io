/* 2F — upper walls + floor band */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H2, WALL_T, HW2, HD2, WY2, BAND_Y } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildUpperWalls(houseGroup, parts, MATS) {
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

  makeWall('upperWallFront', HOUSE_W, WALL_H2, WALL_T, 0, WY2, HD2);
  makeWall('upperWallBack', HOUSE_W, WALL_H2, WALL_T, 0, WY2, -HD2);
  makeWall('upperWallLeft', WALL_T, WALL_H2, HOUSE_D, -HW2, WY2, 0);
  makeWall('upperWallRight', WALL_T, WALL_H2, HOUSE_D, HW2, WY2, 0);

  // Upper vent windows
  for (const [side, z] of [['upperWallFront', HD2 + 0.03], ['upperWallBack', -HD2 - 0.03]]) {
    const up = parts.get(side); if (!up) continue;
    for (const bx of [-HW2 + 2, -HW2 + 6, HW2 - 2]) {
      const frame = box(0.5, 0.5, 0.08, MATS.window);
      frame.position.set(bx, WY2, z);
      addTo(side, frame); up.group.add(frame);
      const mh = box(0.4, 0.04, 0.09, MATS.window);
      mh.position.set(bx, WY2, z + 0.01);
      addTo(side, mh); up.group.add(mh);
      const mv = box(0.04, 0.4, 0.09, MATS.window);
      mv.position.set(bx, WY2, z - 0.01);
      addTo(side, mv); up.group.add(mv);
    }
  }

  // Floor band (decorative ledge between 1F and 2F)
  for (const [pn, pw, pd, px, pz] of [
    ['upperWallFront', HOUSE_W + 0.05, WALL_T + 0.08, 0, HD2],
    ['upperWallBack', HOUSE_W + 0.05, WALL_T + 0.08, 0, -HD2],
    ['upperWallLeft', WALL_T + 0.08, HOUSE_D + 0.05, -HW2, 0],
    ['upperWallRight', WALL_T + 0.08, HOUSE_D + 0.05, HW2, 0],
  ]) {
    const band = box(pw, 0.08, pd, MATS.band);
    band.position.set(px, BAND_Y, pz);
    addTo(pn, band); parts.get(pn).group.add(band);
  }
}
