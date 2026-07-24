/* 2F  windows only */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H2, WALL_T, BAY_CX, BAY_COUNT, HW2, HD2, BAND_Y } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor2Openings(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name); if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  const win2 = parts.get('windows2F').group;
  const B = BAND_Y, zf = HD2 + WALL_T/2 + 0.05, zb = -HD2 - WALL_T/2 - 0.05;
  const GLASS = new THREE.MeshStandardMaterial({ color: 0xaaccff, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.35 });

  function makeWindow(x, y, z, ry) {
    const wg = new THREE.Group(), fw = 1.1, fh = 1.4, ft = 0.06;
    const pw = (fw-ft*3)/2, ph = (fh-ft*3)/2;
    for (const px of [-1,1]) for (const py of [-1,1]) { const g = box(pw-0.02,ph-0.02,ft*0.3,GLASS); g.position.set(px*(pw/2+ft/2),py*(ph/2+ft/2),0); wg.add(g); }
    for (const xo of [-fw/2,fw/2]) { const f = box(ft,fh,ft,MATS.window); f.position.set(xo,0,0); wg.add(f); }
    for (const yo of [-fh/2,fh/2]) { const f = box(fw,ft,ft,MATS.window); f.position.set(0,yo,0); wg.add(f); }
    const mv = box(ft*0.7,fh*0.85,ft*0.7,MATS.window); mv.position.z = 0.01; wg.add(mv);
    const mh = box(fw*0.85,ft*0.7,ft*0.7,MATS.window); mh.position.z = -0.01; wg.add(mh);
    wg.add(box(fw+0.2,0.06,ft+0.04,MATS.woodDark)); wg.children[wg.children.length-1].position.set(0,fh/2+0.04,0);
    wg.add(box(fw+0.15,0.05,ft+0.06,MATS.woodDark)); wg.children[wg.children.length-1].position.set(0,-fh/2-0.03,0);
    wg.position.set(x,y,z); wg.rotation.y = ry; return wg;
  }

  const wy = 1.6 + B;
  for (let b = 0; b < BAY_COUNT; b++) {
    const cx = BAY_CX[b];
    win2.add(makeWindow(cx, wy, zf));
    if (b !== 1) win2.add(makeWindow(cx, wy, zb, Math.PI)); // skip bay2 back (bathroom)
  }
}
