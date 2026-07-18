/* House Dismantle — Rainwater Drainage System
   Traditional: no gutters — just corner downspouts +
   perimeter drainage ditch around the foundation. */

import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, EAVE_H, BASE_H, WALL_T, FLOOR_H, HW2, HD2 } from './config.js';

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
  const PIPE_R = 0.04; // thin pipe radius

  // ═══════════════════════════════════════════════════════════════
  // VERTICAL DOWNSPOUTS at 4 corners
  // Small pipes from eave to just below ground level
  // ═══════════════════════════════════════════════════════════════
  const corners = [
    [-HW2 + 0.15, -HD2 + 0.15], // back-left
    [ HW2 - 0.15, -HD2 + 0.15], // back-right
    [-HW2 + 0.15,  HD2 - 0.15], // front-left
    [ HW2 - 0.15,  HD2 - 0.15], // front-right
  ];

  for (const [cx, cz] of corners) {
    // Downspout pipe (from eave to below base)
    const pipeLen = EAVE_H - FLOOR_H + BASE_H + 0.6;
    const ds = cyl(PIPE_R, pipeLen, MATS.pipe);
    ds.position.set(cx, EAVE_H - pipeLen / 2, cz);
    addTo('pipelines', ds); pipeGrp.add(ds);

    // Small bracket at top (attaching to wall)
    const bracket = new THREE.Mesh(
      new THREE.TorusGeometry(PIPE_R + 0.02, 0.012, 4, 8), MATS.pipeJoint);
    bracket.position.set(cx, EAVE_H - 0.15, cz);
    addTo('pipelines', bracket); pipeGrp.add(bracket);

    // Drain opening at bottom (slightly wider, at ground level)
    const outletGeo = new THREE.CylinderGeometry(PIPE_R * 0.6, PIPE_R, 0.2, 6);
    const outlet = new THREE.Mesh(outletGeo, MATS.pipeJoint);
    outlet.position.set(cx, -BASE_H / 2 - 0.1, cz);
    addTo('pipelines', outlet); pipeGrp.add(outlet);
  }

  // ═══════════════════════════════════════════════════════════════
  // PERIMETER DRAINAGE DITCH (around the foundation base)
  // Shallow trench at ground level
  // ═══════════════════════════════════════════════════════════════
  const ditchY = -BASE_H - 0.05;
  const ditchDepth = 0.08;
  const ditchWidth = 0.25;

  // Front ditch
  const fDitch = box(HOUSE_W + 1.2, ditchDepth, ditchWidth, MATS.baseDark);
  fDitch.position.set(0, ditchY, HD2 + 0.55);
  addTo('pipelines', fDitch); pipeGrp.add(fDitch);

  // Back ditch
  const bDitch = box(HOUSE_W + 1.2, ditchDepth, ditchWidth, MATS.baseDark);
  bDitch.position.set(0, ditchY, -HD2 - 0.55);
  addTo('pipelines', bDitch); pipeGrp.add(bDitch);

  // Left ditch
  const lDitch = box(ditchWidth, ditchDepth, HOUSE_D + 0.9, MATS.baseDark);
  lDitch.position.set(-HW2 - 0.55, ditchY, 0);
  addTo('pipelines', lDitch); pipeGrp.add(lDitch);

  // Right ditch
  const rDitch = box(ditchWidth, ditchDepth, HOUSE_D + 0.9, MATS.baseDark);
  rDitch.position.set(HW2 + 0.55, ditchY, 0);
  addTo('pipelines', rDitch); pipeGrp.add(rDitch);

  // ═══════════════════════════════════════════════════════════════
  // UNDERGROUND OUTLET PIPES (extending outward from base)
  // Carry water from the ditch away from the house
  // ═══════════════════════════════════════════════════════════════
  const outletDepth = -BASE_H - 0.15;
  const outletLen = 1.8;

  for (const side of [-1, 1]) {
    // Back outlets (primary drainage direction)
    const pipe = cyl(PIPE_R * 0.8, outletLen, MATS.pipe);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(side * (HW2 / 2), outletDepth, -HD2 - 0.8);
    addTo('pipelines', pipe); pipeGrp.add(pipe);

    // Front outlets (secondary)
    const pipeF = cyl(PIPE_R * 0.8, outletLen, MATS.pipe);
    pipeF.rotation.x = Math.PI / 2;
    pipeF.position.set(side * (HW2 / 2), outletDepth, HD2 + 0.8);
    addTo('pipelines', pipeF); pipeGrp.add(pipeF);
  }

  // ═══════════════════════════════════════════════════════════════
  // RAIN BARREL (at back-right corner)
  // Collects rainwater for household use
  // ═══════════════════════════════════════════════════════════════
  const barrelGeo = new THREE.CylinderGeometry(0.25, 0.22, 0.7, 10);
  const barrel = new THREE.Mesh(barrelGeo, new THREE.MeshStandardMaterial({ color: 0x5a3a28, roughness: 0.6, metalness: 0.0 }));
  barrel.position.set(HW2 - 0.6, FLOOR_H + 0.35, -HD2 - 0.5);
  addTo('pipelines', barrel); pipeGrp.add(barrel);

  // Barrel lid
  const lid = box(0.52, 0.04, 0.52, MATS.woodDark);
  lid.position.set(HW2 - 0.6, FLOOR_H + 0.7, -HD2 - 0.5);
  addTo('pipelines', lid); pipeGrp.add(lid);
}
