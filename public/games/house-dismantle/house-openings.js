/* Dabie Mountain 4-Bay 2-Story — Doors, Windows, Stairs */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, WALL_T, INT_WALL_T, FLOOR_H, BAY_W, BAY_COUNT, HW2, HD2, WY1, WY2, BAND_Y } from './config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildOpenings(houseGroup, parts, MATS) {
  function partGrp(name, label, color, deps = []) {
    const g = new THREE.Group(); g.name = name;
    if (!parts.has(name)) { parts.set(name, { group: g, label, color, deps, assembled: true, meshArr: [] }); houseGroup.add(g); }
    return parts.get(name).group;
  }
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  const GLASS_MAT = new THREE.MeshStandardMaterial({ color: 0xaaccff, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.35 });
  const F = FLOOR_H, B = BAND_Y;

  // ── Helper: makeWindow(x, y, z, ry) ──────────────────────────
  function makeWindow(x, y, z, ry = 0) {
    const wg = new THREE.Group();
    const fw = 1.1, fh = 1.4, ft = 0.06;
    const paneW = (fw - ft * 3) / 2, paneH = (fh - ft * 3) / 2;
    for (const px of [-1, 1]) {
      for (const py of [-1, 1]) {
        const glass = box(paneW - 0.02, paneH - 0.02, ft * 0.3, GLASS_MAT);
        glass.position.set(px * (paneW / 2 + ft / 2), py * (paneH / 2 + ft / 2), 0);
        wg.add(glass);
      }
    }
    for (const xo of [-fw / 2, fw / 2]) { const f = box(ft, fh, ft, MATS.window); f.position.set(xo, 0, 0); wg.add(f); }
    for (const yo of [-fh / 2, fh / 2]) { const f = box(fw, ft, ft, MATS.window); f.position.set(0, yo, 0); wg.add(f); }
    const mv = box(ft * 0.7, fh * 0.85, ft * 0.7, MATS.window); mv.position.z = 0.01; wg.add(mv);
    const mh = box(fw * 0.85, ft * 0.7, ft * 0.7, MATS.window); mh.position.z = -0.01; wg.add(mh);
    const lintel = box(fw + 0.2, 0.06, ft + 0.04, MATS.woodDark); lintel.position.set(0, fh / 2 + 0.04, 0); wg.add(lintel);
    const sill = box(fw + 0.15, 0.05, ft + 0.06, MATS.woodDark); sill.position.set(0, -fh / 2 - 0.03, 0); wg.add(sill);
    wg.position.set(x, y, z); wg.rotation.y = ry; return wg;
  }

  // ═══════════════════════════════════════════════════════════════
  // 1F WINDOWS — 4 front + 4 back
  // ═══════════════════════════════════════════════════════════════
  const win1 = partGrp('windows1F', '一层窗户', '#5a3828', ['wallFront', 'wallBack']);
  const wy1 = 1.6 + F;
  const zf = HD2 + WALL_T / 2 + 0.05, zb = -HD2 - WALL_T / 2 - 0.05;
  for (let b = 0; b < BAY_COUNT; b++) {
    const bx = -HW2 + b * BAY_W + BAY_W / 2;
    // 前门在第 3 开间(bx=2)，后门在第 4 开间(bx=6)，对应位置不放置窗户
    if (bx !== 2) win1.add(makeWindow(bx, wy1, zf));
    if (bx !== 6) win1.add(makeWindow(bx, wy1, zb, Math.PI));
  }

  // ═══════════════════════════════════════════════════════════════
  // 2F WINDOWS — 4 front + 4 back
  // ═══════════════════════════════════════════════════════════════
  const win2 = partGrp('windows2F', '二层窗户', '#5a3828', ['upperWallFront', 'upperWallBack']);
  const wy2 = 1.6 + B;
  for (let b = 0; b < BAY_COUNT; b++) {
    const bx = -HW2 + b * BAY_W + BAY_W / 2;
    win2.add(makeWindow(bx, wy2, zf));
    win2.add(makeWindow(bx, wy2, zb, Math.PI));
  }

  // ═══════════════════════════════════════════════════════════════
  // FRONT DOOR — Bay3 (x=2), double leaf
  // ═══════════════════════════════════════════════════════════════
  const door1 = partGrp('doors1F', '一层门', '#4a2818', ['wallFront', 'wallBack']);
  const fdX = 2, fdZ = zf;
  const frameL = box(0.1, 2.3, 0.08, MATS.door); frameL.position.set(fdX - 0.75, 1.3 + F, fdZ); addTo('doors1F', frameL); door1.add(frameL);
  const frameR = box(0.1, 2.3, 0.08, MATS.door); frameR.position.set(fdX + 0.75, 1.3 + F, fdZ); addTo('doors1F', frameR); door1.add(frameR);
  const frameT = box(1.6, 0.1, 0.08, MATS.door); frameT.position.set(fdX, 2.4 + F, fdZ); addTo('doors1F', frameT); door1.add(frameT);
  for (const xo of [-0.35, 0.35]) {
    const panel = box(0.7, 2.0, 0.05, MATS.doorPanel); panel.position.set(fdX + xo, 1.15 + F, fdZ + 0.02); addTo('doors1F', panel); door1.add(panel);
  }
  const doorstep = box(1.8, 0.08, 0.25, MATS.floor); doorstep.position.set(fdX, F + 0.04, fdZ + 0.1); addTo('doors1F', doorstep); door1.add(doorstep);

  // BACK DOOR — Bay4 (x=6), single leaf
  const bdX = 6, bdZ = zb;
  for (const dx of [-0.45, 0.45]) { const f = box(0.08, 2.2, 0.06, MATS.door); f.position.set(bdX + dx, 1.2 + F, bdZ); addTo('doors1F', f); door1.add(f); }
  const bdTop = box(1.0, 0.08, 0.06, MATS.door); bdTop.position.set(bdX, 2.3 + F, bdZ); addTo('doors1F', bdTop); door1.add(bdTop);
  const bdPanel = box(0.82, 2.0, 0.04, MATS.doorPanel); bdPanel.position.set(bdX, 1.1 + F, bdZ + 0.02); addTo('doors1F', bdPanel); door1.add(bdPanel);

  // ═══════════════════════════════════════════════════════════════
  // INTERIOR DOORS (1F) — attached to interiorWalls
  // ═══════════════════════════════════════════════════════════════
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
  // Front room doors in crossWall at z=0
  for (const bx of [-6, -2]) addInteriorDoor(bx, 0.01);     // 老人房1,2
  addInteriorDoor(2, 0.01);                                   // 客厅 (wider - skip, use regular)
  addInteriorDoor(6, 0.01);                                   // 厨房
  // Back room doors
  addInteriorDoor(-6, -4.2, Math.PI);                         // 餐厅→后部

  // ═══════════════════════════════════════════════════════════════
  // 2F INTERIOR DOORS
  // ═══════════════════════════════════════════════════════════════
  const door2 = partGrp('doors2F', '二层门', '#4a2818', ['upperWallFront', 'upperWallBack']);
  // Simple door panels in upper floor cross-wall positions — add as freestanding
  function addUpperDoor(x, z, ry = 0) {
    const fz = z + (ry === 0 ? 0.03 : -0.03);
    for (const dx of [-0.42, 0.42]) { const f = box(0.06, 2.1, 0.04, MATS.interiorDoor); f.position.set(x + dx, 1.05 + B, fz); addTo('doors2F', f); door2.add(f); }
    const ft3 = box(0.9, 0.06, 0.04, MATS.interiorDoor); ft3.position.set(x, 2.1 + B, fz); addTo('doors2F', ft3); door2.add(ft3);
    const pn = box(0.78, 2.0, 0.03, MATS.interiorDoor); pn.position.set(x, 1.0 + B, fz + 0.01); addTo('doors2F', pn); door2.add(pn);
  }
  for (const bx of [-6, -2, 2, 6]) addUpperDoor(bx, 0.01);

  // ═══════════════════════════════════════════════════════════════
  // STAIRS — L-shaped, bay2-3 rear area (x≈-1 to 1, z=-3 to -1)
  // ═══════════════════════════════════════════════════════════════
  const stairGrp = partGrp('stairs', '楼梯', '#8b6914', []);
  const sBase = F, sTop = B;
  const totalRise = sTop - sBase; // 2.6m
  const stepCount = 16, stepH = totalRise / stepCount;
  const stepD = 0.28, stepW = 0.9;

  // Segment 1: along back wall going +X, 8 steps
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

  // Handrails
  const rail1 = box(0.04, 0.04, s1Steps * stepD + 0.3, MATS.woodDark);
  rail1.position.set(s1X + s1Steps * stepD / 2, sBase + s1Steps * stepH / 2 + 0.75, s1Z - stepW / 2 + 0.04);
  addTo('stairs', rail1); stairGrp.add(rail1);
  const rail2 = box(0.04, 0.04, 8 * stepD + 0.3, MATS.woodDark);
  rail2.position.set(s2X + stepW - 0.04, sBase + 12 * stepH + 0.75, s2Z + stepW + 8 * stepD / 2);
  addTo('stairs', rail2); stairGrp.add(rail2);
}
