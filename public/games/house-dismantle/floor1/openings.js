/* 1F — doors, windows, stairs */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_T, FLOOR_H, BAY_W, BAY_COUNT, HW2, HD2, BAND_Y } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor1Openings(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  const F = FLOOR_H;
  const zf = HD2 + WALL_T / 2 + 0.05, zb = -HD2 - WALL_T / 2 - 0.05;
  const GLASS = new THREE.MeshStandardMaterial({ color: 0xaaccff, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.35 });

  // ── 1F Windows — 4 front + back (skip bx=2 front door, bx=6 back door) ──
  const win1 = parts.get('windows1F').group;
  const wy1 = 1.6 + F;
  for (let b = 0; b < BAY_COUNT; b++) {
    const bx = -HW2 + b * BAY_W + BAY_W / 2;
    if (bx !== 2) win1.add(makeWindow(bx, wy1, zf, 0, MATS, GLASS));
    if (bx !== 6) win1.add(makeWindow(bx, wy1, zb, Math.PI, MATS, GLASS));
  }

  // ── Front door (x=2) ──
  const door1 = parts.get('doors1F').group;
  const fdX = 2;
  const frameL = box(0.1, 2.3, 0.08, MATS.door); frameL.position.set(fdX - 0.75, 1.3 + F, zf); addTo('doors1F', frameL); door1.add(frameL);
  const frameR = box(0.1, 2.3, 0.08, MATS.door); frameR.position.set(fdX + 0.75, 1.3 + F, zf); addTo('doors1F', frameR); door1.add(frameR);
  const frameT = box(1.6, 0.1, 0.08, MATS.door); frameT.position.set(fdX, 2.4 + F, zf); addTo('doors1F', frameT); door1.add(frameT);
  for (const xo of [-0.35, 0.35]) {
    const panel = box(0.7, 2.0, 0.05, MATS.doorPanel); panel.position.set(fdX + xo, 1.15 + F, zf + 0.02); addTo('doors1F', panel); door1.add(panel);
  }
  const doorstep = box(1.8, 0.08, 0.25, MATS.floor); doorstep.position.set(fdX, F + 0.04, zf + 0.1); addTo('doors1F', doorstep); door1.add(doorstep);

  // ── Back door (x=6) ──
  const bdX = 6;
  for (const dx of [-0.45, 0.45]) { const f = box(0.08, 2.2, 0.06, MATS.door); f.position.set(bdX + dx, 1.2 + F, zb); addTo('doors1F', f); door1.add(f); }
  const bdTop = box(1.0, 0.08, 0.06, MATS.door); bdTop.position.set(bdX, 2.3 + F, zb); addTo('doors1F', bdTop); door1.add(bdTop);
  const bdPanel = box(0.82, 2.0, 0.04, MATS.doorPanel); bdPanel.position.set(bdX, 1.1 + F, zb + 0.02); addTo('doors1F', bdPanel); door1.add(bdPanel);

  // ── Interior doors (attached to interiorWalls) ──
  const iwPart = parts.get('interiorWalls');
  function addInteriorDoor(x, z, ry = 0) {
    if (!iwPart) return;
    const dg = new THREE.Group();
    for (const dx of [-0.42, 0.42]) { const f = box(0.06, 2.1, 0.04, MATS.interiorDoor); f.position.set(dx, 1.05 + F, 0); dg.add(f); }
    const ft2 = box(0.9, 0.06, 0.04, MATS.interiorDoor); ft2.position.set(0, 2.1 + F, 0); dg.add(ft2);
    const pn = box(0.78, 2.0, 0.03, MATS.interiorDoor); pn.position.set(0, 1.0 + F, 0.02); dg.add(pn);
    dg.position.set(x, 0, z); dg.rotation.y = ry;
    iwPart.group.add(dg);
    iwPart.meshArr.push(...dg.children);
    dg.children.forEach(c => { c.userData.partName = 'interiorWalls'; c.castShadow = true; c.receiveShadow = true; });
  }
  for (const bx of [-6, -2]) addInteriorDoor(bx, 0.01);
  addInteriorDoor(2, 0.01);
  addInteriorDoor(6, 0.01);
  addInteriorDoor(-6, -4.2, Math.PI);

  // ── Stairs ──
  const stairGrp = parts.get('stairs').group;
  const sBase = F, sTop = BAND_Y;
  const stepCount = 16, stepH = (sTop - sBase) / stepCount;
  const stepD = 0.28, stepW = 0.9;

  // Segment 1: along back wall, 8 steps
  const s1X = -1.8, s1Z = -3.5, s1Steps = 8;
  for (let i = 0; i < s1Steps; i++) {
    const step = box(stepW - 0.06, 0.04, stepD, MATS.woodLight);
    step.position.set(s1X + i * stepD + stepD / 2, sBase + i * stepH, s1Z);
    addTo('stairs', step); stairGrp.add(step);
  }

  // Landing
  const landing = box(stepW - 0.04, 0.05, stepW + 0.1, MATS.woodLight);
  landing.position.set(s1X + s1Steps * stepD, sBase + s1Steps * stepH, s1Z + stepW / 2);
  addTo('stairs', landing); stairGrp.add(landing);

  // Segment 2: going +Z, 8 steps
  const s2X = s1X + s1Steps * stepD, s2Z = s1Z;
  for (let i = 0; i < 8; i++) {
    const step = box(stepW - 0.06, 0.04, stepD, MATS.woodLight);
    step.position.set(s2X + stepW / 2, sBase + (s1Steps + i) * stepH, s2Z + stepW + i * stepD + stepD / 2);
    step.rotation.y = Math.PI / 2;
    addTo('stairs', step); stairGrp.add(step);
  }

  // Handrails with balusters
  const railH = 0.9, railThick = 0.06;

  // Rail 1: along back wall
  const r1Len = s1Steps * stepD + 0.2, r1CX = s1X + s1Steps * stepD / 2, r1CY = sBase + s1Steps * stepH / 2 + railH, r1CZ = s1Z - stepW / 2 + 0.04;
  const rail1 = box(r1Len, railThick, railThick, MATS.woodDark); rail1.position.set(r1CX, r1CY, r1CZ); addTo('stairs', rail1); stairGrp.add(rail1);
  for (let i = 0; i <= s1Steps; i++) {
    const post = box(0.05, railH, 0.05, MATS.woodDark); post.position.set(s1X + i * stepD, sBase + i * stepH + railH / 2, r1CZ); addTo('stairs', post); stairGrp.add(post);
  }

  // Rail 2: going +Z
  const r2Len = 8 * stepD + 0.2, r2CX = s2X + stepW - 0.04, r2CY = sBase + 12 * stepH + railH, r2CZ = s2Z + stepW + 8 * stepD / 2;
  const rail2 = box(railThick, railThick, r2Len, MATS.woodDark); rail2.position.set(r2CX, r2CY, r2CZ); addTo('stairs', rail2); stairGrp.add(rail2);
  for (let i = 0; i <= 8; i++) {
    const post = box(0.05, railH, 0.05, MATS.woodDark); post.position.set(r2CX, sBase + (s1Steps + i) * stepH + railH / 2, s2Z + stepW + i * stepD); addTo('stairs', post); stairGrp.add(post);
  }
}

function makeWindow(x, y, z, ry, MATS, GLASS) {
  const wg = new THREE.Group();
  const fw = 1.1, fh = 1.4, ft = 0.06;
  const paneW = (fw - ft * 3) / 2, paneH = (fh - ft * 3) / 2;
  for (const px of [-1, 1]) for (const py of [-1, 1]) {
    const g = box(paneW - 0.02, paneH - 0.02, ft * 0.3, GLASS); g.position.set(px * (paneW / 2 + ft / 2), py * (paneH / 2 + ft / 2), 0); wg.add(g);
  }
  for (const xo of [-fw / 2, fw / 2]) { const f = box(ft, fh, ft, MATS.window); f.position.set(xo, 0, 0); wg.add(f); }
  for (const yo of [-fh / 2, fh / 2]) { const f = box(fw, ft, ft, MATS.window); f.position.set(0, yo, 0); wg.add(f); }
  const mv = box(ft * 0.7, fh * 0.85, ft * 0.7, MATS.window); mv.position.z = 0.01; wg.add(mv);
  const mh = box(fw * 0.85, ft * 0.7, ft * 0.7, MATS.window); mh.position.z = -0.01; wg.add(mh);
  const lintel = box(fw + 0.2, 0.06, ft + 0.04, MATS.woodDark); lintel.position.set(0, fh / 2 + 0.04, 0); wg.add(lintel);
  const sill = box(fw + 0.15, 0.05, ft + 0.06, MATS.woodDark); sill.position.set(0, -fh / 2 - 0.03, 0); wg.add(sill);
  wg.position.set(x, y, z); wg.rotation.y = ry; return wg;
}
