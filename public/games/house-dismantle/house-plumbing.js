/* House Dismantle — Rainwater Drainage System (Redesigned)
   Traditional Dabie Mountain: eaves drip → perimeter stone ditch (散水)
   → sloped exit at low corner. No buried pipes. */

import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, EAVE_H, BASE_H, WALL_T, FLOOR_H, ROOF_OH, HW2, HD2 } from './config.js';

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}
function cyl(r, h, material, seg = 10) {
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

  const pipeGrp = partGrp('pipelines', '排水系统', '#8b6b4a', ['base']);

  // ═══════════════════════════════════════════════════════════════
  // PERIMETER STONE DITCH (散水明沟) — around the foundation
  // Catches roof runoff dripping from the eaves overhang
  // ═══════════════════════════════════════════════════════════════
  const ditchY = -BASE_H - 0.02;
  const ditchW = 0.35;  // width of the ditch channel
  const ditchD = 0.06;  // shallow depth
  const ditchOff = 0.25; // offset from wall face (under the eave drip line)

  // Stone lining material — slightly darker/rougher than base
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.8, metalness: 0.05 });

  function makeDitchSegment(len, x, z, ry = 0) {
    // Bottom of the ditch
    const bottom = box(len, ditchD, ditchW * 0.85, MATS.baseDark);
    bottom.position.set(x, ditchY, z);
    bottom.rotation.y = ry;
    addTo('pipelines', bottom); pipeGrp.add(bottom);

    // Two side stones (inner + outer lip)
    for (const so of [-1, 1]) {
      const lip = box(len, ditchD + 0.02, 0.05, stoneMat);
      lip.position.set(x, ditchY + 0.01, z + so * ditchW / 2);
      lip.rotation.y = ry;
      addTo('pipelines', lip); pipeGrp.add(lip);
    }
  }

  // Front ditch
  makeDitchSegment(HOUSE_W + ROOF_OH * 2 - 0.6, 0, HD2 + WALL_T / 2 + ditchOff);
  // Back ditch
  makeDitchSegment(HOUSE_W + ROOF_OH * 2 - 0.6, 0, -HD2 - WALL_T / 2 - ditchOff);
  // Left ditch
  makeDitchSegment(HOUSE_D + ROOF_OH * 2 - 0.6, -HW2 - WALL_T / 2 - ditchOff, 0, Math.PI / 2);
  // Right ditch
  makeDitchSegment(HOUSE_D + ROOF_OH * 2 - 0.6, HW2 + WALL_T / 2 + ditchOff, 0, Math.PI / 2);

  // ═══════════════════════════════════════════════════════════════
  // CORNER SPLASH BLOCKS — stone pad under each eave corner
  // Where the heaviest drip concentrates
  // ═══════════════════════════════════════════════════════════════
  const corners = [
    [-HW2 + 0.3, -HD2 + 0.3], // back-left
    [ HW2 - 0.3, -HD2 + 0.3], // back-right
    [-HW2 + 0.3,  HD2 - 0.3], // front-left
    [ HW2 - 0.3,  HD2 - 0.3], // front-right
  ];

  for (const [cx, cz] of corners) {
    const pad = box(0.4, 0.04, 0.4, stoneMat);
    pad.position.set(cx, -BASE_H + 0.02, cz);
    addTo('pipelines', pad); pipeGrp.add(pad);
  }

  // ═══════════════════════════════════════════════════════════════
  // DRAINAGE EXIT — back-right corner, where water flows out
  // A short open channel sloping away from the house
  // ═══════════════════════════════════════════════════════════════
  const exitX = HW2 - 0.3, exitZ = -HD2 - WALL_T / 2 - ditchOff - ditchW / 2;

  // Exit channel — shallow open trough, extends just past the ditch
  const exitLen = 0.8, exitW = 0.22;
  const exitBottom = box(exitW, 0.03, exitLen, MATS.baseDark);
  exitBottom.position.set(exitX, ditchY - 0.03, exitZ - exitLen / 2);
  addTo('pipelines', exitBottom); pipeGrp.add(exitBottom);

  // Side guides
  for (const sx of [-1, 1]) {
    const guide = box(0.04, 0.06, exitLen, stoneMat);
    guide.position.set(exitX + sx * exitW / 2, ditchY + 0.01, exitZ - exitLen / 2);
    addTo('pipelines', guide); pipeGrp.add(guide);
  }

  // Small gravel catch basin at the exit end
  const basin = box(exitW + 0.15, 0.02, 0.3, MATS.baseDark);
  basin.position.set(exitX, ditchY - 0.06, exitZ - exitLen);
  addTo('pipelines', basin); pipeGrp.add(basin);

  // ═══════════════════════════════════════════════════════════════
  // RAIN BARREL — at back-left corner, under eave drip line
  // Collects water for garden use
  // ═══════════════════════════════════════════════════════════════
  const barrelX = -HW2 + 0.5, barrelZ = -HD2 - WALL_T / 2 - 0.15;

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.22, 0.65, 10),
    new THREE.MeshStandardMaterial({ color: 0x5a3a28, roughness: 0.6, metalness: 0.0 }));
  barrel.position.set(barrelX, FLOOR_H + 0.08, barrelZ);
  addTo('pipelines', barrel); pipeGrp.add(barrel);

  // Barrel lid (slightly open)
  const lid = box(0.48, 0.03, 0.48, MATS.woodDark);
  lid.position.set(barrelX + 0.05, FLOOR_H + 0.41, barrelZ);
  lid.rotation.z = 0.15;
  addTo('pipelines', lid); pipeGrp.add(lid);

  // Small wooden stand under barrel
  const stand = box(0.55, 0.06, 0.55, MATS.wood);
  stand.position.set(barrelX, FLOOR_H - 0.28, barrelZ);
  addTo('pipelines', stand); pipeGrp.add(stand);
}
