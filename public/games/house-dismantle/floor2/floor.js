/* 2F — floor platform with stairwell opening */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_T, HW2, HD2, BAND_Y } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor2(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  const grp = parts.get('floor2').group;
  const T = 0.12; // slab thickness

  // Stairwell opening: x=-2..0, z=-2.5..-0.5
  const sx0 = -2, sx1 = 0, sz0 = -2.5, sz1 = -0.5;
  const lx = -HW2 + WALL_T, rx = HW2 - WALL_T;
  const bz = -HD2 + WALL_T, fz = HD2 - WALL_T;

  // 4 slabs around the opening
  const slabs = [
    // Front (z from sz1 to fz, full width)
    { w: rx - lx, d: fz - sz1, x: 0, z: (sz1 + fz) / 2 },
    // Back (z from bz to sz0, full width)
    { w: rx - lx, d: sz0 - bz, x: 0, z: (bz + sz0) / 2 },
    // Left (x from lx to sx0, z from sz0 to sz1)
    { w: sx0 - lx, d: sz1 - sz0, x: (lx + sx0) / 2, z: (sz0 + sz1) / 2 },
    // Right (x from sx1 to rx, z from sz0 to sz1)
    { w: rx - sx1, d: sz1 - sz0, x: (sx1 + rx) / 2, z: (sz0 + sz1) / 2 },
  ];
  for (const s of slabs) {
    const slab = box(s.w, T, s.d, MATS.concreteFloor);
    slab.position.set(s.x, BAND_Y + T/2, s.z);
    addTo('floor2', slab); grp.add(slab);
  }

  // Concrete beams
  for (let jx = lx + 0.5; jx <= rx - 0.5; jx += 1.2) {
    if (jx > sx0 - 0.5 && jx < sx1 + 0.5) continue; // skip over opening
    const beam = box(0.10, 0.15, HOUSE_D - WALL_T * 2, MATS.concreteFloor);
    beam.position.set(jx, BAND_Y - 0.04, 0);
    addTo('floor2', beam); grp.add(beam);
  }

  // Stairwell railing — 3 sides (front open for entry)
  const srX = -1, srW = 2.0, srZ = -1.5, srD = 2.0;
  for (const [rx, rz, rw, rd] of [
    [srX - srW / 2, srZ, 0.04, srD],  // left
    [srX + srW / 2, srZ, 0.04, srD],  // right
    [srX, srZ - srD / 2, srW + 0.08, 0.04], // back
    // Front OPEN — no railing
  ]) {
    const r = box(rw, 0.7, rd, MATS.woodDark);
    r.position.set(rx, BAND_Y + 0.43, rz);
    addTo('floor2', r); grp.add(r);
  }
}
