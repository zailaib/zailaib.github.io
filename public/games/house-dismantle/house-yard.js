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

  // ═══════════════════════════════════════════════════════════════
  // YARD FENCE (low wall around front yard)
  // ═══════════════════════════════════════════════════════════════
  const fenceGrp = partGrp('yardFence', '院墙', '#9b8b70', []);

  function makeFencePost(x, z) {
    const post = box(0.1, 0.7, 0.1, MATS.fenceWood);
    post.position.set(x, FLOOR_H + 0.35, z);
    addTo('yardFence', post); fenceGrp.add(post);
    return post;
  }

  // Front fence line (south of house)
  const fenceY = HD2 + 2.5;
  for (let fx = -HW2 - 2; fx <= HW2 + 2; fx += 1.0) {
    makeFencePost(fx, fenceY);
  }
  // Horizontal rails
  const frontRail1 = box(HOUSE_W + 4.2, 0.06, 0.04, MATS.fenceWood);
  frontRail1.position.set(0, FLOOR_H + 0.25, fenceY);
  addTo('yardFence', frontRail1); fenceGrp.add(frontRail1);
  const frontRail2 = box(HOUSE_W + 4.2, 0.06, 0.04, MATS.fenceWood);
  frontRail2.position.set(0, FLOOR_H + 0.5, fenceY);
  addTo('yardFence', frontRail2); fenceGrp.add(frontRail2);

  // Side fences
  for (const sx of [-1, 1]) {
    const fx = sx * (HW2 + 2);
    for (let fz = -HD2 - 1; fz <= HD2 + 2.5; fz += 1.0) {
      makeFencePost(fx, fz);
    }
    const sideRail1 = box(0.06, 0.04, HOUSE_D + 3.9, MATS.fenceWood);
    sideRail1.position.set(fx, FLOOR_H + 0.25, (fenceY - HD2 - 1) / 2);
    addTo('yardFence', sideRail1); fenceGrp.add(sideRail1);
    const sideRail2 = box(0.06, 0.04, HOUSE_D + 3.9, MATS.fenceWood);
    sideRail2.position.set(fx, FLOOR_H + 0.5, (fenceY - HD2 - 1) / 2);
    addTo('yardFence', sideRail2); fenceGrp.add(sideRail2);
  }

  // Gate (front center, simple double gate)
  const gateL = box(0.06, 0.6, 1.2, MATS.woodDark);
  gateL.position.set(-0.4, FLOOR_H + 0.3, fenceY + 0.6);
  addTo('yardFence', gateL); fenceGrp.add(gateL);
  const gateR = box(0.06, 0.6, 1.2, MATS.woodDark);
  gateR.position.set(0.4, FLOOR_H + 0.3, fenceY + 0.6);
  addTo('yardFence', gateR); fenceGrp.add(gateR);

}
