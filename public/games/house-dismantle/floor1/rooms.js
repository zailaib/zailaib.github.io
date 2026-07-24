/* 1F — rooms: beds against walls, furniture not blocking doorways */
import * as THREE from 'three';
import { FLOOR_H } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
function cyl(r, h, m, s = 12) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, s), m); }

export function buildFloor1Rooms(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }
  const F = FLOOR_H;

  function makeBed(gx, gz, fy, headDir) {
    // headDir: 'left'=head west, 'right'=head east, 'front'=head north, 'back'=head south
    const w = 1.6, d = 2.0;
    const bg = new THREE.Group();
    const frame = box(w, 0.15, d, MATS.bedFrame); frame.position.y = 0.08 + fy; bg.add(frame);
    const head = box(w, 0.8, 0.06, MATS.bedFrame); head.position.set(0, 0.5 + fy, -d / 2 + 0.05); bg.add(head);
    const foot = box(w, 0.3, 0.05, MATS.bedFrame); foot.position.set(0, 0.2 + fy, d / 2 - 0.03); bg.add(foot);
    const mat = box(w - 0.15, 0.12, d - 0.15, MATS.mattress); mat.position.y = 0.22 + fy; bg.add(mat);
    const quilt = box(w - 0.4, 0.1, d * 0.45, MATS.bedMat); quilt.position.set(0, 0.3 + fy, -d * 0.2); bg.add(quilt);
    const pillow = box(0.5, 0.06, 0.35, MATS.mattress); pillow.position.set(w * 0.15, 0.25 + fy, -d * 0.3); bg.add(pillow);
    const rot = { left: Math.PI/2, right: -Math.PI/2, front: 0, back: Math.PI };
    bg.rotation.y = rot[headDir] || 0;
    bg.position.set(gx, 0, gz); return bg;
  }

  function makeChair(gx, gz, fy) {
    const cg = new THREE.Group();
    cg.add(box(0.4, 0.05, 0.4, MATS.woodLight)); cg.children[0].position.y = 0.5 + fy;
    cg.add(box(0.4, 0.4, 0.04, MATS.woodDark)); cg.children[1].position.set(0, 0.7 + fy, -0.18);
    for (const [lx, lz] of [[-0.15, -0.15],[0.15, -0.15],[-0.15, 0.15],[0.15, 0.15]]) {
      cg.add(box(0.04, 0.5, 0.04, MATS.woodDark)); cg.children[cg.children.length-1].position.set(lx, 0.25 + fy, lz);
    }
    cg.position.set(gx, 0, gz); return cg;
  }

  // ── Elder room 1 (Bay1 front: x=-8..-4, z=0..4.5) ──
  // Door at z=0, x≈-6. Bed head against left wall. Wardrobe at inner corner.
  const er1 = parts.get('elderRoom1').group;
  er1.add(makeBed(-7, 2.5, F, 'left'));         // head west, bed near front window
  const w1 = box(1.2, 2.0, 0.6, MATS.woodDark); w1.position.set(-5, 1.0 + F, 0.8); addTo('elderRoom1', w1); er1.add(w1);

  // ── Elder room 2 (Bay2 front: x=-4..0, z=0..4.5) ──
  // Door at z=0, x≈-2. Bed head against right wall. Wardrobe near door.
  const er2 = parts.get('elderRoom2').group;
  er2.add(makeBed(-1, 2.5, F, 'right'));        // head east, bed near front window
  const w2 = box(1.2, 2.0, 0.6, MATS.woodDark); w2.position.set(-3, 1.0 + F, 0.8); addTo('elderRoom2', w2); er2.add(w2);

  // ── Living room (Bay3 front: x=0..4, z=0..4.5) ──
  // Front door at z=4.5. Cross-wall door at z=0. Central table.
  const lr = parts.get('livingRoom').group;
  const lt = box(2.2, 0.06, 1.6, MATS.woodLight); lt.position.set(2, 0.85 + F, 2.5); addTo('livingRoom', lt); lr.add(lt);
  for (const [lx, lz] of [[-0.95,-0.65],[0.95,-0.65],[-0.95,0.65],[0.95,0.65]]) {
    const leg = box(0.08, 0.8, 0.08, MATS.woodDark); leg.position.set(2+lx, 0.4+F, lz+2.5); addTo('livingRoom', leg); lr.add(leg);
  }
  for (const [sx, sz] of [[2,1.2],[2,3.8],[0.7,2.5],[3.3,2.5]]) lr.add(makeChair(sx, sz, F));
  // Tea cabinet against front wall, off to the side
  const tc = box(1.4, 1.5, 0.4, MATS.woodDark); tc.position.set(3.2, 0.75+F, 4.0); addTo('livingRoom', tc); lr.add(tc);

  // ── Kitchen (Bay4 front: x=4..8, z=0..4.5) ──
  // Door at z=0, x≈6. Stove against right wall.
  const kt = parts.get('kitchen').group;
  const stove = box(1.8, 0.7, 1.0, MATS.stoveBrick); stove.position.set(7.2, F+0.35, 3.0); addTo('kitchen', stove); kt.add(stove);
  const stoveTop = box(1.8, 0.04, 1.0, MATS.stoveDark); stoveTop.position.set(7.2, F+0.72, 3.0); addTo('kitchen', stoveTop); kt.add(stoveTop);
  const wok = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 8, 0, Math.PI*2, 0, Math.PI/2), MATS.wokMetal);
  wok.position.set(7.2, F+0.74, 2.85); addTo('kitchen', wok); kt.add(wok);
  for (let i = 0; i < 6; i++) {
    const log = cyl(0.05, 0.7, MATS.woodDark, 8); log.rotation.z = Math.PI/2; log.position.set(6, F+0.08+i*0.1, 3.8); addTo('kitchen', log); kt.add(log);
  }
  for (const [gx, gz] of [[5.2,1.5],[5.5,1.2]]) { const s = cyl(0.2,0.5,MATS.grainSack,8); s.position.set(gx,F+0.25,gz); addTo('kitchen',s); kt.add(s); }

  // ── Dining room (Bay1 back: x=-8..-4, z=-4.5..0) ──
  // Door at z=0, x≈-6. Corridor door at z=-2. Round table center.
  const dr = parts.get('diningRoom').group;
  const dt = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.06, 16), MATS.woodLight); dt.position.set(-6, 0.85+F, -2.5); addTo('diningRoom', dt); dr.add(dt);
  const dtLeg = cyl(0.08, 0.8, MATS.woodDark); dtLeg.position.set(-6, 0.4+F, -2.5); addTo('diningRoom', dtLeg); dr.add(dtLeg);
  for (const [sx, sz] of [[-6.6,-2.5],[-5.4,-2.5],[-6,-3.1],[-6,-1.9]]) dr.add(makeChair(sx, sz, F));
  const sb = box(1.6, 1.0, 0.4, MATS.woodDark); sb.position.set(-6, 0.5+F, -4.0); addTo('diningRoom', sb); dr.add(sb);

  // Register meshes
  for (const name of ['elderRoom1','elderRoom2','livingRoom','kitchen','diningRoom']) {
    const p = parts.get(name);
    if (!p) continue;
    p.group.traverse(c => { if (c.isMesh && !p.meshArr.includes(c)) { p.meshArr.push(c); c.userData.partName = name; c.castShadow = true; c.receiveShadow = true; } });
  }
}
