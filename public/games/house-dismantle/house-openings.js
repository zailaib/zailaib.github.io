/* House Dismantle — Doors, Windows, Stairs */

import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, WALL_T, FLOOR_H, BAY_W, HW2, HD2, WY1, BAND_Y } from './config.js';

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

export function buildOpenings(houseGroup, parts, MATS) {

  function partGrp(name, label, color, deps = []) {
    const g = new THREE.Group(); g.name = name;
    // Find existing entry (created in another module) or create new
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
  // FRONT DOOR (left bay, at x = -BAY_W)
  // ═══════════════════════════════════════════════════════════════
  const doorGrp = partGrp('doors', '门', '#4a2818', ['wallFront']);
  const doorX = -BAY_W; // left bay center

  // Door frame
  const frameL = box(0.1, 2.3, 0.08, MATS.door);
  frameL.position.set(doorX - 0.75, 1.3 + FLOOR_H, HD2 + WALL_T/2 + 0.04);
  addTo('doors', frameL); doorGrp.add(frameL);

  const frameR = box(0.1, 2.3, 0.08, MATS.door);
  frameR.position.set(doorX + 0.75, 1.3 + FLOOR_H, HD2 + WALL_T/2 + 0.04);
  addTo('doors', frameR); doorGrp.add(frameR);

  const frameT = box(1.6, 0.1, 0.08, MATS.door);
  frameT.position.set(doorX, 2.4 + FLOOR_H, HD2 + WALL_T/2 + 0.04);
  addTo('doors', frameT); doorGrp.add(frameT);

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

  // Interior door panels in partition walls (back side)
  for (const [x, name] of [[-BAY_W/2, 'interiorWall1'], [BAY_W/2, 'interiorWall2']]) {
    const intDoor = box(0.9, 2.1, 0.06, MATS.interiorDoor);
    intDoor.position.set(x, FLOOR_H + 1.05, -HD2 + 0.8);
    // These belong to the interior wall part for selection
    const iwPart = parts.get(name);
    if (iwPart) {
      iwPart.meshArr.push(intDoor);
      intDoor.userData.partName = name;
      intDoor.castShadow = true; intDoor.receiveShadow = true;
      iwPart.group.add(intDoor);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // WINDOWS
  // ═══════════════════════════════════════════════════════════════
  const winGrp = partGrp('windows', '窗户', '#5a3828', ['wallFront', 'wallBack']);
  const winY = 1.6 + FLOOR_H;
  const winZf = HD2 + WALL_T/2 + 0.05;
  const winZb = -HD2 - WALL_T/2 - 0.05;

  function makeWindow(x, y, z, ry = 0) {
    const wg = new THREE.Group();
    const fw = 1.1, fh = 1.4, ft = 0.06;
    for (const xo of [-fw/2, fw/2]) {
      const f = box(ft, fh, ft, MATS.window);
      f.position.set(xo, 0, 0); addTo('windows', f); wg.add(f);
    }
    for (const yo of [-fh/2, fh/2]) {
      const f = box(fw, ft, ft, MATS.window);
      f.position.set(0, yo, 0); addTo('windows', f); wg.add(f);
    }
    const mv = box(ft*0.7, fh*0.85, ft*0.7, MATS.window);
    addTo('windows', mv); wg.add(mv);
    const mh = box(fw*0.85, ft*0.7, ft*0.7, MATS.window);
    addTo('windows', mh); wg.add(mh);
    wg.position.set(x, y, z); wg.rotation.y = ry;
    return wg;
  }

  // Front windows: center + right bay (left bay has the door)
  [0, BAY_W].forEach(x => { winGrp.add(makeWindow(x, winY, winZf)); });
  // Back windows: all three bays
  [-BAY_W, 0, BAY_W].forEach(x => { winGrp.add(makeWindow(x, winY, winZb, Math.PI)); });

  // ═══════════════════════════════════════════════════════════════
  // BACK DOOR (single-leaf, left bay, back wall)
  // ═══════════════════════════════════════════════════════════════
  const backDoorX = -BAY_W; // same bay as front door (left bay)
  const backDoorZ = -HD2 - WALL_T/2 - 0.05;

  // Simple single door frame
  const bdFrameL = box(0.08, 2.2, 0.06, MATS.door);
  bdFrameL.position.set(backDoorX - 0.45, 1.2 + FLOOR_H, backDoorZ);
  addTo('doors', bdFrameL); doorGrp.add(bdFrameL);

  const bdFrameR = box(0.08, 2.2, 0.06, MATS.door);
  bdFrameR.position.set(backDoorX + 0.45, 1.2 + FLOOR_H, backDoorZ);
  addTo('doors', bdFrameR); doorGrp.add(bdFrameR);

  const bdFrameT = box(1.0, 0.08, 0.06, MATS.door);
  bdFrameT.position.set(backDoorX, 2.3 + FLOOR_H, backDoorZ);
  addTo('doors', bdFrameT); doorGrp.add(bdFrameT);

  // Single door panel
  const bdPanel = box(0.82, 2.0, 0.04, MATS.doorPanel);
  bdPanel.position.set(backDoorX, 1.1 + FLOOR_H, backDoorZ);
  addTo('doors', bdPanel); doorGrp.add(bdPanel);

  // ═══════════════════════════════════════════════════════════════
  // STAIRS (wooden staircase to second floor)
  // Center bay, along left wall, going up from back toward front
  // ═══════════════════════════════════════════════════════════════
  const stairGrp = partGrp('stairs', '楼梯', '#8b6914', ['upperWallFront', 'upperWallBack']);
  const stairStartZ = -HD2 + 1.5; // back of house, inside (~ -2.0)
  const stairEndZ   = 0.5;         // toward front, middle of house
  const stairBaseY  = FLOOR_H;     // 0.2
  const stairTopY   = BAND_Y;      // 3.0 = top of 1F floor
  const numSteps    = 14;
  const stepDepth   = (stairEndZ - stairStartZ) / numSteps;
  const stepHeight  = (stairTopY - stairBaseY) / numSteps;
  const stepWidth   = 0.8;
  const stairX      = -BAY_W/2 - 0.2; // against left interior wall

  // Stringers (side rails)
  const sDX = stairEndZ - stairStartZ;
  const sDY = stairTopY - stairBaseY;
  const sLen = Math.sqrt(sDX * sDX + sDY * sDY);
  const sAngle = Math.atan2(sDY, sDX);
  for (const sx of [-stepWidth/2, stepWidth/2]) {
    const stringer = box(0.06, 0.08, sLen + 0.2, MATS.woodDark);
    stringer.position.set(stairX + sx, (stairTopY + stairBaseY)/2, (stairStartZ + stairEndZ)/2);
    stringer.rotation.x = -sAngle;
    addTo('stairs', stringer); stairGrp.add(stringer);
  }

  // Steps
  for (let i = 0; i < numSteps; i++) {
    const step = box(stepWidth - 0.08, 0.04, stepDepth * 0.9, MATS.woodLight);
    const z = stairStartZ + (i + 0.5) * stepDepth;
    const y = stairBaseY + i * stepHeight;
    step.position.set(stairX, y, z);
    addTo('stairs', step); stairGrp.add(step);
  }

  // Handrail posts
  for (let i = 0; i <= 4; i++) {
    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8);
    const post = new THREE.Mesh(postGeo, MATS.woodDark);
    const t = i / 4;
    const z = stairStartZ + t * sDX;
    const y = stairBaseY + t * sDY;
    post.position.set(stairX + stepWidth/2 - 0.05, y + 0.35, z);
    addTo('stairs', post); stairGrp.add(post);
  }
  // Handrail top bar
  const rail = box(0.04, 0.04, sLen + 0.3, MATS.woodDark);
  rail.position.set(stairX + stepWidth/2 - 0.05, stairBaseY + sDY * 0.5 + 0.7, (stairStartZ + stairEndZ)/2);
  rail.rotation.x = -sAngle;
  addTo('stairs', rail); stairGrp.add(rail);
}
