/* 2F  floor platform with stairwell opening (kept within back zone) */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_T, HW2, HD2, BAND_Y, CROSS_Z_BACK } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor2(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  const pFloor2 = parts.get('floor2');
  const grp = pFloor2.group;
  const T = 0.12; // slab thickness

  // Stairwell opening  entirely within back zone (z < CROSS_Z_BACK)
  // Stairs are in bay2 (x=-5..-0.5), back zone (z=-HD2..CROSS_Z_BACK)
  const sx0 = -4.5, sx1 = 0, sz0 = -HD2, sz1 = CROSS_Z_BACK;

  // Export opening bounds for validation
  pFloor2.stairwellOpening = { xMin: sx0, xMax: sx1, zMin: sz0, zMax: sz1, yFloor: BAND_Y };
  const lx = -HW2 + WALL_T, rx = HW2 - WALL_T;
  const bz = -HD2 + WALL_T, fz = HD2 - WALL_T;

  // 3 slabs: front (corridor + front rooms), left of opening, right of opening
  const slabs = [
    // Front slab: from sz1=CROSS_Z_BACK to fz=front wall, full width
    // This covers the corridor (CROSS_Z_BACK..CROSS_Z_FRONT) + front rooms
    { w: rx - lx, d: fz - sz1, x: 0, z: (sz1 + fz) / 2 },
    // Left of opening (x from lx to sx0, z from sz0 to sz1)
    { w: sx0 - lx, d: sz1 - sz0, x: (lx + sx0) / 2, z: (sz0 + sz1) / 2 },
    // Right of opening (x from sx1 to rx, z from sz0 to sz1)
    { w: rx - sx1, d: sz1 - sz0, x: (sx1 + rx) / 2, z: (sz0 + sz1) / 2 },
  ];
  for (const s of slabs) {
    const slab = box(s.w, T, s.d, MATS.concreteFloor);
    slab.position.set(s.x, BAND_Y + T/2, s.z);
    addTo('floor2', slab); grp.add(slab);
  }

  // Concrete beams  skip over opening area
  for (let jx = lx + 0.5; jx <= rx - 0.5; jx += 1.2) {
    if (jx > sx0 && jx < sx1) continue; // skip over opening
    const beam = box(0.10, 0.15, HOUSE_D - WALL_T * 2, MATS.concreteFloor);
    beam.position.set(jx, BAND_Y - 0.04, 0);
    addTo('floor2', beam); grp.add(beam);
  }

  // Stairwell railing  3 sides (inner/room-facing side open for entry)
  const srX = (sx0 + sx1) / 2, srW = sx1 - sx0, srZ = (sz0 + sz1) / 2, srD = sz1 - sz0;
  for (const [rx, rz, rw, rd] of [
    [sx0, srZ, 0.04, srD],           // left railing
    [sx1, srZ, 0.04, srD],           // right railing
    [srX, sz0, srW + 0.08, 0.04],    // back railing
    // Front side (toward corridor)  OPEN, no railing
  ]) {
    const r = box(rw, 0.7, rd, MATS.woodDark);
    r.position.set(rx, BAND_Y + 0.43, rz);
    addTo('floor2', r); grp.add(r);
  }
}
