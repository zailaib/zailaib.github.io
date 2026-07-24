/* 2F — doors + windows */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H2, WALL_T, BAY_W, BAY_COUNT, HW2, HD2, BAND_Y } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor2Openings(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  const door2 = parts.get('doors2F').group;
  const win2 = parts.get('windows2F').group;
  const B = BAND_Y;
  const zf = HD2 + WALL_T / 2 + 0.05, zb = -HD2 - WALL_T / 2 - 0.05;

  // Windows — 4 front + 4 back
  for (let b = 0; b < BAY_COUNT; b++) {
    const bx = -HW2 + b * BAY_W + BAY_W / 2;
    const wy = 1.6 + B;
    win2.add(makeWindow(bx, wy, zf, MATS));
    win2.add(makeWindow(bx, wy, zb, MATS, Math.PI));
  }

  // Interior doors
  function addUpperDoor(x, z, ry = 0) {
    const fz = z + (ry === 0 ? 0.03 : -0.03);
    for (const dx of [-0.42, 0.42]) { const f = box(0.06, 2.1, 0.04, MATS.interiorDoor); f.position.set(x + dx, 1.05 + B, fz); addTo('doors2F', f); door2.add(f); }
    const ft3 = box(0.9, 0.06, 0.04, MATS.interiorDoor); ft3.position.set(x, 2.1 + B, fz); addTo('doors2F', ft3); door2.add(ft3);
    const pn = box(0.78, 2.0, 0.03, MATS.interiorDoor); pn.position.set(x, 1.0 + B, fz + 0.01); addTo('doors2F', pn); door2.add(pn);
  }
  for (const bx of [-6, -2, 2, 6]) addUpperDoor(bx, 0.01);
}

function makeWindow(x, y, z, MATS, ry = 0) {
  const wg = new THREE.Group();
  const fw = 1.1, fh = 1.4, ft = 0.06;
  const GLASS = new THREE.MeshStandardMaterial({ color: 0xaaccff, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.35 });
  const paneW = (fw - ft * 3) / 2, paneH = (fh - ft * 3) / 2;
  for (const px of [-1, 1]) for (const py of [-1, 1]) {
    const g = box(paneW - 0.02, paneH - 0.02, ft * 0.3, GLASS);
    g.position.set(px * (paneW / 2 + ft / 2), py * (paneH / 2 + ft / 2), 0); wg.add(g);
  }
  for (const xo of [-fw / 2, fw / 2]) { const f = box(ft, fh, ft, MATS.window); f.position.set(xo, 0, 0); wg.add(f); }
  for (const yo of [-fh / 2, fh / 2]) { const f = box(fw, ft, ft, MATS.window); f.position.set(0, yo, 0); wg.add(f); }
  const mv = box(ft * 0.7, fh * 0.85, ft * 0.7, MATS.window); mv.position.z = 0.01; wg.add(mv);
  const mh = box(fw * 0.85, ft * 0.7, ft * 0.7, MATS.window); mh.position.z = -0.01; wg.add(mh);
  const lintel = box(fw + 0.2, 0.06, ft + 0.04, MATS.woodDark); lintel.position.set(0, fh / 2 + 0.04, 0); wg.add(lintel);
  const sill = box(fw + 0.15, 0.05, ft + 0.06, MATS.woodDark); sill.position.set(0, -fh / 2 - 0.03, 0); wg.add(sill);
  wg.position.set(x, y, z); wg.rotation.y = ry; return wg;
}
