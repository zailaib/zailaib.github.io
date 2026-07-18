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

}
