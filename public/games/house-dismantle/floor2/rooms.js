/* 2F rooms — V2 layout mirror */
import * as THREE from 'three';
import { BAY_CX, BAY_X, BAND_Y, HD2, HW2, DEPTH_FRONT, DEPTH_BACK, CROSS_Z_FRONT, CROSS_Z_BACK } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor2Rooms(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name); if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }
  const B = BAND_Y, fMid = (HD2 + CROSS_Z_FRONT) / 2, bMid = (CROSS_Z_BACK - HD2) / 2;

  function makeBed(gx, gz, fy, headDir, w = 2.0) {
    const d = 1.8, bg = new THREE.Group();
    bg.add(box(w,0.15,d,MATS.bedFrame)); bg.children[0].position.y = 0.08+fy;
    bg.add(box(w,0.8,0.06,MATS.bedFrame)); bg.children[1].position.set(0,0.5+fy,-d/2+0.05);
    bg.add(box(w,0.3,0.05,MATS.bedFrame)); bg.children[2].position.set(0,0.2+fy,d/2-0.03);
    bg.add(box(w-0.15,0.12,d-0.15,MATS.mattress)); bg.children[3].position.y = 0.22+fy;
    bg.add(box(w-0.4,0.1,d*0.45,MATS.bedMat)); bg.children[4].position.set(0,0.3+fy,-d*0.2);
    bg.add(box(0.5,0.06,0.35,MATS.mattress)); bg.children[5].position.set(w*0.15,0.25+fy,-d*0.3);
    const rot = { left: Math.PI/2, right: -Math.PI/2, front: 0, back: Math.PI };
    bg.rotation.y = rot[headDir] || 0; bg.position.set(gx,0,gz); return bg;
  }

  function makeDesk(gx, gz, fy) {
    const dg = new THREE.Group(); dg.add(box(1.6,0.05,0.7,MATS.woodLight)); dg.children[0].position.y = 0.9+fy;
    for (const [lx,lz] of [[-0.7,-0.3],[0.7,-0.3],[-0.7,0.3],[0.7,0.3]]) { dg.add(box(0.06,0.85,0.06,MATS.woodDark)); dg.children[dg.children.length-1].position.set(lx,0.42+fy,lz); }
    dg.position.set(gx,0,gz); return dg;
  }

  function makeChair(gx, gz, fy) {
    const cg = new THREE.Group(); cg.add(box(0.4,0.05,0.4,MATS.woodLight)); cg.children[0].position.y = 0.5+fy;
    cg.add(box(0.4,0.4,0.04,MATS.woodDark)); cg.children[1].position.set(0,0.7+fy,-0.18);
    for (const [lx,lz] of [[-0.15,-0.15],[0.15,-0.15],[-0.15,0.15],[0.15,0.15]]) { cg.add(box(0.04,0.5,0.04,MATS.woodDark)); cg.children[cg.children.length-1].position.set(lx,0.25+fy,lz); }
    cg.position.set(gx,0,gz); return cg;
  }

  // ── 儿童房1 (Bay1 front) ──
  const cr1 = parts.get('childRoom1').group;
  cr1.add(makeBed(BAY_X[0]+1.5, fMid, B, 'left', 1.8));

  // ── 次卧2F (Bay2 front) ──
  const sb2 = parts.get('secondBed2F').group;
  sb2.add(makeBed(BAY_X[2]-1.5, fMid, B, 'right'));

  // ── 主卧 (Bay3 front, 5m) ──
  const mb = parts.get('masterBed').group;
  mb.add(makeBed(BAY_CX[2]-1, fMid, B, 'left', 2.2));
  const mw = box(1.2,2.0,0.6,MATS.woodDark); mw.position.set(BAY_X[3]-0.6,1.0+B,CROSS_Z_FRONT+0.8); addTo('masterBed',mw); mb.add(mw);

  // ── 杂物间 (Bay4 front) ──
  const st2 = parts.get('storage2F').group;
  for (let r = 0; r < 2; r++) { const shelf = box(2.5,0.04,0.5,MATS.woodLight); shelf.position.set(BAY_CX[3],0.6+B+r*0.7,fMid); addTo('storage2F',shelf); st2.add(shelf); }

  // ── 儿童房2 (Bay1 back) ──
  const cr2 = parts.get('childRoom2').group;
  cr2.add(makeBed(BAY_X[0]+1.5, bMid, B, 'left', 1.8));

  // ── 卫生间2F (Bay2 back) ──
  const br2 = parts.get('bathroom2F').group;
  br2.add(box(0.5,0.15,0.7,MATS.base)); br2.children[0].position.set(BAY_CX[1],B+0.08,-HD2+0.5);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.2,0.1,16),MATS.pipe); tb.position.set(BAY_CX[1],B+0.2,-HD2+0.5); addTo('bathroom2F',tb); br2.add(tb);
  br2.add(box(0.4,0.5,0.2,MATS.baseDark)); br2.children[2].position.set(BAY_CX[1],B+0.5,-HD2+0.2);
  br2.add(box(0.6,0.1,0.4,MATS.base)); br2.children[3].position.set(BAY_CX[1],B+0.8,CROSS_Z_BACK+0.5);

  // ── 起居厅 (Bay3 back) ──
  const lv = parts.get('living2F').group;
  lv.add(makeDesk(BAY_CX[2], bMid+0.3, B));
  lv.add(makeChair(BAY_CX[2], bMid-0.5, B));

  for (const name of ['childRoom1','secondBed2F','masterBed','storage2F','childRoom2','bathroom2F','living2F']) {
    const p = parts.get(name); if (!p) continue;
    p.group.traverse(c => { if (c.isMesh && !p.meshArr.includes(c)) { p.meshArr.push(c); c.userData.partName = name; c.castShadow = true; c.receiveShadow = true; } });
  }
}
