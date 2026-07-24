/* Dabie Mountain 4-Bay 2-Story — Interior Furniture */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, WALL_T, INT_WALL_T, FLOOR_H, BAY_W, BAY_COUNT, HW2, HD2, BAND_Y } from './config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
function cyl(r, h, m, s = 12) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, s), m); }

export function buildInterior(houseGroup, parts, MATS) {
  function partGrp(name, label, color, deps = []) {
    const g = new THREE.Group(); g.name = name;
    if (!parts.has(name)) { parts.set(name, { group: g, label, color, deps, assembled: true, meshArr: [] }); houseGroup.add(g); }
    return parts.get(name).group;
  }
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  const F = FLOOR_H, B = BAND_Y;
  // Bay centers: -6, -2, 2, 6. Front rooms z≈2.2, Back rooms z≈-2.2.

  function makeBed(gx, gz, fy, w = 2.0, d = 1.6) {
    const bg = new THREE.Group();
    const frame = box(w, 0.15, d, MATS.bedFrame); frame.position.y = 0.08 + fy;
    addTo(bg.name || 'bed', frame); bg.add(frame);
    const head = box(w, 0.8, 0.06, MATS.bedFrame); head.position.set(0, 0.5 + fy, -d / 2 + 0.05);
    addTo(bg.name || 'bed', head); bg.add(head);
    const foot = box(w, 0.3, 0.05, MATS.bedFrame); foot.position.set(0, 0.2 + fy, d / 2 - 0.03);
    addTo(bg.name || 'bed', foot); bg.add(foot);
    const mat = box(w - 0.15, 0.12, d - 0.15, MATS.mattress); mat.position.y = 0.22 + fy;
    bg.add(mat);
    const quilt = box(w - 0.4, 0.1, d * 0.45, MATS.bedMat); quilt.position.set(0, 0.3 + fy, d * 0.2);
    bg.add(quilt);
    const pillow = box(0.5, 0.06, 0.35, MATS.mattress); pillow.position.set(w * 0.15, 0.25 + fy, -d * 0.3);
    bg.add(pillow);
    bg.position.set(gx, 0, gz); return bg;
  }

  function makeWardrobe(gx, gz, fy) {
    const wg = new THREE.Group();
    const body = box(1.2, 2.0, 0.6, MATS.woodDark); body.position.y = 1.0 + fy;
    wg.add(body);
    const doorL = box(0.55, 1.8, 0.04, MATS.woodLight); doorL.position.set(-0.28, 1.0 + fy, 0.32);
    wg.add(doorL);
    const doorR = box(0.55, 1.8, 0.04, MATS.woodLight); doorR.position.set(0.28, 1.0 + fy, 0.32);
    wg.add(doorR);
    wg.position.set(gx, 0, gz); return wg;
  }

  function makeDesk(gx, gz, fy, w = 1.6, d = 0.7) {
    const dg = new THREE.Group();
    const top = box(w, 0.05, d, MATS.woodLight); top.position.y = 0.9 + fy;
    dg.add(top);
    for (const [lx, lz] of [[-w / 2 + 0.1, -d / 2 + 0.1], [w / 2 - 0.1, -d / 2 + 0.1], [-w / 2 + 0.1, d / 2 - 0.1], [w / 2 - 0.1, d / 2 - 0.1]]) {
      const leg = box(0.06, 0.85, 0.06, MATS.woodDark); leg.position.set(lx, 0.42 + fy, lz);
      dg.add(leg);
    }
    dg.position.set(gx, 0, gz); return dg;
  }

  function makeChair(gx, gz, fy) {
    const cg = new THREE.Group();
    const seat = box(0.4, 0.05, 0.4, MATS.woodLight); seat.position.y = 0.5 + fy; cg.add(seat);
    const back = box(0.4, 0.4, 0.04, MATS.woodDark); back.position.set(0, 0.7 + fy, -0.18); cg.add(back);
    for (const [lx, lz] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) {
      const leg = box(0.04, 0.5, 0.04, MATS.woodDark); leg.position.set(lx, 0.25 + fy, lz); cg.add(leg);
    }
    cg.position.set(gx, 0, gz); return cg;
  }

  // ═══════════════════════════════════════════════════════════════
  // GROUND FLOOR (y = F)
  // ═══════════════════════════════════════════════════════════════

  // 1. ELDER ROOM 1 — Bay1 front (x=-6, z=2.2)
  const er1 = partGrp('elderRoom1', '老人房1', '#7a4a20', ['wallLeft', 'interiorWalls']);
  er1.add(makeBed(-6, 3.5, F)); // against left wall
  er1.add(makeWardrobe(-5.5, 1.0, F)); // against interior wall
  const er1Table = box(0.5, 0.5, 0.5, MATS.wood); er1Table.position.set(-7.2, F + 0.25, 2.5); addTo('elderRoom1', er1Table); er1.add(er1Table);

  // 2. ELDER ROOM 2 — Bay2 front (x=-2, z=2.2)
  const er2 = partGrp('elderRoom2', '老人房2', '#7a4a20', ['interiorWalls']);
  er2.add(makeBed(-2, 3.5, F));
  er2.add(makeWardrobe(-1.5, 1.0, F));
  const er2Table = box(0.5, 0.5, 0.5, MATS.wood); er2Table.position.set(-3.2, F + 0.25, 2.5); addTo('elderRoom2', er2Table); er2.add(er2Table);

  // 3. LIVING ROOM — Bay3 front (x=2, z=2.2)
  const lr = partGrp('livingRoom', '客厅', '#8b6914', ['interiorWalls']);
  const lt = box(2.2, 0.06, 1.6, MATS.woodLight); lt.position.set(2, 0.85 + F, 2.5); addTo('livingRoom', lt); lr.add(lt);
  for (const [lx, lz] of [[-0.95, -0.65], [0.95, -0.65], [-0.95, 0.65], [0.95, 0.65]]) {
    const leg = box(0.08, 0.8, 0.08, MATS.woodDark); leg.position.set(2 + lx, 0.4 + F, lz + 2.5); addTo('livingRoom', leg); lr.add(leg);
  }
  // Tea cabinet
  const tc = box(1.4, 1.5, 0.4, MATS.woodDark); tc.position.set(2, 0.75 + F, 0.3); addTo('livingRoom', tc); lr.add(tc);
  // 4 stools around table
  for (const [sx, sz] of [[2, 1.3], [2, 3.7], [0.7, 2.5], [3.3, 2.5]]) { lr.add(makeChair(sx, sz, F)); }

  // 4. KITCHEN — Bay4 front (x=6, z=2.2)
  const kt = partGrp('kitchen', '厨房', '#8b5a3a', ['wallRight', 'interiorWalls']);
  const stove = box(1.8, 0.7, 1.0, MATS.stoveBrick); stove.position.set(6, F + 0.35, 3.0); addTo('kitchen', stove); kt.add(stove);
  const stoveTop = box(1.8, 0.04, 1.0, MATS.stoveDark); stoveTop.position.set(6, F + 0.72, 3.0); addTo('kitchen', stoveTop); kt.add(stoveTop);
  const wokGeo = new THREE.SphereGeometry(0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const wok = new THREE.Mesh(wokGeo, MATS.wokMetal); wok.position.set(6, F + 0.74, 2.85); addTo('kitchen', wok); kt.add(wok);
  for (let i = 0; i < 6; i++) {
    const log = cyl(0.05, 0.7, MATS.woodDark, 8); log.rotation.z = Math.PI / 2; log.position.set(5.1, F + 0.08 + i * 0.1, 3.3); addTo('kitchen', log); kt.add(log);
  }
  const jarGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.7, 12);
  const jar = new THREE.Mesh(jarGeo, MATS.base); jar.position.set(7.2, F + 0.35, 3.0); addTo('kitchen', jar); kt.add(jar);
  // Grain sacks
  for (const [gx, gz] of [[5.2, 1.5], [5.5, 1.2]]) {
    const sack = cyl(0.2, 0.5, MATS.grainSack, 8); sack.position.set(gx, F + 0.25, gz); addTo('kitchen', sack); kt.add(sack);
  }

  // 5. DINING ROOM — Bay1 back (x=-6, z=-2.2)
  const dr = partGrp('diningRoom', '餐厅', '#8b6914', ['wallLeft', 'interiorWalls']);
  const dtGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.06, 16);
  const dt = new THREE.Mesh(dtGeo, MATS.woodLight); dt.position.set(-6, 0.85 + F, -2.2); addTo('diningRoom', dt); dr.add(dt);
  const dtLeg = cyl(0.08, 0.8, MATS.woodDark); dtLeg.position.set(-6, 0.4 + F, -2.2); addTo('diningRoom', dtLeg); dr.add(dtLeg);
  // 4 stools
  for (const [sx, sz] of [[-6.5, -2.2], [-5.5, -2.2], [-6, -2.7], [-6, -1.7]]) { dr.add(makeChair(sx, sz, F)); }
  // Sideboard
  const sb = box(1.6, 1.0, 0.4, MATS.woodDark); sb.position.set(-6, 0.5 + F, -4.0); addTo('diningRoom', sb); dr.add(sb);

  // 6. SHRINE — Bay2-3 back middle (x=0, z=-4.0)
  const sh = partGrp('shrine', '神龛', '#4a2010', ['wallBack']);
  const st = box(2.4, 0.06, 0.6, MATS.shrineMat); st.position.set(0, 1.2 + F, -4.0); addTo('shrine', st); sh.add(st);
  for (const sx of [-1.05, 1.05]) { const leg = box(0.06, 1.1, 0.06, MATS.shrineMat); leg.position.set(sx, 0.55 + F, -4.0); addTo('shrine', leg); sh.add(leg); }
  for (let i = -1; i <= 1; i++) { const tab = box(0.25, 0.5, 0.04, MATS.woodDark); tab.position.set(i * 0.4, 1.55 + F, -4.0); addTo('shrine', tab); sh.add(tab); }
  const burnerGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 8);
  const burner = new THREE.Mesh(burnerGeo, MATS.wokMetal); burner.position.set(0, 1.3 + F, -4.0); addTo('shrine', burner); sh.add(burner);

  // ═══════════════════════════════════════════════════════════════
  // UPPER FLOOR (y = B)
  // ═══════════════════════════════════════════════════════════════

  // 7. MASTER BEDROOM — Bay1 front (x=-6, z=2.2)
  const mb = partGrp('masterBed', '主卧', '#7a4a20', ['upperWallLeft', 'interiorWalls']);
  mb.add(makeBed(-6, 3.5, B, 2.2, 1.8));
  mb.add(makeWardrobe(-5.5, 1.0, B));
  mb.add(makeDesk(-7.0, 1.5, B, 1.2, 0.6));

  // 8. SECOND BEDROOM — Bay2 front (x=-2, z=2.2)
  const sb2 = partGrp('secondBed', '次卧', '#7a4a20', ['interiorWalls']);
  sb2.add(makeBed(-2, 3.5, B));
  sb2.add(makeDesk(-1.0, 1.5, B, 1.4, 0.6));

  // 9. STUDY — Bay3 front (x=2, z=2.2)
  const sy = partGrp('study', '书房', '#8b6914', ['interiorWalls']);
  sy.add(makeDesk(2, 3.5, B, 2.0, 0.8));
  sy.add(makeChair(2, 2.5, B));
  const bs = box(1.8, 2.2, 0.35, MATS.woodDark); bs.position.set(2, 1.1 + B, 1.8); addTo('study', bs); sy.add(bs);
  for (let sh2 = 0; sh2 < 3; sh2++) {
    const shelf = box(1.6, 0.04, 0.33, MATS.woodLight); shelf.position.set(2, 0.6 + B + sh2 * 0.6, 1.82 + (sh2 % 2 === 0 ? 0.005 : -0.005)); addTo('study', shelf); sy.add(shelf);
  }

  // 10. CHILD ROOM 1 — Bay4 front (x=6, z=2.2)
  const cr1 = partGrp('childRoom1', '儿童房1', '#7a4a20', ['upperWallRight', 'interiorWalls']);
  cr1.add(makeBed(6, 3.5, B, 1.8, 1.3));
  const toyBox = box(0.7, 0.5, 0.5, MATS.woodLight); toyBox.position.set(7.0, 0.25 + B, 1.5); addTo('childRoom1', toyBox); cr1.add(toyBox);
  cr1.add(makeDesk(5.5, 1.5, B, 1.2, 0.5));

  // 11. CHILD ROOM 2 — Bay1 back (x=-6, z=-2.2)
  const cr2 = partGrp('childRoom2', '儿童房2', '#7a4a20', ['upperWallLeft', 'interiorWalls']);
  cr2.add(makeBed(-6, -1.5, B, 1.8, 1.3));
  cr2.add(makeDesk(-7.0, -2.5, B, 1.2, 0.5));
  const bs2 = box(1.2, 1.5, 0.3, MATS.woodDark); bs2.position.set(-5.5, 0.75 + B, -3.0); addTo('childRoom2', bs2); cr2.add(bs2);
}
