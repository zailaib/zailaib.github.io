/* House Dismantle — House Geometry Builder */

import * as THREE from 'three';
import {
  HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, ROOF_H, EAVE_H,
  WALL_T, FLOOR_H, BASE_H, ROOF_OH, BAY_W, HW2, HD2, WY1, WY2,
} from './config.js';

// ── Helpers ───────────────────────────────────────────────────────

function box(w, h, d, material) {
  const geo = new THREE.BoxGeometry(w, h, d);
  return new THREE.Mesh(geo, material);
}

function cylinder(radius, length, material) {
  const geo = new THREE.CylinderGeometry(radius, radius, length, 12);
  return new THREE.Mesh(geo, material);
}

// ── Build function ────────────────────────────────────────────────

/**
 * Build the entire house into houseGroup.
 * Populates `parts` map with metadata for each part.
 * @param {THREE.Group} houseGroup — root group
 * @param {Map} parts — part name → { group, label, color, deps[], assembled, meshArr }
 * @param {Object} MATS — materials
 */
export function buildHouse(houseGroup, parts, MATS) {

  // Helper: create a part group and register it
  function partGrp(name, label, color, deps = []) {
    const g = new THREE.Group();
    g.name = name;
    parts.set(name, {
      group: g, label, color, deps,
      assembled: true, meshArr: [],
    });
    houseGroup.add(g);
    return g;
  }

  // Helper: add mesh to a part
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) {
      p.meshArr.push(mesh);
      mesh.userData.partName = name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  }

  // ── Base (stone foundation) ───────────────────────────────────
  const baseGrp = partGrp('base', '石基平台', '#6e6e6e', ['floor', 'columns']);
  const baseSlab = box(HOUSE_W + 1.0, BASE_H, HOUSE_D + 1.0, MATS.base);
  baseSlab.position.y = -BASE_H / 2;
  addTo('base', baseSlab); baseGrp.add(baseSlab);

  // Stone grooves
  for (let i = 0; i < 5; i++) {
    const z = -HOUSE_D / 2 - 0.3 + i * (HOUSE_D + 0.6) / 4;
    const g = box(HOUSE_W + 1.05, 0.03, 0.04, MATS.baseDark);
    g.position.set(0, -0.02, z);
    addTo('base', g); baseGrp.add(g);
  }
  // Corner stones
  for (const [cx, cz] of [[-HW2-0.4,-HD2-0.4],[HW2+0.4,-HD2-0.4],[-HW2-0.4,HD2+0.4],[HW2+0.4,HD2+0.4]]) {
    const cs = box(0.7, BASE_H + 0.06, 0.7, MATS.cornerStone);
    cs.position.set(cx, -BASE_H / 2 + 0.03, cz);
    addTo('base', cs); baseGrp.add(cs);
  }

  // ── Floor platform ────────────────────────────────────────────
  const floorGrp = partGrp('floor', '地板平台', '#908878', [
    'wallFront', 'wallBack', 'wallLeft', 'wallRight',
    'interiorWall1', 'interiorWall2',
  ]);
  const floorSlab = box(HOUSE_W + 0.6, FLOOR_H, HOUSE_D + 0.6, MATS.floor);
  floorSlab.position.y = FLOOR_H / 2;
  addTo('floor', floorSlab); floorGrp.add(floorSlab);

  // Front step (at left bay door)
  const step = box(BAY_W * 0.8, 0.12, 1.2, MATS.floor);
  step.position.set(-BAY_W, FLOOR_H + 0.06, HD2 + 0.5);
  addTo('floor', step); floorGrp.add(step);

  // ── Columns ───────────────────────────────────────────────────
  const colGrp = partGrp('columns', '木柱', '#6b3a20', ['roofFrame']);
  const colPositions = [
    [-HW2+0.3,HD2-0.3],[0,HD2-0.3],[HW2-0.3,HD2-0.3], // front
    [-HW2+0.3,-HD2+0.3],[0,-HD2+0.3],[HW2-0.3,-HD2+0.3], // back
    [-HW2+0.3,0],[HW2-0.3,0], // side centers
  ];
  for (const [cx, cz] of colPositions) {
    const colGeo = new THREE.CylinderGeometry(0.15, 0.17, WALL_H1 + FLOOR_H, 16);
    const col = new THREE.Mesh(colGeo, MATS.column);
    col.position.set(cx, (WALL_H1 + FLOOR_H) / 2, cz);
    addTo('columns', col); colGrp.add(col);
  }

  // ── First Floor Walls ─────────────────────────────────────────
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

  // Interior walls with doorways
  for (const [name, label, x, deps] of [
    ['interiorWall1', '隔墙(左)', -BAY_W/2, ['upperWallFront','upperWallBack']],
    ['interiorWall2', '隔墙(右)',  BAY_W/2, ['upperWallFront','upperWallBack']],
  ]) {
    const grp = partGrp(name, label, '#ede6d8', deps);
    // Split wall into two segments (above door + beside door) to create a doorway
    const wallD = HOUSE_D - WALL_T * 2;
    const doorH = 2.1, doorW = 0.9;
    // Upper segment (above door)
    const upper = box(WALL_T * 0.8, WALL_H1 - doorH - 0.1, wallD, MATS.interior);
    upper.position.set(x, WY1 + doorH/2 + 0.05, 0);
    addTo(name, upper); grp.add(upper);
    // Side segments (left and right of door, toward front)
    // Simplified: just add a door-like darker panel
    const doorPanel = box(doorW, doorH, 0.06, MATS.interiorDoor);
    doorPanel.position.set(x, FLOOR_H + doorH/2, -HD2 + 0.8);
    addTo(name, doorPanel); grp.add(doorPanel);
  }

  // ── Floor separator band (visual ledge between floors) ────────
  const bandY = WALL_H1 + FLOOR_H;
  // Front band
  const bandFront = box(HOUSE_W + 0.05, 0.08, WALL_T + 0.08, MATS.band);
  bandFront.position.set(0, bandY, HD2);
  addTo('upperWallFront', bandFront); parts.get('upperWallFront').group.add(bandFront);
  // Back band
  const bandBack = box(HOUSE_W + 0.05, 0.08, WALL_T + 0.08, MATS.band);
  bandBack.position.set(0, bandY, -HD2);
  addTo('upperWallBack', bandBack); parts.get('upperWallBack').group.add(bandBack);
  // Side bands
  for (const sx of [-HW2, HW2]) {
    const band = box(WALL_T + 0.08, 0.08, HOUSE_D + 0.05, MATS.band);
    band.position.set(sx, bandY, 0);
    const pn = sx < 0 ? 'upperWallLeft' : 'upperWallRight';
    addTo(pn, band); parts.get(pn).group.add(band);
  }

  // ── Upper Half-Story Walls ────────────────────────────────────
  function makeUpperWall(name, label, color, w, h, d, px, py, pz, deps) {
    const grp = partGrp(name, label, color, deps);
    const m = box(w, h, d, MATS.upperWall);
    m.position.set(px, py, pz);
    addTo(name, m); grp.add(m);
    return grp;
  }
  makeUpperWall('upperWallFront', '前墙(二层)', '#d4c8b0', HOUSE_W, WALL_H2, WALL_T, 0, WY2, HD2, ['roofFrame']);
  makeUpperWall('upperWallBack',  '后墙(二层)', '#d4c8b0', HOUSE_W, WALL_H2, WALL_T, 0, WY2, -HD2, ['roofFrame']);
  // Gable walls (slightly taller to fill the roof triangle)
  makeUpperWall('upperWallLeft',  '山墙(左)', '#ccc0a8', WALL_T, WALL_H2 + 0.5, HOUSE_D, -HW2, WY2 - 0.25, 0, ['roofFrame']);
  makeUpperWall('upperWallRight', '山墙(右)', '#ccc0a8', WALL_T, WALL_H2 + 0.5, HOUSE_D, HW2, WY2 - 0.25, 0, ['roofFrame']);

  // ── Roof Frame (beams & purlins) ──────────────────────────────
  const rfGrp = partGrp('roofFrame', '屋架(梁檩)', '#5a3a28', ['roofTiles']);
  // Ridge purlin
  const ridgeBeam = box(HOUSE_W + 1.4, 0.15, 0.12, MATS.roofFrame);
  ridgeBeam.position.set(0, ROOF_H - 0.08, 0);
  addTo('roofFrame', ridgeBeam); rfGrp.add(ridgeBeam);
  // Eave purlins
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
      const zMid = side * (HD2 / 2 + 0.25);
      rafter.position.set(x, (ROOF_H + EAVE_H) / 2, zMid);
      rafter.rotation.x = side * Math.atan2(ROOF_H - EAVE_H, HD2 + 1);
      addTo('roofFrame', rafter); rfGrp.add(rafter);
    }
  }

  // ── Roof Tiles (gable roof) ───────────────────────────────────
  const roofGrp = partGrp('roofTiles', '瓦片屋顶', '#4a4a5a', []);
  const rHW = HW2 + ROOF_OH + 0.1;
  const rHD = HD2 + ROOF_OH + 0.1;

  const verts = new Float32Array([
    -rHW,ROOF_H,0,  rHW,ROOF_H,0,         // ridge
    -rHW,EAVE_H,rHD,  rHW,EAVE_H,rHD,     // front eave
    -rHW,EAVE_H,-rHD, rHW,EAVE_H,-rHD,    // back eave
  ]);
  const idx = [
    0,1,3, 0,3,2,   // front slope
    0,5,1, 0,4,5,   // back slope
    0,2,4,           // left gable
    1,5,3,           // right gable
  ];
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
    tip.rotation.z = side * 0.15;
    tip.rotation.x = 0.1;
    addTo('roofTiles', tip); roofGrp.add(tip);
  }

  // ── Front Door (left bay, centered at x = -BAY_W) ─────────────
  const doorGrp = partGrp('doors', '门', '#4a2818', ['wallFront']);
  const doorX = -BAY_W; // left bay center

  // Door frame
  const doorFrameL = box(0.1, 2.3, 0.08, MATS.door);
  doorFrameL.position.set(doorX - 0.75, 1.3 + FLOOR_H, HD2 + WALL_T/2 + 0.04);
  addTo('doors', doorFrameL); doorGrp.add(doorFrameL);

  const doorFrameR = box(0.1, 2.3, 0.08, MATS.door);
  doorFrameR.position.set(doorX + 0.75, 1.3 + FLOOR_H, HD2 + WALL_T/2 + 0.04);
  addTo('doors', doorFrameR); doorGrp.add(doorFrameR);

  const doorFrameT = box(1.6, 0.1, 0.08, MATS.door);
  doorFrameT.position.set(doorX, 2.4 + FLOOR_H, HD2 + WALL_T/2 + 0.04);
  addTo('doors', doorFrameT); doorGrp.add(doorFrameT);

  // Door panels (two leaves)
  for (const xo of [-0.35, 0.35]) {
    const panel = box(0.7, 2.0, 0.05, MATS.doorPanel);
    panel.position.set(doorX + xo, 1.15 + FLOOR_H, HD2 + WALL_T/2 + 0.06);
    addTo('doors', panel); doorGrp.add(panel);
  }

  // Doorstep
  const doorstep = box(1.8, 0.08, 0.25, MATS.floor);
  doorstep.position.set(doorX, FLOOR_H + 0.04, HD2 + WALL_T/2 + 0.1);
  addTo('doors', doorstep); doorGrp.add(doorstep);

  // ── Windows ───────────────────────────────────────────────────
  const winGrp = partGrp('windows', '窗户', '#5a3828', ['wallFront', 'wallBack']);
  const winY = 1.6 + FLOOR_H;
  const winZ = HD2 + WALL_T/2 + 0.05;

  function makeWindow(x, y, z, ry = 0) {
    const wg = new THREE.Group();
    const fw = 1.1, fh = 1.4, ft = 0.06;
    // Frame
    for (const xo of [-fw/2, fw/2]) {
      const f = box(ft, fh, ft, MATS.window);
      f.position.set(xo, 0, 0);
      addTo('windows', f); wg.add(f);
    }
    for (const yo of [-fh/2, fh/2]) {
      const f = box(fw, ft, ft, MATS.window);
      f.position.set(0, yo, 0);
      addTo('windows', f); wg.add(f);
    }
    // Mullions
    const mv = box(ft * 0.7, fh * 0.85, ft * 0.7, MATS.window);
    addTo('windows', mv); wg.add(mv);
    const mh = box(fw * 0.85, ft * 0.7, ft * 0.7, MATS.window);
    addTo('windows', mh); wg.add(mh);

    wg.position.set(x, y, z);
    wg.rotation.y = ry;
    return wg;
  }

  // Front windows: right bay + center bay (left bay has the door)
  [0, BAY_W].forEach(x => { winGrp.add(makeWindow(x, winY, winZ)); });
  // Back windows: each bay
  [-BAY_W, 0, BAY_W].forEach(x => { winGrp.add(makeWindow(x, winY, -HD2 - WALL_T/2 - 0.05, Math.PI)); });

  // ── Pipelines (drainage) ──────────────────────────────────────
  const pipeGrp = partGrp('pipelines', '管道系统', '#8b6b4a', ['roofTiles']);
  const PIPE_R = 0.06;

  // Eave drain pipes (horizontal)
  for (const side of [-1, 1]) {
    const z = side * (HD2 + ROOF_OH * 0.6);
    const dp = cylinder(PIPE_R, HOUSE_W + 0.8, MATS.pipe);
    dp.rotation.x = Math.PI / 2;
    dp.position.set(0, EAVE_H - 0.35, z);
    addTo('pipelines', dp); pipeGrp.add(dp);

    // Brackets
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

    const ds = cylinder(PIPE_R * 0.9, EAVE_H - 0.35, MATS.pipe);
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
    outlet.position.set(x, -0.1, z);
    addTo('pipelines', outlet); pipeGrp.add(outlet);
  }

  // Ground drain trench
  const trench = box(HOUSE_W - 1.0, 0.06, 0.2, MATS.baseDark);
  trench.position.set(0, -0.2, -HD2 - 0.7);
  addTo('pipelines', trench); pipeGrp.add(trench);

} // end buildHouse
