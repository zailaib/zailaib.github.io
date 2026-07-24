/* Base — foundation, columns, plumbing */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, BASE_H, WALL_T, FLOOR_H, EAVE_H, ROOF_OH, HW2, HD2 } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
function cyl(r, h, m, s = 10) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, s), m); }

export function buildBase(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  // ── Stone base ──
  const baseGrp = parts.get('base').group;
  const bx = HOUSE_W + 1.0, bz = HOUSE_D + 1.0;
  const baseSlab = box(bx, BASE_H, bz, MATS.base);
  baseSlab.position.y = -BASE_H / 2;
  addTo('base', baseSlab); baseGrp.add(baseSlab);

  // Corner stones
  for (const [cx, cz] of [[-HW2 - 0.4, -HD2 - 0.4], [HW2 + 0.4, -HD2 - 0.4], [-HW2 - 0.4, HD2 + 0.4], [HW2 + 0.4, HD2 + 0.4]]) {
    const cs = box(0.7, BASE_H + 0.06, 0.7, MATS.cornerStone);
    cs.position.set(cx, -BASE_H / 2 + 0.03, cz);
    addTo('base', cs); baseGrp.add(cs);
  }

  // Stone grooves
  for (let i = 0; i < 7; i++) {
    const z = -HOUSE_D / 2 - 0.3 + i * (HOUSE_D + 0.6) / 6;
    const g = box(HOUSE_W + 1.05, 0.03, 0.04, MATS.baseDark);
    g.position.set(0, -0.02, z);
    addTo('base', g); baseGrp.add(g);
  }

  // ── Vent ducts ──
  const ventGrp = parts.get('ventDucts').group;
  const ventW = 0.2, ventH = 0.3, ventD = 0.15, ventY = -BASE_H + 0.18;
  for (let i = 0; i < 6; i++) {
    const x = -HW2 + 1.0 + i * (HOUSE_W - 2) / 5;
    for (const z of [-HD2 - 0.45, HD2 + 0.45]) {
      const v = box(ventW, ventH, ventD, MATS.baseDark);
      v.position.set(x, ventY, z);
      addTo('ventDucts', v); ventGrp.add(v);
    }
  }

  // ── Columns (concrete) — new bay boundaries: -5, -0.5, +4.5 ──
  const colGrp = parts.get('columns').group;
  const colXs = [-7.5, -5, -0.5, 4.5, 7.5]; // near bay boundaries
  const frontZ = HD2 - 0.3, backZ = -HD2 + 0.3;
  for (const cx of colXs) {
    for (const cz of [frontZ, backZ]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, WALL_H1 + WALL_H2 + 0.3, 12), MATS.column);
      col.position.set(cx, FLOOR_H + (WALL_H1 + WALL_H2) / 2, cz);
      addTo('columns', col); colGrp.add(col);
    }
  }

  // ── Plumbing — perimeter stone ditch ──
  const pipeGrp = parts.get('pipelines').group;
  const ditchY = -BASE_H - 0.02, ditchW = 0.35, ditchD = 0.06, ditchOff = 0.25;
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.8, metalness: 0.05 });

  function makeDitch(len, x, z, ry = 0) {
    const yOff = (ry > 0 ? 0.002 : 0);
    const bottom = box(len, ditchD, ditchW * 0.85, MATS.baseDark);
    bottom.position.set(x, ditchY + yOff, z); bottom.rotation.y = ry;
    addTo('pipelines', bottom); pipeGrp.add(bottom);
    for (const so of [-1, 1]) {
      const lip = box(len, ditchD + 0.02, 0.05, stoneMat);
      lip.position.set(x, ditchY + 0.01 + yOff, z + so * ditchW / 2); lip.rotation.y = ry;
      addTo('pipelines', lip); pipeGrp.add(lip);
    }
  }

  makeDitch(HOUSE_W + ROOF_OH*2 - 0.6, 0, HD2+WALL_T/2+ditchOff, 0);
  makeDitch(HOUSE_W + ROOF_OH*2 - 0.6, 0, -HD2-WALL_T/2-ditchOff, 0);
  makeDitch(HOUSE_D + ROOF_OH*2 - 0.6, -HW2-WALL_T/2-ditchOff, 0, Math.PI/2);
  makeDitch(HOUSE_D + ROOF_OH*2 - 0.6, HW2+WALL_T/2+ditchOff, 0, Math.PI/2);

  // Corner splash blocks
  const corners = [[-HW2 + 0.3, -HD2 + 0.3], [HW2 - 0.3, -HD2 + 0.3], [-HW2 + 0.3, HD2 - 0.3], [HW2 - 0.3, HD2 - 0.3]];
  for (const [cx, cz] of corners) {
    const pad = box(0.4, 0.04, 0.4, stoneMat); pad.position.set(cx, -BASE_H + 0.02, cz);
    addTo('pipelines', pad); pipeGrp.add(pad);
  }

  // Rain barrel
  const barrelX = -HW2 + 0.5, barrelZ = -HD2 - WALL_T / 2 - 0.15;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.65, 10), new THREE.MeshStandardMaterial({ color: 0x5a3a28, roughness: 0.6 }));
  barrel.position.set(barrelX, FLOOR_H + 0.08, barrelZ);
  addTo('pipelines', barrel); pipeGrp.add(barrel);
  const lid = box(0.48, 0.03, 0.48, MATS.woodDark); lid.position.set(barrelX + 0.05, FLOOR_H + 0.41, barrelZ); lid.rotation.z = 0.15;
  addTo('pipelines', lid); pipeGrp.add(lid);
  const stand = box(0.55, 0.06, 0.55, MATS.wood); stand.position.set(barrelX, FLOOR_H - 0.28, barrelZ);
  addTo('pipelines', stand); pipeGrp.add(stand);
}
