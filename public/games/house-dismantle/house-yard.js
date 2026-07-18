/* House Dismantle — Yard Items (chickens, well, fence, haystack) */

import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_T, FLOOR_H, HW2, HD2 } from './config.js';

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}
function cyl(r, h, material, seg = 12) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), material);
}

export function buildYard(houseGroup, parts, MATS) {

  function partGrp(name, label, color, deps = []) {
    const g = new THREE.Group(); g.name = name;
    if (!parts.has(name)) {
      parts.set(name, { group: g, label, color, deps, assembled: true, meshArr: [] });
      houseGroup.add(g);
    }
    return parts.get(name).group;
  }
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  // ═══════════════════════════════════════════════════════════════
  // CHICKENS (left side of yard)
  // ═══════════════════════════════════════════════════════════════
  const chickenGrp = partGrp('chickens', '鸡', '#d4a030', []);

  function makeChicken(cx, cz, rotY = 0) {
    const cg = new THREE.Group();
    const bodyGeo = new THREE.SphereGeometry(0.16, 8, 6);
    bodyGeo.scale(1, 0.7, 1.3);
    const body = new THREE.Mesh(bodyGeo, MATS.chickenBody);
    body.position.y = 0.18;
    addTo('chickens', body); cg.add(body);
    const headGeo = new THREE.SphereGeometry(0.07, 6, 4);
    const head = new THREE.Mesh(headGeo, MATS.chickenBody);
    head.position.set(0, 0.25, 0.2);
    addTo('chickens', head); cg.add(head);
    const combGeo = new THREE.ConeGeometry(0.04, 0.07, 4);
    const comb = new THREE.Mesh(combGeo, MATS.chickenComb);
    comb.position.set(0, 0.32, 0.2);
    addTo('chickens', comb); cg.add(comb);
    const beakGeo = new THREE.ConeGeometry(0.015, 0.04, 4);
    const beak = new THREE.Mesh(beakGeo, MATS.chickenBeak);
    beak.position.set(0, 0.24, 0.27);
    beak.rotation.x = Math.PI/2;
    addTo('chickens', beak); cg.add(beak);
    for (const lx of [-0.03, 0.03]) {
      const leg = cyl(0.012, 0.08, MATS.woodLight, 4);
      leg.position.set(lx, 0.04, 0.04);
      addTo('chickens', leg); cg.add(leg);
    }
    cg.position.set(cx, FLOOR_H, cz);
    cg.rotation.y = rotY;
    return cg;
  }

  // Chickens in left yard
  for (const [cx, cz, ry] of [
    [-HW2-1.5, HD2-0.5, 0.3], [-HW2-2.0, HD2+1.0, -0.5],
    [-HW2-0.8, HD2+2.0, Math.PI*0.7], [-HW2-2.5, HD2-1.5, 1.2],
    [-HW2-1.0, HD2-2.0, -0.8],
  ]) {
    chickenGrp.add(makeChicken(cx, cz, ry));
  }

  // ═══════════════════════════════════════════════════════════════
  // WATER WELL (behind house, back-left)
  // ═══════════════════════════════════════════════════════════════
  const wellGrp = partGrp('well', '水井', '#7a7a7a', []);
  const wellX = -HW2-1.8, wellZ = -HD2-3.0;

  // Well base (stone ring)
  const wellRingGeo = new THREE.TorusGeometry(0.4, 0.15, 8, 16);
  const wellRing = new THREE.Mesh(wellRingGeo, MATS.wellStone);
  wellRing.position.set(wellX, FLOOR_H + 0.15, wellZ);
  wellRing.rotation.x = Math.PI/2;
  addTo('well', wellRing); wellGrp.add(wellRing);

  // Well wall (cylinder)
  const wellWallGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.6, 16, 1, true);
  const wellWall = new THREE.Mesh(wellWallGeo, MATS.wellStone);
  wellWall.position.set(wellX, FLOOR_H + 0.3, wellZ);
  addTo('well', wellWall); wellGrp.add(wellWall);

  // Well roof posts (4 posts)
  for (const [px, pz] of [[-0.3,-0.3],[-0.3,0.3],[0.3,-0.3],[0.3,0.3]]) {
    const post = box(0.05, 1.2, 0.05, MATS.wood);
    post.position.set(wellX + px, FLOOR_H + 1.0, wellZ + pz);
    addTo('well', post); wellGrp.add(post);
  }

  // Well roof (small gable)
  const roofGeo = new THREE.ConeGeometry(0.6, 0.3, 4);
  const wellRoof = new THREE.Mesh(roofGeo, MATS.wellRoof);
  wellRoof.position.set(wellX, FLOOR_H + 1.6, wellZ);
  wellRoof.rotation.y = Math.PI/4;
  addTo('well', wellRoof); wellGrp.add(wellRoof);

  // Rope and bucket
  const rope = cyl(0.02, 0.8, MATS.woodDark, 6);
  rope.position.set(wellX, FLOOR_H + 1.0, wellZ);
  addTo('well', rope); wellGrp.add(rope);
  const bucketGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.2, 8);
  const bucket = new THREE.Mesh(bucketGeo, MATS.woodDark);
  bucket.position.set(wellX, FLOOR_H + 0.55, wellZ);
  addTo('well', bucket); wellGrp.add(bucket);

}
