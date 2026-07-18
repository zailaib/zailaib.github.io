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
  const doorX = BAY_W; // right bay center

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

  const GLASS_MAT = new THREE.MeshStandardMaterial({
    color: 0xaaccff, roughness: 0.1, metalness: 0.1,
    transparent: true, opacity: 0.35,
  });

  function makeWindow(x, y, z, ry = 0) {
    const wg = new THREE.Group();
    const fw = 1.1, fh = 1.4, ft = 0.06;
    // Glass panels (4 panes in a 2×2 grid)
    const paneW = (fw - ft*3) / 2, paneH = (fh - ft*3) / 2;
    for (const px of [-1, 1]) {
      for (const py of [-1, 1]) {
        const glass = box(paneW - 0.02, paneH - 0.02, ft * 0.3, GLASS_MAT);
        glass.position.set(px * (paneW/2 + ft/2), py * (paneH/2 + ft/2), 0);
        addTo('windows', glass); wg.add(glass);
      }
    }
    // Frame
    for (const xo of [-fw/2, fw/2]) {
      const f = box(ft, fh, ft, MATS.window);
      f.position.set(xo, 0, 0); addTo('windows', f); wg.add(f);
    }
    for (const yo of [-fh/2, fh/2]) {
      const f = box(fw, ft, ft, MATS.window);
      f.position.set(0, yo, 0); addTo('windows', f); wg.add(f);
    }
    // Cross mullions
    const mv = box(ft*0.7, fh*0.85, ft*0.7, MATS.window);
    addTo('windows', mv); wg.add(mv);
    const mh = box(fw*0.85, ft*0.7, ft*0.7, MATS.window);
    addTo('windows', mh); wg.add(mh);
    // Lintel/head above window (decorative beam)
    const lintel = box(fw + 0.2, 0.06, ft + 0.04, MATS.woodDark);
    lintel.position.set(0, fh/2 + 0.04, 0);
    addTo('windows', lintel); wg.add(lintel);
    // Window sill (bottom ledge)
    const sill = box(fw + 0.15, 0.05, ft + 0.06, MATS.woodDark);
    sill.position.set(0, -fh/2 - 0.03, 0);
    addTo('windows', sill); wg.add(sill);

    wg.position.set(x, y, z); wg.rotation.y = ry;
    return wg;
  }

  // Front windows: left + center bay (right bay has the door)
  [-BAY_W, 0].forEach(x => { winGrp.add(makeWindow(x, winY, winZf)); });
  // Back windows: all three bays
  [-BAY_W, 0, BAY_W].forEach(x => { winGrp.add(makeWindow(x, winY, winZb, Math.PI)); });

  // ═══════════════════════════════════════════════════════════════
  // BACK DOOR (single-leaf, left bay, back wall)
  // ═══════════════════════════════════════════════════════════════
  const backDoorX = BAY_W; // same bay as front door (right bay)
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
  // STAIRS (L-shaped wooden staircase to second floor)
  // Fits entirely inside the center bay, hugging the back wall
  // and left interior wall — does NOT break through any wall
  // ═══════════════════════════════════════════════════════════════
  const stairGrp = partGrp('stairs', '楼梯', '#8b6914', ['upperWallFront', 'upperWallBack']);

  const sBaseY  = FLOOR_H;      // 0.2
  const sTopY   = BAND_Y;       // 3.0
  const sTotalRise = sTopY - sBaseY; // 2.8m
  const stepH   = sTotalRise / 16;   // ~0.175m per step
  const stepD   = 0.28;              // tread depth
  const stepW   = 0.8;               // stair width

  // Segment 1: along back wall, going +X (right), 8 steps, inside back
  const seg1StartX = -1.8;
  const seg1StartZ = -HD2 + 0.5;  // near back wall, inside
  const seg1Steps  = 8;

  // Segment 2: going +Z (forward), 8 steps, turns at corner
  const seg2StartX = seg1StartX + seg1Steps * stepD;
  const seg2StartZ = seg1StartZ;
  const seg2Steps  = 8;

  // --- Segment 1: steps going +X ---
  for (let i = 0; i < seg1Steps; i++) {
    const step = box(stepW - 0.06, 0.04, stepD, MATS.woodLight);
    const x = seg1StartX + i * stepD + stepD/2;
    const y = sBaseY + i * stepH;
    step.position.set(x, y, seg1StartZ);
    addTo('stairs', step); stairGrp.add(step);
  }

  // --- Landing (square platform at the turn) ---
  const landing = box(stepW - 0.04, 0.05, stepW + 0.1, MATS.woodLight);
  landing.position.set(seg2StartX, sBaseY + seg1Steps * stepH, seg2StartZ + stepW/2);
  addTo('stairs', landing); stairGrp.add(landing);

  // --- Segment 2: steps going +Z ---
  for (let i = 0; i < seg2Steps; i++) {
    const step = box(stepW - 0.06, 0.04, stepD, MATS.woodLight);
    const z = seg2StartZ + stepW + i * stepD + stepD/2;
    const y = sBaseY + (seg1Steps + i) * stepH;
    step.position.set(seg2StartX + stepW/2, y, z);
    step.rotation.y = Math.PI/2; // rotate to face +Z
    addTo('stairs', step); stairGrp.add(step);
  }

  // --- Support posts at corners ---
  const posts = [
    [seg1StartX, seg1StartZ - stepW/2],
    [seg2StartX, seg1StartZ - stepW/2],
    [seg2StartX + stepW, seg1StartZ - stepW/2],
    [seg2StartX + stepW, seg2StartZ + stepW + seg2Steps * stepD],
  ];
  for (const [px, pz] of posts) {
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, sTotalRise + 0.3, 8);
    const post = new THREE.Mesh(postGeo, MATS.woodDark);
    post.position.set(px, (sBaseY + sTopY)/2, pz);
    addTo('stairs', post); stairGrp.add(post);
  }

  // --- Handrail (3 sides) ---
  // Inner handrail along segment 1 (+X direction)
  const rail1 = box(0.04, 0.04, seg1Steps * stepD + 0.3, MATS.woodDark);
  rail1.position.set(seg1StartX + seg1Steps*stepD/2, sBaseY + seg1Steps*stepH/2 + 0.75, seg1StartZ - stepW/2 + 0.04);
  addTo('stairs', rail1); stairGrp.add(rail1);
  // Inner handrail along segment 2 (+Z direction)
  const rail2 = box(0.04, 0.04, seg2Steps * stepD + 0.3, MATS.woodDark);
  rail2.position.set(seg2StartX + stepW - 0.04, sBaseY + (seg1Steps+seg2Steps/2)*stepH + 0.75, seg2StartZ + stepW + seg2Steps*stepD/2);
  addTo('stairs', rail2); stairGrp.add(rail2);
  // Outer wall-side rail (along back wall)
  const rail3 = box(0.04, 0.04, seg1Steps * stepD + 0.3, MATS.woodDark);
  rail3.position.set(seg1StartX + seg1Steps*stepD/2, sBaseY + seg1Steps*stepH/2 + 0.75, seg1StartZ + stepW/2 - 0.04);
  addTo('stairs', rail3); stairGrp.add(rail3);
}
