/* 1F — doors, windows, stairs, screen */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_T, FLOOR_H, BAY_CX, BAY_WIDTHS, HW2, HD2, BAND_Y, CROSS_Z_FRONT, CROSS_Z_BACK } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor1Openings(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name); if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }
  const F = FLOOR_H, zf = HD2 + WALL_T/2 + 0.05, zb = -HD2 - WALL_T/2 - 0.05;
  const GLASS = new THREE.MeshStandardMaterial({ color: 0xaaccff, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.35 });

  function makeWindow(x, y, z, ry) {
    const wg = new THREE.Group(), fw = 1.1, fh = 1.4, ft = 0.06;
    const pw = (fw-ft*3)/2, ph = (fh-ft*3)/2;
    for (const px of [-1,1]) for (const py of [-1,1]) { const g = box(pw-0.02,ph-0.02,ft*0.3,GLASS); g.position.set(px*(pw/2+ft/2),py*(ph/2+ft/2),0); wg.add(g); }
    for (const xo of [-fw/2,fw/2]) { const f = box(ft,fh,ft,MATS.window); f.position.set(xo,0,0); wg.add(f); }
    for (const yo of [-fh/2,fh/2]) { const f = box(fw,ft,ft,MATS.window); f.position.set(0,yo,0); wg.add(f); }
    const mv = box(ft*0.7,fh*0.85,ft*0.7,MATS.window); mv.position.z = 0.01; wg.add(mv);
    const mh = box(fw*0.85,ft*0.7,ft*0.7,MATS.window); mh.position.z = -0.01; wg.add(mh);
    wg.add(box(fw+0.2,0.06,ft+0.04,MATS.woodDark)); wg.children[wg.children.length-1].position.set(0,fh/2+0.04,0);
    wg.add(box(fw+0.15,0.05,ft+0.06,MATS.woodDark)); wg.children[wg.children.length-1].position.set(0,-fh/2-0.03,0);
    wg.position.set(x,y,z); wg.rotation.y = ry; return wg;
  }

  // Windows — 1 per bay front, 1 per bay back (skip door positions)
  const win1 = parts.get('windows1F').group;
  const wy = 1.6 + F;
  for (let b = 0; b < BAY_WIDTHS.length; b++) {
    const cx = BAY_CX[b];
    if (b !== 2) win1.add(makeWindow(cx, wy, zf));        // all bays front except 堂屋(front door)
    if (b !== 1 && b !== 3) win1.add(makeWindow(cx, wy, zb, Math.PI)); // back: skip bay2(bathroom) bay4(back door)
  }

  // Front door (堂屋, bay3 x=BAY_CX[2])
  const door1 = parts.get('doors1F').group;
  const fdX = BAY_CX[2]; // x=2 (center of 5m bay)
  [{ w:0.1,h:2.3,xo:-0.75 },{ w:0.1,h:2.3,xo:+0.75 }].forEach(({w,h,xo}) => { const f = box(w,h,0.08,MATS.door); f.position.set(fdX+xo,1.3+F,zf); addTo('doors1F',f); door1.add(f); });
  const ft = box(1.6,0.1,0.08,MATS.door); ft.position.set(fdX,2.4+F,zf); addTo('doors1F',ft); door1.add(ft);
  for (const xo of [-0.35,0.35]) { const pn = box(0.7,2.0,0.05,MATS.doorPanel); pn.position.set(fdX+xo,1.15+F,zf+0.02); addTo('doors1F',pn); door1.add(pn); }
  const doorstep = box(1.8, 0.08, 0.25, MATS.floor);
  doorstep.position.set(fdX, F + 0.04, zf + 0.1);
  addTo('doors1F', doorstep);
  door1.add(doorstep);

  // Back door (bay4, x=BAY_CX[3])
  const bdX = BAY_CX[3]; // x=6.25
  for (const dx of [-0.45,0.45]) { const f = box(0.08,2.2,0.06,MATS.door); f.position.set(bdX+dx,1.2+F,zb); addTo('doors1F',f); door1.add(f); }
  const bdTop = box(1.0,0.08,0.06,MATS.door); bdTop.position.set(bdX,2.3+F,zb); addTo('doors1F',bdTop); door1.add(bdTop);
  const bdPanel = box(0.82, 2.0, 0.04, MATS.doorPanel);
  bdPanel.position.set(bdX, 1.1 + F, zb + 0.02);
  addTo('doors1F', bdPanel);
  door1.add(bdPanel);

  // Screen (屏风) in 堂屋, z≈0 (between front door and corridor)
  const screenGrp = parts.get('screen').group;
  const sw = 3.0, sh = 2.2;
  const screenFrame = box(sw, sh, 0.06, MATS.woodDark); screenFrame.position.set(fdX, 1.1+F, -0.5); addTo('screen',screenFrame); screenGrp.add(screenFrame);
  for (let i = 0; i < 3; i++) { const panel = box(0.8, sh-0.2, 0.03, MATS.woodLight); panel.position.set(fdX+(i-1)*0.9, 1.1+F, -0.47); addTo('screen',panel); screenGrp.add(panel); }

  // Stairs — bay2 back (x=-5..-0.5, z=-HD2..CROSS_Z_BACK). L-shape, entirely within back zone
  const stairGrp = parts.get('stairs').group;
  const sBase = F, sTop = BAND_Y;
  const s1Steps = 8, s2Steps = 7, stepCount = s1Steps + s2Steps;
  const stepH = (sTop - sBase) / stepCount, stepD = 0.28, stepW = 0.82;
  const s1X = BAY_CX[1] - 1.5, s1Z = -HD2 + 0.45;
  // First segment: going +X along z=s1Z
  for (let i = 0; i < s1Steps; i++) { const step = box(stepW-0.06,0.04,stepD,MATS.woodLight); step.position.set(s1X+i*stepD+stepD/2,sBase+i*stepH,s1Z); addTo('stairs',step); stairGrp.add(step); }
  // Landing / turn
  const landing = box(stepW-0.04,0.05,stepW+0.1,MATS.woodLight); landing.position.set(s1X+s1Steps*stepD,sBase+s1Steps*stepH,s1Z+stepW/2); addTo('stairs',landing); stairGrp.add(landing);
  // Second segment: going +Z (toward corridor), rotated
  const s2X = s1X + s1Steps*stepD, s2Z = s1Z;
  for (let i = 0; i < s2Steps; i++) { const step = box(stepW-0.06,0.04,stepD,MATS.woodLight); step.position.set(s2X+stepW/2,sBase+(s1Steps+i)*stepH,s2Z+stepW+i*stepD+stepD/2); step.rotation.y = Math.PI/2; addTo('stairs',step); stairGrp.add(step); }
  // Railings — first segment (inner side, facing +Z)
  const rh = 0.9, rt = 0.06;
  const r1l = s1Steps*stepD+0.2, r1x = s1X + s1Steps*stepD/2, r1y = sBase + s1Steps*stepH/2 + rh, r1z = s1Z - stepW/2 + 0.04;
  const r1 = box(r1l, rt, rt, MATS.woodDark); r1.position.set(r1x, r1y, r1z); addTo('stairs', r1); stairGrp.add(r1);
  for (let i = 0; i <= s1Steps; i++) { const p = box(0.05, rh, 0.05, MATS.woodDark); p.position.set(s1X + i*stepD, sBase + i*stepH + rh/2, r1z); addTo('stairs', p); stairGrp.add(p); }
  // Railings — second segment (outer side, facing -X)
  const r2l = s2Steps*stepD+0.2, r2x = s2X + stepW - 0.04, r2y = sBase + (s1Steps + s2Steps/2)*stepH + rh, r2z = s2Z + stepW + s2Steps*stepD/2;
  const r2 = box(rt, rt, r2l, MATS.woodDark); r2.position.set(r2x, r2y, r2z); addTo('stairs', r2); stairGrp.add(r2);
  for (let i = 0; i <= s2Steps; i++) { const p = box(0.05, rh, 0.05, MATS.woodDark); p.position.set(r2x, sBase + (s1Steps + i)*stepH + rh/2, s2Z + stepW + i*stepD); addTo('stairs', p); stairGrp.add(p); }
}
