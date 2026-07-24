/* 2F — walls: mirror 1F corridor + unequal bays */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H2, WALL_T, INT_WALL_T, BAY_X, BAY_CX, BAY_WIDTHS, HW2, HD2, WY2, BAND_Y, CROSS_Z_FRONT, CROSS_Z_BACK } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildUpperWalls(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name); if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }
  function makeWall(name, w, h, d, px, py, pz) {
    const m = box(w, h, d, MATS.wall); m.position.set(px, py, pz); addTo(name, m); parts.get(name).group.add(m);
  }

  makeWall('upperWallFront', HOUSE_W, WALL_H2, WALL_T, 0, WY2, HD2);
  makeWall('upperWallBack',  HOUSE_W, WALL_H2, WALL_T, 0, WY2, -HD2);
  makeWall('upperWallLeft',  WALL_T, WALL_H2, HOUSE_D, -HW2, WY2, 0);
  makeWall('upperWallRight', WALL_T, WALL_H2, HOUSE_D,  HW2, WY2, 0);

  // Upper vent windows — offset outside wall face (WALL_T/2 + 0.03) to avoid z-fighting
  const ventOff = WALL_T / 2 + 0.04;
  for (const [side, sign] of [['upperWallFront', 1], ['upperWallBack', -1]]) {
    const zBase = sign * (HD2 + ventOff);
    const up = parts.get(side); if (!up) continue;
    for (const bx of [-6.5, -2.5, 3, 6.5]) {
      const f = box(0.5, 0.5, 0.08, MATS.window); f.position.set(bx, WY2 + 0.01, zBase); addTo(side, f); up.group.add(f);
      const mh = box(0.4, 0.04, 0.09, MATS.window); mh.position.set(bx, WY2, zBase + sign * 0.04); addTo(side, mh); up.group.add(mh);
      const mv = box(0.04, 0.4, 0.09, MATS.window); mv.position.set(bx, WY2 - 0.01, zBase - sign * 0.04); addTo(side, mv); up.group.add(mv);
    }
  }

  // Interior walls — same as 1F
  const iwGrp = parts.get('upperInteriorWalls').group;
  const DW = 0.9, fz = HD2 - WALL_T, bz = -HD2 + WALL_T;

  for (let i = 1; i < BAY_X.length - 1; i++) {
    const ix = BAY_X[i];
    const fLen = (fz - CROSS_Z_FRONT - DW) / 2; if (fLen > 0.1) for (const s of [-1,1]) { const seg = box(INT_WALL_T,WALL_H2,fLen,MATS.interior); seg.position.set(ix,WY2,CROSS_Z_FRONT+s*(fLen/2+(DW+fLen)/2)); addTo('upperInteriorWalls',seg); iwGrp.add(seg); }
    const bLen = (CROSS_Z_BACK - bz - DW) / 2;     if (bLen > 0.1) for (const s of [-1,1]) { const seg = box(INT_WALL_T,WALL_H2,bLen,MATS.interior); seg.position.set(ix,WY2,CROSS_Z_BACK-s*(bLen/2+(DW+bLen)/2)); addTo('upperInteriorWalls',seg); iwGrp.add(seg); }
  }
  for (let b = 0; b < BAY_WIDTHS.length; b++) {
    const cx = BAY_CX[b], bw = BAY_WIDTHS[b]; if (bw < DW+1) continue;
    const hLen = (bw - DW) / 2;
    for (const s of [-1,1]) { const seg = box(hLen,WALL_H2,INT_WALL_T,MATS.interior); seg.position.set(cx+s*(hLen/2+DW/2),WY2,CROSS_Z_FRONT); addTo('upperInteriorWalls',seg); iwGrp.add(seg); }
    for (const s of [-1,1]) { const seg = box(hLen,WALL_H2,INT_WALL_T,MATS.interior); seg.position.set(cx+s*(hLen/2+DW/2),WY2,CROSS_Z_BACK);  addTo('upperInteriorWalls',seg); iwGrp.add(seg); }
  }

  // Floor band
  for (const [pn, pw, pd, px, pz] of [
    ['upperWallFront',HOUSE_W+0.05,WALL_T+0.08,0,HD2], ['upperWallBack',HOUSE_W+0.05,WALL_T+0.08,0,-HD2],
    ['upperWallLeft',WALL_T+0.08,HOUSE_D+0.05,-HW2,0], ['upperWallRight',WALL_T+0.08,HOUSE_D+0.05,HW2,0],
  ]) { const band = box(pw,0.08,pd,MATS.band); band.position.set(px,BAND_Y,pz); addTo(pn,band); parts.get(pn).group.add(band); }
}
