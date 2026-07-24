/* 2F — rooms: beds against walls, clear walking paths */
import * as THREE from 'three';
import { BAND_Y } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor2Rooms(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }
  const B = BAND_Y;

  function makeBed(gx, gz, fy, headDir, w = 2.0) {
    const d = 1.8;
    const bg = new THREE.Group();
    const frame = box(w, 0.15, d, MATS.bedFrame); frame.position.y = 0.08 + fy; bg.add(frame);
    const head = box(w, 0.8, 0.06, MATS.bedFrame); head.position.set(0, 0.5 + fy, -d/2+0.05); bg.add(head);
    const foot = box(w, 0.3, 0.05, MATS.bedFrame); foot.position.set(0, 0.2 + fy, d/2-0.03); bg.add(foot);
    bg.add(box(w-0.15,0.12,d-0.15,MATS.mattress)); bg.children[bg.children.length-1].position.y = 0.22+fy;
    bg.add(box(w-0.4,0.1,d*0.45,MATS.bedMat)); bg.children[bg.children.length-1].position.set(0,0.3+fy,-d*0.2);
    bg.add(box(0.5,0.06,0.35,MATS.mattress)); bg.children[bg.children.length-1].position.set(w*0.15,0.25+fy,-d*0.3);
    const rot = { left: Math.PI/2, right: -Math.PI/2, front: 0, back: Math.PI };
    bg.rotation.y = rot[headDir] || 0;
    bg.position.set(gx, 0, gz); return bg;
  }

  function makeDesk(gx, gz, fy) {
    const dg = new THREE.Group();
    dg.add(box(1.6, 0.05, 0.7, MATS.woodLight)); dg.children[0].position.y = 0.9+fy;
    for (const [lx, lz] of [[-0.7,-0.3],[0.7,-0.3],[-0.7,0.3],[0.7,0.3]]) {
      dg.add(box(0.06,0.85,0.06,MATS.woodDark)); dg.children[dg.children.length-1].position.set(lx,0.42+fy,lz);
    }
    dg.position.set(gx, 0, gz); return dg;
  }

  function makeChair(gx, gz, fy) {
    const cg = new THREE.Group();
    cg.add(box(0.4,0.05,0.4,MATS.woodLight)); cg.children[0].position.y = 0.5+fy;
    cg.add(box(0.4,0.4,0.04,MATS.woodDark)); cg.children[1].position.set(0,0.7+fy,-0.18);
    for (const [lx,lz] of [[-0.15,-0.15],[0.15,-0.15],[-0.15,0.15],[0.15,0.15]]) {
      cg.add(box(0.04,0.5,0.04,MATS.woodDark)); cg.children[cg.children.length-1].position.set(lx,0.25+fy,lz);
    }
    cg.position.set(gx, 0, gz); return cg;
  }

  // ── Master bed (Bay1 front: x=-8..-4, z=0..4.5) — head left ──
  const mb = parts.get('masterBed').group;
  mb.add(makeBed(-7, 2.5, B, 'left', 2.2));
  const mw = box(1.2, 2.0, 0.6, MATS.woodDark); mw.position.set(-5, 1.0+B, 0.8); addTo('masterBed', mw); mb.add(mw);

  // ── Second bed (Bay2 front: x=-4..0, z=0..4.5) — head right ──
  const sb2 = parts.get('secondBed').group;
  sb2.add(makeBed(-1, 2.5, B, 'right'));
  sb2.add(makeDesk(-3, 1.5, B));

  // ── Study (Bay3 front: x=0..4, z=0..4.5) ──
  const sy = parts.get('study').group;
  sy.add(makeDesk(2, 3.5, B));
  sy.add(makeChair(2, 2.5, B));
  const bs = box(1.8, 2.2, 0.35, MATS.woodDark); bs.position.set(2, 1.1+B, 1.0); addTo('study', bs); sy.add(bs);
  for (let sh = 0; sh < 3; sh++) {
    const shelf = box(1.6, 0.04, 0.33, MATS.woodLight);
    shelf.position.set(2, 0.6+B+sh*0.6, 1.02+(sh%2===0?0.005:-0.005)); addTo('study', shelf); sy.add(shelf);
  }

  // ── Child room 1 (Bay4 front: x=4..8, z=0..4.5) — head right ──
  const cr1 = parts.get('childRoom1').group;
  cr1.add(makeBed(7, 2.5, B, 'right', 1.8));
  const toy = box(0.7, 0.5, 0.5, MATS.woodLight); toy.position.set(5.5, 0.25+B, 1.5); addTo('childRoom1', toy); cr1.add(toy);

  // ── Child room 2 (Bay1 back: x=-8..-4, z=-4.5..0) — head left ──
  const cr2 = parts.get('childRoom2').group;
  cr2.add(makeBed(-7, -1.5, B, 'left', 1.8));
  cr2.add(makeDesk(-5, -2.5, B));

  // Register meshes
  for (const name of ['masterBed','secondBed','study','childRoom1','childRoom2']) {
    const p = parts.get(name);
    if (!p) continue;
    p.group.traverse(c => { if (c.isMesh && !p.meshArr.includes(c)) { p.meshArr.push(c); c.userData.partName = name; c.castShadow = true; c.receiveShadow = true; } });
  }
}
