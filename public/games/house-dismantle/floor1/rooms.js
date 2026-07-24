/* 1F rooms — V2 layout with corridor */
import * as THREE from 'three';
import { BAY_CX, BAY_X, FLOOR_H, HD2, HW2, DEPTH_FRONT, DEPTH_BACK, CROSS_Z_FRONT, CROSS_Z_BACK } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
function cyl(r, h, m, s = 12) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, s), m); }

export function buildFloor1Rooms(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name); if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }
  const F = FLOOR_H, fMid = (HD2 + CROSS_Z_FRONT) / 2, bMid = (CROSS_Z_BACK - HD2) / 2;

  function makeBed(gx, gz, fy, headDir) {
    const w = 1.6, d = 2.0, bg = new THREE.Group();
    bg.add(box(w,0.15,d,MATS.bedFrame)); bg.children[0].position.y = 0.08+fy;
    bg.add(box(w,0.8,0.06,MATS.bedFrame)); bg.children[1].position.set(0,0.5+fy,-d/2+0.05);
    bg.add(box(w,0.3,0.05,MATS.bedFrame)); bg.children[2].position.set(0,0.2+fy,d/2-0.03);
    bg.add(box(w-0.15,0.12,d-0.15,MATS.mattress)); bg.children[3].position.y = 0.22+fy;
    bg.add(box(w-0.4,0.1,d*0.45,MATS.bedMat)); bg.children[4].position.set(0,0.3+fy,-d*0.2);
    bg.add(box(0.5,0.06,0.35,MATS.mattress)); bg.children[5].position.set(w*0.15,0.25+fy,-d*0.3);
    const rot = { left: Math.PI/2, right: -Math.PI/2, front: 0, back: Math.PI };
    bg.rotation.y = rot[headDir] || 0; bg.position.set(gx,0,gz); return bg;
  }

  function makeChair(gx, gz, fy) {
    const cg = new THREE.Group();
    cg.add(box(0.4,0.05,0.4,MATS.woodLight)); cg.children[0].position.y = 0.5+fy;
    cg.add(box(0.4,0.4,0.04,MATS.woodDark)); cg.children[1].position.set(0,0.7+fy,-0.18);
    for (const [lx,lz] of [[-0.15,-0.15],[0.15,-0.15],[-0.15,0.15],[0.15,0.15]]) {
      cg.add(box(0.04,0.5,0.04,MATS.woodDark)); cg.children[cg.children.length-1].position.set(lx,0.25+fy,lz);
    }
    cg.position.set(gx,0,gz); return cg;
  }

  // ── 老人房 (Bay1 front: x=-8..-5, z=CROSS_Z_FRONT..HD2) ──
  const er = parts.get('elderRoom').group;
  er.add(makeBed(BAY_X[0]+1.5, fMid, F, 'left'));                            // bed head west
  const w1 = box(1.2,2.0,0.6,MATS.woodDark); w1.position.set(BAY_X[1]-0.6,1.0+F, CROSS_Z_FRONT+0.8); addTo('elderRoom',w1); er.add(w1);

  // ── 次卧1F (Bay2 front: x=-5..-0.5) ──
  const sb1 = parts.get('secondBed1F').group;
  sb1.add(makeBed(BAY_X[2]-1.5, fMid, F, 'right'));                         // bed head east
  const w2 = box(1.2,2.0,0.6,MATS.woodDark); w2.position.set(BAY_X[1]+0.6,1.0+F, CROSS_Z_FRONT+0.8); addTo('secondBed1F',w2); sb1.add(w2);

  // ── 堂屋 (Bay3 front: x=-0.5..4.5, 5m wide) ──
  const mh = parts.get('mainHall').group;
  const lt = box(2.2,0.06,1.6,MATS.woodLight); lt.position.set(BAY_CX[2],0.85+F, fMid+0.5); addTo('mainHall',lt); mh.add(lt);
  for (const [lx,lz] of [[-0.95,-0.65],[0.95,-0.65],[-0.95,0.65],[0.95,0.65]]) { const leg = box(0.08,0.8,0.08,MATS.woodDark); leg.position.set(BAY_CX[2]+lx,0.4+F,lz+fMid+0.5); addTo('mainHall',leg); mh.add(leg); }
  for (const [sx,sz] of [[BAY_CX[2],fMid-0.3],[BAY_CX[2],fMid+1.5],[BAY_CX[2]-1.2,fMid+0.5],[BAY_CX[2]+1.2,fMid+0.5]]) mh.add(makeChair(sx,sz,F));

  // ── 储藏 (Bay4 front: x=4.5..8) ──
  const st1 = parts.get('storage1F').group;
  for (let r = 0; r < 3; r++) { const shelf = box(2.5,0.04,0.5,MATS.woodLight); shelf.position.set(BAY_CX[3],0.6+F+r*0.7,(HD2+CROSS_Z_FRONT)/2); addTo('storage1F',shelf); st1.add(shelf); }

  // ── 书房 (Bay1 back: x=-8..-5, z=-HD2..CROSS_Z_BACK) ──
  const sy = parts.get('study1F').group;
  sy.add(box(1.6,0.05,0.7,MATS.woodLight)); sy.children[0].position.set(BAY_X[0]+1,0.9+F,bMid+0.5); // desk
  for (const [lx,lz] of [[-0.7,-0.3],[0.7,-0.3],[-0.7,0.3],[0.7,0.3]]) { const leg = box(0.06,0.85,0.06,MATS.woodDark); leg.position.set(BAY_X[0]+1+lx,0.42+F,lz+bMid+0.5); addTo('study1F',leg); sy.add(leg); }
  sy.add(makeChair(BAY_X[0]+1, bMid-0.3, F));

  // ── 卫生间 (Bay2 back: x=-5..-0.5) ──
  const br1 = parts.get('bathroom1F').group;
  br1.add(box(0.5,0.15,0.7,MATS.base)); br1.children[0].position.set(BAY_CX[1],F+0.08,-HD2+0.5);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.2,0.1,16),MATS.pipe); tb.position.set(BAY_CX[1],F+0.2,-HD2+0.5); addTo('bathroom1F',tb); br1.add(tb);
  br1.add(box(0.4,0.5,0.2,MATS.baseDark)); br1.children[2].position.set(BAY_CX[1],F+0.5,-HD2+0.2);
  br1.add(box(0.6,0.1,0.4,MATS.base)); br1.children[3].position.set(BAY_CX[1],F+0.8,CROSS_Z_BACK+0.5); // sink facing corridor

  // ── 厨房 (Bay3 back: x=-0.5..4.5) ──
  const kt = parts.get('kitchen').group;
  const stove = box(1.8,0.7,1.0,MATS.stoveBrick); stove.position.set(BAY_X[2]+1.0,F+0.35,-HD2+1.2); addTo('kitchen',stove); kt.add(stove);
  const stp = box(1.8,0.04,1.0,MATS.stoveDark); stp.position.set(BAY_X[2]+1.0,F+0.72,-HD2+1.2); addTo('kitchen',stp); kt.add(stp);

  // ── 餐厅 (Bay4 back: x=4.5..8) ──
  const dr = parts.get('diningRoom').group;
  const dt = new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.8,0.06,16),MATS.woodLight); dt.position.set(BAY_CX[3],0.85+F,bMid); addTo('diningRoom',dt); dr.add(dt);
  const dtl = cyl(0.08,0.8,MATS.woodDark); dtl.position.set(BAY_CX[3],0.4+F,bMid); addTo('diningRoom',dtl); dr.add(dtl);
  for (const [sx,sz] of [[BAY_CX[3]-0.5,bMid],[BAY_CX[3]+0.5,bMid],[BAY_CX[3],bMid-0.6],[BAY_CX[3],bMid+0.6]]) dr.add(makeChair(sx,sz,F));

  // Register meshes
  for (const name of ['elderRoom','secondBed1F','mainHall','storage1F','study1F','bathroom1F','kitchen','diningRoom']) {
    const p = parts.get(name); if (!p) continue;
    p.group.traverse(c => { if (c.isMesh && !p.meshArr.includes(c)) { p.meshArr.push(c); c.userData.partName = name; c.castShadow = true; c.receiveShadow = true; } });
  }
}
