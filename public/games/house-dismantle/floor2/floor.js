/* 2F — floor platform */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_T, HW2, BAND_Y } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor2(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  const grp = parts.get('floor2').group;
  const slab = box(HOUSE_W - WALL_T * 2, 0.12, HOUSE_D - WALL_T * 2, MATS.concreteFloor);
  slab.position.set(0, BAND_Y + 0.06, 0);
  addTo('floor2', slab); grp.add(slab);

  // Concrete beams
  for (let jx = -HW2 + WALL_T + 0.5; jx <= HW2 - WALL_T - 0.5; jx += 1.2) {
    const beam = box(0.10, 0.15, HOUSE_D - WALL_T * 2, MATS.concreteFloor);
    beam.position.set(jx, BAND_Y - 0.04, 0);
    addTo('floor2', beam); grp.add(beam);
  }

  // Stairwell railing
  const srX = -1, srW = 2.0, srZ = -1.5, srD = 2.0;
  for (const [rx, rz, rw, rd] of [
    [srX - srW / 2, srZ, 0.04, srD],
    [srX + srW / 2, srZ, 0.04, srD],
    [srX, srZ - srD / 2, srW + 0.08, 0.04],
  ]) {
    const r = box(rw, 0.7, rd, MATS.woodDark);
    r.position.set(rx, BAND_Y + 0.43, rz);
    addTo('floor2', r); grp.add(r);
  }
}
