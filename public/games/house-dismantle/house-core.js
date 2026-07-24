/* Dabie Mountain 4-Bay 2-Story House — Structure */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, ROOF_H, EAVE_H, WALL_T, INT_WALL_T, FLOOR_H, BASE_H, ROOF_OH, ROOF_RISE, BAY_W, BAY_COUNT, HW2, HD2, WY1, WY2, BAND_Y } from './config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildStructure(houseGroup, parts, MATS) {
  function partGrp(name, label, color, deps = []) {
    const g = new THREE.Group(); g.name = name;
    parts.set(name, { group: g, label, color, deps, assembled: true, meshArr: [] });
    houseGroup.add(g); return g;
  }
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  // ═══════════════════════════════════════════════════════════════
  // STONE BASE with ventilation ducts
  // ═══════════════════════════════════════════════════════════════
  const baseGrp = partGrp('base', '石基平台', '#6e6e6e', ['floor', 'floor2', 'columns']);
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

  // ═══════════════════════════════════════════════════════════════
  // VENTILATION DUCTS (ground cooling)
  // ═══════════════════════════════════════════════════════════════
  const ventGrp = partGrp('ventDucts', '接地通风道', '#555555', ['base']);
  const ventW = 0.2, ventH = 0.3, ventD = 0.15;
  const ventY = -BASE_H + 0.18;
  for (let i = 0; i < 6; i++) {
    const x = -HW2 + 1.0 + i * (HOUSE_W - 2) / 5;
    // North vents (cool air intake)
    const vn = box(ventW, ventH, ventD, MATS.baseDark);
    vn.position.set(x, ventY, -HD2 - 0.45);
    addTo('ventDucts', vn); ventGrp.add(vn);
    // South vents (warm air exhaust)
    const vs = box(ventW, ventH, ventD, MATS.baseDark);
    vs.position.set(x, ventY, HD2 + 0.45);
    addTo('ventDucts', vs); ventGrp.add(vs);
  }

  // ═══════════════════════════════════════════════════════════════
  // FLOOR PLATFORM (ground floor)
  // ═══════════════════════════════════════════════════════════════
  const floorGrp = partGrp('floor', '一层地板', '#908878', ['wallFront', 'wallBack', 'wallLeft', 'wallRight', 'interiorWalls']);
  const floorSlab = box(HOUSE_W + 0.6, 0.08, HOUSE_D + 0.6, MATS.floor);
  floorSlab.position.y = FLOOR_H + 0.04;
  addTo('floor', floorSlab); floorGrp.add(floorSlab);

  // Front step at main entrance (bay3, x=2)
  const step = box(BAY_W * 0.5, 0.12, 1.5, MATS.floor);
  step.position.set(2, FLOOR_H + 0.10, HD2 + 0.5);
  addTo('floor', step); floorGrp.add(step);

  // ═══════════════════════════════════════════════════════════════
  // COLUMNS — 14 total (5 front + 5 back + 4 middle, skip x=0 for stairs)
  // ═══════════════════════════════════════════════════════════════
  const colGrp = partGrp('columns', '木柱', '#6b3a20', ['roofFrame']);
  const colXs = [-HW2 + 0.3, -HW2 + BAY_W - 0.3, 0, HW2 - BAY_W + 0.3, HW2 - 0.3];
  const frontZ = HD2 - 0.3, backZ = -HD2 + 0.3, midZ = 0;

  // Front + back row (5 each)
  for (const cx of colXs) {
    for (const cz of [frontZ, backZ]) {
      const colGeo = new THREE.CylinderGeometry(0.15, 0.17, WALL_H1 + WALL_H2 + 0.3, 12);
      const col = new THREE.Mesh(colGeo, MATS.column);
      col.position.set(cx, FLOOR_H + (WALL_H1 + WALL_H2) / 2, cz);
      addTo('columns', col); colGrp.add(col);
    }
  }
  // Middle row — skip x=0 (stairwell at bay2-3 junction)
  const midColXs = [-HW2 + 0.3, -HW2 + BAY_W - 0.3, HW2 - BAY_W + 0.3, HW2 - 0.3];
  for (const cx of midColXs) {
    const colGeo = new THREE.CylinderGeometry(0.15, 0.17, WALL_H1 + WALL_H2 + 0.3, 12);
    const col = new THREE.Mesh(colGeo, MATS.column);
    col.position.set(cx, FLOOR_H + (WALL_H1 + WALL_H2) / 2, midZ);
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
  makeWall('wallBack', '后墙(一层)', '#f2ece0', HOUSE_W, WALL_H1, WALL_T, 0, WY1, -HD2, ['upperWallBack']);
  makeWall('wallLeft', '左墙(一层)', '#f2ece0', WALL_T, WALL_H1, HOUSE_D, -HW2, WY1, 0, ['upperWallLeft']);
  makeWall('wallRight', '右墙(一层)', '#f2ece0', WALL_T, WALL_H1, HOUSE_D, HW2, WY1, 0, ['upperWallRight']);

  // ═══════════════════════════════════════════════════════════════
  // INTERIOR WALLS — 1F (3 longitudinal dividers + 1 cross wall at z=0)
  // ═══════════════════════════════════════════════════════════════
  const iwGrp = partGrp('interiorWalls', '一层内隔墙', '#ede6d8', ['upperWallFront', 'upperWallBack']);

  // 3 longitudinal walls at x = -BAY_W, 0, BAY_W
  for (const ix of [-BAY_W, 0, BAY_W]) {
    const iw = box(INT_WALL_T, WALL_H1, HOUSE_D - WALL_T * 2, MATS.interior);
    iw.position.set(ix, WY1, 0);
    addTo('interiorWalls', iw); iwGrp.add(iw);
  }

  // Cross wall at z=0 — 4 segments with doorways between bays
  const doorWidth = 0.9;
  for (let b = 0; b < BAY_COUNT; b++) {
    const bx = -HW2 + b * BAY_W + BAY_W / 2;  // bay center
    const halfSeg = (BAY_W - INT_WALL_T * 2 - doorWidth) / 2;
    for (const side of [-1, 1]) {
      const seg = box(halfSeg, WALL_H1, INT_WALL_T, MATS.interior);
      seg.position.set(bx + side * (halfSeg / 2 + doorWidth / 2), WY1, 0);
      addTo('interiorWalls', seg); iwGrp.add(seg);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SECOND FLOOR PLATFORM
  // ═══════════════════════════════════════════════════════════════
  const f2Grp = partGrp('floor2', '二层地板', '#a08060', ['upperWallFront', 'upperWallBack', 'upperWallLeft', 'upperWallRight']);
  const f2Slab = box(HOUSE_W - WALL_T * 2, 0.08, HOUSE_D - WALL_T * 2, MATS.woodLight);
  f2Slab.position.set(0, BAND_Y + 0.04, 0);
  addTo('floor2', f2Slab); f2Grp.add(f2Slab);

  // Joists
  for (let jx = -HW2 + WALL_T + 0.5; jx <= HW2 - WALL_T - 0.5; jx += 1.2) {
    const joist = box(0.08, 0.12, HOUSE_D - WALL_T * 2, MATS.woodDark);
    joist.position.set(jx, BAND_Y - 0.02, 0);
    addTo('floor2', joist); f2Grp.add(joist);
  }

  // Stairwell railing (around opening at bay2-3 rear area)
  const srX = -1, srW = 2.0, srZ = -1.5, srD = 2.0;
  for (const [rx, rz, rw, rd] of [
    [srX - srW / 2, srZ, 0.04, srD],
    [srX + srW / 2, srZ, 0.04, srD],
    [srX, srZ - srD / 2, srW + 0.08, 0.04],
  ]) {
    const r = box(rw, 0.7, rd, MATS.woodDark);
    r.position.set(rx, BAND_Y + 0.43, rz);
    addTo('floor2', r); f2Grp.add(r);
  }

  // ═══════════════════════════════════════════════════════════════
  // SECOND FLOOR WALLS (full height)
  // ═══════════════════════════════════════════════════════════════
  function makeUpperWall(name, label, color, w, h, d, px, py, pz, deps) {
    const grp = partGrp(name, label, color, deps);
    const m = box(w, h, d, MATS.wall);
    m.position.set(px, py, pz);
    addTo(name, m); grp.add(m);
    return grp;
  }
  makeUpperWall('upperWallFront', '前墙(二层)', '#f2ece0', HOUSE_W, WALL_H2, WALL_T, 0, WY2, HD2, ['roofFrame']);
  makeUpperWall('upperWallBack', '后墙(二层)', '#f2ece0', HOUSE_W, WALL_H2, WALL_T, 0, WY2, -HD2, ['roofFrame']);
  // Gable walls extend up into roof triangle
  const gableH = EAVE_H - BAND_Y + ROOF_RISE * 0.4;
  makeUpperWall('upperWallLeft', '山墙(左)', '#f2ece0', WALL_T, gableH, HOUSE_D, -HW2, BAND_Y + gableH / 2, 0, ['roofFrame']);
  makeUpperWall('upperWallRight', '山墙(右)', '#f2ece0', WALL_T, gableH, HOUSE_D, HW2, BAND_Y + gableH / 2, 0, ['roofFrame']);

  // Upper ventilation windows (small, in front/back upper walls)
  for (const [side, z] of [['upperWallFront', HD2 + 0.03], ['upperWallBack', -HD2 - 0.03]]) {
    const up = parts.get(side); if (!up) continue;
    for (const bx of [-HW2 + BAY_W / 2, -HW2 + 3 * BAY_W / 2, HW2 - BAY_W / 2]) {
      const frame = box(0.5, 0.5, 0.08, MATS.window);
      frame.position.set(bx, WY2, z);
      addTo(side, frame); up.group.add(frame);
      // Offset mullions to avoid z-fighting
      const mh = box(0.4, 0.04, 0.09, MATS.window);
      mh.position.set(bx, WY2, z + 0.01);
      addTo(side, mh); up.group.add(mh);
      const mv = box(0.04, 0.4, 0.09, MATS.window);
      mv.position.set(bx, WY2, z - 0.01);
      addTo(side, mv); up.group.add(mv);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FLOOR BANDS (decorative ledge between 1F and 2F)
  // ═══════════════════════════════════════════════════════════════
  for (const [pn, pw, pd, px, pz] of [
    ['upperWallFront', HOUSE_W + 0.05, WALL_T + 0.08, 0, HD2],
    ['upperWallBack', HOUSE_W + 0.05, WALL_T + 0.08, 0, -HD2],
    ['upperWallLeft', WALL_T + 0.08, HOUSE_D + 0.05, -HW2, 0],
    ['upperWallRight', WALL_T + 0.08, HOUSE_D + 0.05, HW2, 0],
  ]) {
    const band = box(pw, 0.08, pd, MATS.band);
    band.position.set(px, BAND_Y, pz);
    addTo(pn, band); parts.get(pn).group.add(band);
  }

  // ═══════════════════════════════════════════════════════════════
  // ROOF FRAME
  // ═══════════════════════════════════════════════════════════════
  const rfGrp = partGrp('roofFrame', '屋架梁檩', '#5a3a28', ['roofTiles']);
  const ridgeBeam = box(HOUSE_W + 1.4, 0.15, 0.12, MATS.roofFrame);
  ridgeBeam.position.set(0, ROOF_H - 0.08, 0);
  addTo('roofFrame', ridgeBeam); rfGrp.add(ridgeBeam);

  for (const z of [-HD2 - 0.8, HD2 + 0.8]) {
    const p = box(HOUSE_W + 1.4, 0.1, 0.1, MATS.roofFrame);
    p.position.set(0, EAVE_H + 0.05, z);
    addTo('roofFrame', p); rfGrp.add(p);
  }

  // Rafters
  const rafterCount = 13;
  for (let i = 0; i < rafterCount; i++) {
    const x = -HW2 - 0.5 + i * (HOUSE_W + 1) / (rafterCount - 1);
    for (const side of [-1, 1]) {
      const halfSpan = HD2 + ROOF_OH;
      const rafterGeo = new THREE.BoxGeometry(0.06, 0.06, halfSpan);
      const rafter = new THREE.Mesh(rafterGeo, MATS.roofFrame);
      rafter.position.set(x, (ROOF_H + EAVE_H) / 2, side * (halfSpan / 2 - ROOF_OH / 2));
      rafter.rotation.x = side * Math.atan2(ROOF_H - EAVE_H, halfSpan);
      addTo('roofFrame', rafter); rfGrp.add(rafter);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ROOF TILES (gable roof)
  // ═══════════════════════════════════════════════════════════════
  const roofGrp = partGrp('roofTiles', '青瓦屋顶', '#4a4a5a', []);
  const rHW = HW2 + ROOF_OH + 0.1, rHD = HD2 + ROOF_OH + 0.1;
  const verts = new Float32Array([
    -rHW, ROOF_H, 0, rHW, ROOF_H, 0,
    -rHW, EAVE_H, rHD, rHW, EAVE_H, rHD,
    -rHW, EAVE_H, -rHD, rHW, EAVE_H, -rHD,
  ]);
  const idx = [0, 1, 3, 0, 3, 2, 0, 5, 1, 0, 4, 5, 0, 2, 4, 1, 5, 3];
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

  for (const side of [-1, 1]) {
    const tip = box(0.3, 0.1, 0.35, MATS.ridge);
    tip.position.set(side * (HW2 + 1.0), ROOF_H + 0.25, 0);
    tip.rotation.z = side * 0.15; tip.rotation.x = 0.1;
    addTo('roofTiles', tip); roofGrp.add(tip);
  }
}
