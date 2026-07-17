/* House Dismantle — Structural Elements (walls, roof, base, columns) */

import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, ROOF_H, EAVE_H, WALL_T, FLOOR_H, BASE_H, ROOF_OH, BAY_W, HW2, HD2, WY1, WY2, BAND_Y } from './config.js';

// ── Helpers ───────────────────────────────────────────────────────
function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

// ── Part registration helpers (passed in) ─────────────────────────

export function buildStructure(houseGroup, parts, MATS) {

  function partGrp(name, label, color, deps = []) {
    const g = new THREE.Group(); g.name = name;
    parts.set(name, { group: g, label, color, deps, assembled: true, meshArr: [] });
    houseGroup.add(g);
    return g;
  }
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  // ═══════════════════════════════════════════════════════════════
  // BASE (stone foundation)
  // ═══════════════════════════════════════════════════════════════
  const baseGrp = partGrp('base', '石基平台', '#6e6e6e', ['floor','columns']);
  const baseSlab = box(HOUSE_W + 1.0, BASE_H, HOUSE_D + 1.0, MATS.base);
  baseSlab.position.y = -BASE_H / 2;
  addTo('base', baseSlab); baseGrp.add(baseSlab);

  // Stone grooves
  for (let i = 0; i < 5; i++) {
    const z = -HOUSE_D/2 - 0.3 + i * (HOUSE_D + 0.6) / 4;
    const g = box(HOUSE_W + 1.05, 0.03, 0.04, MATS.baseDark);
    g.position.set(0, -0.02, z);
    addTo('base', g); baseGrp.add(g);
  }
  // Corner stones
  for (const [cx, cz] of [[-HW2-0.4,-HD2-0.4],[HW2+0.4,-HD2-0.4],[-HW2-0.4,HD2+0.4],[HW2+0.4,HD2+0.4]]) {
    const cs = box(0.7, BASE_H + 0.06, 0.7, MATS.cornerStone);
    cs.position.set(cx, -BASE_H/2 + 0.03, cz);
    addTo('base', cs); baseGrp.add(cs);
  }

  // ═══════════════════════════════════════════════════════════════
  // FLOOR PLATFORM
  // ═══════════════════════════════════════════════════════════════
  const floorGrp = partGrp('floor', '地板平台', '#908878',
    ['wallFront','wallBack','wallLeft','wallRight','interiorWall1','interiorWall2']);
  const floorSlab = box(HOUSE_W + 0.6, FLOOR_H, HOUSE_D + 0.6, MATS.floor);
  floorSlab.position.y = FLOOR_H / 2;
  addTo('floor', floorSlab); floorGrp.add(floorSlab);

  // Front step at left bay door
  const step = box(BAY_W * 0.8, 0.12, 1.2, MATS.floor);
  step.position.set(-BAY_W, FLOOR_H + 0.06, HD2 + 0.5);
  addTo('floor', step); floorGrp.add(step);

  // ═══════════════════════════════════════════════════════════════
  // COLUMNS
  // ═══════════════════════════════════════════════════════════════
  const colGrp = partGrp('columns', '木柱', '#6b3a20', ['roofFrame']);
  const colPositions = [
    [-HW2+0.3,HD2-0.3],[0,HD2-0.3],[HW2-0.3,HD2-0.3],
    [-HW2+0.3,-HD2+0.3],[0,-HD2+0.3],[HW2-0.3,-HD2+0.3],
    [-HW2+0.3,0],[HW2-0.3,0],
  ];
  for (const [cx, cz] of colPositions) {
    const colGeo = new THREE.CylinderGeometry(0.15, 0.17, WALL_H1 + FLOOR_H, 16);
    const col = new THREE.Mesh(colGeo, MATS.column);
    col.position.set(cx, (WALL_H1 + FLOOR_H)/2, cz);
    addTo('columns', col); colGrp.add(col);
  }

  // ═══════════════════════════════════════════════════════════════
  // FIRST FLOOR WALLS
  // ═══════════════════════════════════════════════════════════════
  function makeWall(name, label, color, w, h, d, px, py, pz, deps) {
    const grp = partGrp(name, label, color, deps);
    const m = box(w, h, d, MATS.wall);
    m.position.set(px, py, pz);
    addTo(name, m); grp.add(m);
    return grp;
  }
  makeWall('wallFront', '前墙(一层)', '#f2ece0', HOUSE_W, WALL_H1, WALL_T, 0, WY1, HD2, ['upperWallFront']);
  makeWall('wallBack',  '后墙(一层)', '#f2ece0', HOUSE_W, WALL_H1, WALL_T, 0, WY1, -HD2, ['upperWallBack']);
  makeWall('wallLeft',  '左墙(一层)', '#f2ece0', WALL_T, WALL_H1, HOUSE_D, -HW2, WY1, 0, ['upperWallLeft']);
  makeWall('wallRight', '右墙(一层)', '#f2ece0', WALL_T, WALL_H1, HOUSE_D, HW2, WY1, 0, ['upperWallRight']);

  // Interior walls
  for (const [name, x, deps] of [
    ['interiorWall1', -BAY_W/2, ['upperWallFront','upperWallBack']],
    ['interiorWall2',  BAY_W/2, ['upperWallFront','upperWallBack']],
  ]) {
    const grp = partGrp(name, name === 'interiorWall1' ? '隔墙(左)' : '隔墙(右)', '#ede6d8', deps);
    const wallD = HOUSE_D - WALL_T * 2;
    // Full wall as main surface
    const m = box(WALL_T * 0.8, WALL_H1, wallD, MATS.interior);
    m.position.set(x, WY1, 0);
    addTo(name, m); grp.add(m);
  }

  // ═══════════════════════════════════════════════════════════════
  // UPPER HALF-STORY WALLS
  // ═══════════════════════════════════════════════════════════════
  function makeUpperWall(name, label, color, w, h, d, px, py, pz, deps) {
    const grp = partGrp(name, label, color, deps);
    const m = box(w, h, d, MATS.upperWall);
    m.position.set(px, py, pz);
    addTo(name, m); grp.add(m);
    return grp;
  }
  makeUpperWall('upperWallFront', '前墙(二层)', '#d4c8b0', HOUSE_W, WALL_H2, WALL_T, 0, WY2, HD2, ['roofFrame']);
  makeUpperWall('upperWallBack',  '后墙(二层)', '#d4c8b0', HOUSE_W, WALL_H2, WALL_T, 0, WY2, -HD2, ['roofFrame']);
  makeUpperWall('upperWallLeft',  '山墙(左)',   '#ccc0a8', WALL_T, WALL_H2 + 0.5, HOUSE_D, -HW2, WY2 - 0.25, 0, ['roofFrame']);
  makeUpperWall('upperWallRight', '山墙(右)',   '#ccc0a8', WALL_T, WALL_H2 + 0.5, HOUSE_D, HW2, WY2 - 0.25, 0, ['roofFrame']);

  // ═══════════════════════════════════════════════════════════════
  // FLOOR SEPARATOR BANDS (visual ledge between 1F and 2F)
  // ═══════════════════════════════════════════════════════════════
  for (const [side, pw, pd, px, pz, pn] of [
    ['front', HOUSE_W + 0.05, WALL_T + 0.08, 0, HD2, 'upperWallFront'],
    ['back',  HOUSE_W + 0.05, WALL_T + 0.08, 0, -HD2, 'upperWallBack'],
    ['left',  WALL_T + 0.08, HOUSE_D + 0.05, -HW2, 0, 'upperWallLeft'],
    ['right', WALL_T + 0.08, HOUSE_D + 0.05, HW2, 0, 'upperWallRight'],
  ]) {
    const band = box(pw, 0.08, pd, MATS.band);
    band.position.set(px, BAND_Y, pz);
    addTo(pn, band); parts.get(pn).group.add(band);
  }

  // ═══════════════════════════════════════════════════════════════
  // ROOF FRAME (beams & purlins)
  // ═══════════════════════════════════════════════════════════════
  const rfGrp = partGrp('roofFrame', '屋架(梁檩)', '#5a3a28', ['roofTiles']);

  const ridgeBeam = box(HOUSE_W + 1.4, 0.15, 0.12, MATS.roofFrame);
  ridgeBeam.position.set(0, ROOF_H - 0.08, 0);
  addTo('roofFrame', ridgeBeam); rfGrp.add(ridgeBeam);

  for (const z of [-HD2 - 0.8, HD2 + 0.8]) {
    const p = box(HOUSE_W + 1.4, 0.1, 0.1, MATS.roofFrame);
    p.position.set(0, EAVE_H + 0.05, z);
    addTo('roofFrame', p); rfGrp.add(p);
  }

  // Rafters
  for (let i = 0; i < 11; i++) {
    const x = -HW2 - 0.5 + i * (HOUSE_W + 1) / 10;
    for (const side of [-1, 1]) {
      const rafterGeo = new THREE.BoxGeometry(0.06, 0.06, HD2 + 1.2);
      const rafter = new THREE.Mesh(rafterGeo, MATS.roofFrame);
      rafter.position.set(x, (ROOF_H + EAVE_H)/2, side * (HD2/2 + 0.25));
      rafter.rotation.x = side * Math.atan2(ROOF_H - EAVE_H, HD2 + 1);
      addTo('roofFrame', rafter); rfGrp.add(rafter);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ROOF TILES (gable roof)
  // ═══════════════════════════════════════════════════════════════
  const roofGrp = partGrp('roofTiles', '瓦片屋顶', '#4a4a5a', []);
  const rHW = HW2 + ROOF_OH + 0.1, rHD = HD2 + ROOF_OH + 0.1;
  const verts = new Float32Array([
    -rHW,ROOF_H,0,  rHW,ROOF_H,0,
    -rHW,EAVE_H,rHD,  rHW,EAVE_H,rHD,
    -rHW,EAVE_H,-rHD, rHW,EAVE_H,-rHD,
  ]);
  const idx = [0,1,3, 0,3,2,  0,5,1, 0,4,5,  0,2,4,  1,5,3];
  const roofGeo = new THREE.BufferGeometry();
  roofGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  roofGeo.setIndex(idx);
  roofGeo.computeVertexNormals();
  const roofMesh = new THREE.Mesh(roofGeo, MATS.roofTile);
  addTo('roofTiles', roofMesh); roofGrp.add(roofMesh);

  // Ridge cap
  const ridgeCap = box(HOUSE_W + 1.8, 0.2, 0.3, MATS.ridge);
  ridgeCap.position.set(0, ROOF_H + 0.1, 0);
  addTo('roofTiles', ridgeCap); roofGrp.add(ridgeCap);

  // Ridge end ornaments
  for (const side of [-1, 1]) {
    const tip = box(0.3, 0.1, 0.35, MATS.ridge);
    tip.position.set(side * (HW2 + 1.0), ROOF_H + 0.25, 0);
    tip.rotation.z = side * 0.15; tip.rotation.x = 0.1;
    addTo('roofTiles', tip); roofGrp.add(tip);
  }
}
