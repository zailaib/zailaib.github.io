/* House Dismantle — Plumbing (drainage pipes) */

import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, EAVE_H, ROOF_OH, HW2, HD2, FLOOR_H } from './config.js';

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}
function cyl(r, h, material, seg = 12) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), material);
}

export function buildPlumbing(houseGroup, parts, MATS) {

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

  const pipeGrp = partGrp('pipelines', '管道系统', '#8b6b4a', ['roofTiles']);
  const PIPE_R = 0.06;

  // Eave drain pipes (horizontal, under front & back eaves)
  for (const side of [-1, 1]) {
    const z = side * (HD2 + ROOF_OH * 0.6);
    const dp = cyl(PIPE_R, HOUSE_W + 0.8, MATS.pipe);
    dp.rotation.x = Math.PI / 2;
    dp.position.set(0, EAVE_H - 0.35, z);
    addTo('pipelines', dp); pipeGrp.add(dp);

    // Brackets every ~2m
    for (let bx = -HW2 + 0.5; bx <= HW2 - 0.5; bx += 2.5) {
      const br = new THREE.Mesh(
        new THREE.TorusGeometry(PIPE_R + 0.02, 0.015, 6, 12), MATS.pipeJoint);
      br.position.set(bx, EAVE_H - 0.35, z);
      addTo('pipelines', br); pipeGrp.add(br);
    }
  }

  // Vertical downspouts at back corners
  for (const side of [-1, 1]) {
    const x = side * (HW2 - 0.3);
    const z = -(HD2 + ROOF_OH * 0.6);

    const ds = cyl(PIPE_R * 0.9, EAVE_H - 0.35, MATS.pipe);
    ds.position.set(x, (EAVE_H - 0.35) / 2, z);
    addTo('pipelines', ds); pipeGrp.add(ds);

    // Elbow joint
    const elbow = new THREE.Mesh(
      new THREE.TorusGeometry(PIPE_R * 1.2, PIPE_R * 0.6, 6, 8, Math.PI / 2), MATS.pipeJoint);
    elbow.position.set(x, EAVE_H - 0.35, z);
    elbow.rotation.set(Math.PI / 2, 0, side > 0 ? Math.PI : 0);
    addTo('pipelines', elbow); pipeGrp.add(elbow);

    // Drain outlet
    const outletGeo = new THREE.CylinderGeometry(PIPE_R * 0.7, PIPE_R * 1.0, 0.25, 8);
    const outlet = new THREE.Mesh(outletGeo, MATS.pipeJoint);
    outlet.position.set(x, FLOOR_H - 0.1, z);
    addTo('pipelines', outlet); pipeGrp.add(outlet);
  }

  // Ground drain trench along the back
  const trench = box(HOUSE_W - 1.0, 0.06, 0.2, MATS.baseDark);
  trench.position.set(0, -0.2, -HD2 - 0.7);
  addTo('pipelines', trench); pipeGrp.add(trench);
}
