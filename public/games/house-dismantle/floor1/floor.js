/* 1F — floor platform + front step */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, BAY_W, FLOOR_H, HW2, HD2 } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor1(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  const grp = parts.get('floor').group;
  const slab = box(HOUSE_W + 0.6, 0.08, HOUSE_D + 0.6, MATS.floor);
  slab.position.y = FLOOR_H + 0.04;
  addTo('floor', slab); grp.add(slab);

  // Front step at main entrance (bay3, x=2)
  const step = box(BAY_W * 0.5, 0.12, 1.5, MATS.floor);
  step.position.set(2, FLOOR_H + 0.10, HD2 + 0.5);
  addTo('floor', step); grp.add(step);
}
