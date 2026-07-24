/* 1F — rooms (elderRoom1/2, livingRoom, kitchen, diningRoom) */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_T, INT_WALL_T, BAY_W, HW2, HD2, FLOOR_H } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
function cyl(r, h, m, s = 12) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, s), m); }

export function buildFloor1Rooms(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  const F = FLOOR_H;

  function makeBed(gx, gz, fy, w = 2.0, d = 1.6) {
    const bg = new THREE.Group();
    bg.add(box(w, 0.15, d, MATS.bedFrame)); bg.children[0].position.y = 0.08 + fy;
    bg.add(box(w, 0.8, 0.06, MATS.bedFrame)); bg.children[1].position.set(0, 0.5 + fy, -d / 2 + 0.05);
    bg.add(box(w, 0.3, 0.05, MATS.bedFrame)); bg.children[2].position.set(0, 0.2 + fy, d / 2 - 0.03);
    bg.add(box(w - 0.15, 0.12, d - 0.15, MATS.mattress)); bg.children[3].position.y = 0.22 + fy;
    bg.add(box(w - 0.4, 0.1, d * 0.45, MATS.bedMat)); bg.children[4].position.set(0, 0.3 + fy, d * 0.2);
    bg.add(box(0.5, 0.06, 0.35, MATS.mattress)); bg.children[5].position.set(w * 0.15, 0.25 + fy, -d * 0.3);
    bg.position.set(gx, 0, gz); return bg;
  }

  function makeWardrobe(gx, gz, fy) {
    const wg = new THREE.Group();
    wg.add(box(1.2, 2.0, 0.6, MATS.woodDark)); wg.children[0].position.y = 1.0 + fy;
    wg.add(box(0.55, 1.8, 0.04, MATS.woodLight)); wg.children[1].position.set(-0.28, 1.0 + fy, 0.32);
    wg.add(box(0.55, 1.8, 0.04, MATS.woodLight)); wg.children[2].position.set(0.28, 1.0 + fy, 0.32);
    wg.position.set(gx, 0, gz); return wg;
  }

  function makeChair(gx, gz, fy) {
    const cg = new THREE.Group();
    cg.add(box(0.4, 0.05, 0.4, MATS.woodLight)); cg.children[0].position.y = 0.5 + fy;
    cg.add(box(0.4, 0.4, 0.04, MATS.woodDark)); cg.children[1].position.set(0, 0.7 + fy, -0.18);
    for (const [lx, lz] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) {
      cg.add(box(0.04, 0.5, 0.04, MATS.woodDark)); cg.children[cg.children.length-1].position.set(lx, 0.25 + fy, lz);
    }
    cg.position.set(gx, 0, gz); return cg;
  }

  // Elder room 1 (x=-6, z=2.2)
  const er1 = parts.get('elderRoom1').group;
  er1.add(makeBed(-6, 3.5, F));
  er1.add(makeWardrobe(-5.5, 1.0, F));
  const er1Table = box(0.5, 0.5, 0.5, MATS.wood); er1Table.position.set(-7.2, F + 0.25, 2.5); addTo('elderRoom1', er1Table); er1.add(er1Table);

  // Elder room 2 (x=-2, z=2.2)
  const er2 = parts.get('elderRoom2').group;
  er2.add(makeBed(-2, 3.5, F));
  er2.add(makeWardrobe(-1.5, 1.0, F));
  const er2Table = box(0.5, 0.5, 0.5, MATS.wood); er2Table.position.set(-3.2, F + 0.25, 2.5); addTo('elderRoom2', er2Table); er2.add(er2Table);

  // Living room (x=2, z=2.2)
  const lr = parts.get('livingRoom').group;
  const lt = box(2.2, 0.06, 1.6, MATS.woodLight); lt.position.set(2, 0.85 + F, 2.5); addTo('livingRoom', lt); lr.add(lt);
  for (const [lx, lz] of [[-0.95, -0.65], [0.95, -0.65], [-0.95, 0.65], [0.95, 0.65]]) {
    const leg = box(0.08, 0.8, 0.08, MATS.woodDark); leg.position.set(2 + lx, 0.4 + F, lz + 2.5); addTo('livingRoom', leg); lr.add(leg);
  }
  const tc = box(1.4, 1.5, 0.4, MATS.woodDark); tc.position.set(2, 0.75 + F, 3.0); addTo('livingRoom', tc); lr.add(tc);
  for (const [sx, sz] of [[2, 1.3], [2, 3.7], [0.7, 2.5], [3.3, 2.5]]) { lr.add(makeChair(sx, sz, F)); }

  // Kitchen (x=6, z=2.2)
  const kt = parts.get('kitchen').group;
  const stove = box(1.8, 0.7, 1.0, MATS.stoveBrick); stove.position.set(6, F + 0.35, 3.0); addTo('kitchen', stove); kt.add(stove);
  const stoveTop = box(1.8, 0.04, 1.0, MATS.stoveDark); stoveTop.position.set(6, F + 0.72, 3.0); addTo('kitchen', stoveTop); kt.add(stoveTop);
  const wok = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), MATS.wokMetal);
  wok.position.set(6, F + 0.74, 2.85); addTo('kitchen', wok); kt.add(wok);
  for (let i = 0; i < 6; i++) {
    const log = cyl(0.05, 0.7, MATS.woodDark, 8); log.rotation.z = Math.PI / 2; log.position.set(5.1, F + 0.08 + i * 0.1, 3.3); addTo('kitchen', log); kt.add(log);
  }
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.7, 12), MATS.base); jar.position.set(7.2, F + 0.35, 3.0); addTo('kitchen', jar); kt.add(jar);
  for (const [gx, gz] of [[5.2, 1.5], [5.5, 1.2]]) {
    const sack = cyl(0.2, 0.5, MATS.grainSack, 8); sack.position.set(gx, F + 0.25, gz); addTo('kitchen', sack); kt.add(sack);
  }

  // Dining room (x=-6, z=-2.2)
  const dr = parts.get('diningRoom').group;
  const dt = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.06, 16), MATS.woodLight); dt.position.set(-6, 0.85 + F, -2.2); addTo('diningRoom', dt); dr.add(dt);
  const dtLeg = cyl(0.08, 0.8, MATS.woodDark); dtLeg.position.set(-6, 0.4 + F, -2.2); addTo('diningRoom', dtLeg); dr.add(dtLeg);
  for (const [sx, sz] of [[-6.5, -2.2], [-5.5, -2.2], [-6, -2.7], [-6, -1.7]]) { dr.add(makeChair(sx, sz, F)); }
  const sb = box(1.6, 1.0, 0.4, MATS.woodDark); sb.position.set(-6, 0.5 + F, -4.0); addTo('diningRoom', sb); dr.add(sb);

  // Register all child meshes
  for (const name of ['elderRoom1', 'elderRoom2', 'livingRoom', 'kitchen', 'diningRoom']) {
    const p = parts.get(name);
    if (!p) continue;
    p.group.traverse(c => { if (c.isMesh && !p.meshArr.includes(c)) { p.meshArr.push(c); c.userData.partName = name; c.castShadow = true; c.receiveShadow = true; } });
  }
}
