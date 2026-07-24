/* 2F — upper exterior + interior walls (with corridor doorways) */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H2, WALL_T, INT_WALL_T, BAY_W, BAY_COUNT, HW2, HD2, WY2, BAND_Y } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildUpperWalls(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }
  function makeWall(name, w, h, d, px, py, pz) {
    const m = box(w, h, d, MATS.wall);
    m.position.set(px, py, pz);
    addTo(name, m); parts.get(name).group.add(m);
  }

  makeWall('upperWallFront', HOUSE_W, WALL_H2, WALL_T, 0, WY2, HD2);
  makeWall('upperWallBack', HOUSE_W, WALL_H2, WALL_T, 0, WY2, -HD2);
  makeWall('upperWallLeft', WALL_T, WALL_H2, HOUSE_D, -HW2, WY2, 0);
  makeWall('upperWallRight', WALL_T, WALL_H2, HOUSE_D, HW2, WY2, 0);

  // Upper vent windows
  for (const [side, z] of [['upperWallFront', HD2+0.03],['upperWallBack', -HD2-0.03]]) {
    const up = parts.get(side); if (!up) continue;
    for (const bx of [-HW2+2, -HW2+6, HW2-2]) {
      const f = box(0.5,0.5,0.08,MATS.window); f.position.set(bx,WY2,z); addTo(side,f); up.group.add(f);
      const mh = box(0.4,0.04,0.09,MATS.window); mh.position.set(bx,WY2,z+0.01); addTo(side,mh); up.group.add(mh);
      const mv = box(0.04,0.4,0.09,MATS.window); mv.position.set(bx,WY2,z-0.01); addTo(side,mv); up.group.add(mv);
    }
  }

  // 2F Interior walls with corridor gap at z=-2
  const iwGrp = parts.get('upperInteriorWalls').group;
  const fz = HD2 - WALL_T, bz = -HD2 + WALL_T;
  const g0 = -2.5, g1 = -1.5; // corridor doorway gap

  // x=-4, 4: full split. x=0: front only (back is stairwell opening)
  for (const ix of [-BAY_W, BAY_W]) {
    const bl = g0 - bz; if (bl > 0.1) { const w = box(INT_WALL_T,WALL_H2,bl,MATS.interior); w.position.set(ix,WY2,(bz+g0)/2); addTo('upperInteriorWalls',w); iwGrp.add(w); }
    const fl = fz - g1; if (fl > 0.1) { const w = box(INT_WALL_T,WALL_H2,fl,MATS.interior); w.position.set(ix,WY2,(g1+fz)/2); addTo('upperInteriorWalls',w); iwGrp.add(w); }
  }
  { const fl = fz - (-2.0); if (fl > 0.1) { const w = box(INT_WALL_T,WALL_H2,fl,MATS.interior); w.position.set(0,WY2,(-2.0+fz)/2); addTo('upperInteriorWalls',w); iwGrp.add(w); } }

  // Cross wall at z=0 with doorways
  const dw = 0.9;
  for (let b = 0; b < BAY_COUNT; b++) {
    const bx = -HW2 + b*BAY_W + BAY_W/2, hs = (BAY_W - INT_WALL_T*2 - dw)/2;
    for (const side of [-1,1]) {
      const s = box(hs, WALL_H2, INT_WALL_T, MATS.interior); s.position.set(bx + side*(hs/2+dw/2), WY2, 0);
      addTo('upperInteriorWalls', s); iwGrp.add(s);
    }
  }

  // Floor band
  for (const [pn, pw, pd, px, pz] of [
    ['upperWallFront',HOUSE_W+0.05,WALL_T+0.08,0,HD2], ['upperWallBack',HOUSE_W+0.05,WALL_T+0.08,0,-HD2],
    ['upperWallLeft',WALL_T+0.08,HOUSE_D+0.05,-HW2,0], ['upperWallRight',WALL_T+0.08,HOUSE_D+0.05,HW2,0],
  ]) {
    const band = box(pw,0.08,pd,MATS.band); band.position.set(px,BAND_Y,pz); addTo(pn,band); parts.get(pn).group.add(band);
  }
}
