/* House Dismantle — Interior Furniture */

import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_H2, WALL_T, FLOOR_H, BAY_W, HW2, HD2, WY1, BAND_Y } from './config.js';

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}
function cyl(r, h, material, seg = 12) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), material);
}

export function buildInterior(houseGroup, parts, MATS) {

  function partGrp(name, label, color, deps = []) {
    const g = new THREE.Group(); g.name = name;
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
  // BEDS (right bay — bedroom)
  // Two wooden bed frames with mattresses
  // ═══════════════════════════════════════════════════════════════
  const bedGrp = partGrp('beds', '床铺', '#7a4a20', ['wallRight','interiorWall2']);
  const bedX = BAY_W; // right bay center
  const bedY = FLOOR_H;

  function makeBed(bx, bz) {
    const bedG = new THREE.Group();
    // Bed frame (platform)
    const frame = box(2.0, 0.15, 1.6, MATS.bedFrame);
    frame.position.set(0, 0.08, 0);
    addTo('beds', frame); bedG.add(frame);
    // Headboard
    const headboard = box(2.0, 0.8, 0.06, MATS.bedFrame);
    headboard.position.set(0, 0.5, -0.75);
    addTo('beds', headboard); bedG.add(headboard);
    // Footboard
    const footboard = box(2.0, 0.3, 0.05, MATS.bedFrame);
    footboard.position.set(0, 0.2, 0.78);
    addTo('beds', footboard); bedG.add(footboard);
    // Mattress
    const mattress = box(1.85, 0.12, 1.45, MATS.mattress);
    mattress.position.set(0, 0.22, 0);
    addTo('beds', mattress); bedG.add(mattress);
    // Quilt (red blanket folded at foot)
    const quilt = box(1.6, 0.1, 0.7, MATS.bedMat);
    quilt.position.set(0, 0.3, 0.4);
    addTo('beds', quilt); bedG.add(quilt);
    // Pillow
    const pillow = box(0.5, 0.06, 0.35, MATS.mattress);
    pillow.position.set(0.3, 0.25, -0.55);
    addTo('beds', pillow); bedG.add(pillow);

    bedG.position.set(bx, bedY, bz);
    return bedG;
  }

  // Two beds side by side against the right wall
  bedGrp.add(makeBed(0, -HD2 + 1.5)); // near back wall
  bedGrp.add(makeBed(0, -HD2 + 3.5)); // closer to center

  // Small bedside table between beds
  const nightstand = box(0.5, 0.5, 0.5, MATS.wood);
  nightstand.position.set(bedX, bedY + 0.25, -HD2 + 2.5);
  addTo('beds', nightstand); bedGrp.add(nightstand);

  // ═══════════════════════════════════════════════════════════════
  // TABLE & CHAIRS (center bay — dining/living area)
  // Square wooden table with 4 benches
  // ═══════════════════════════════════════════════════════════════
  const tableGrp = partGrp('tableChairs', '桌椅', '#8b6914',
    ['wallFront','wallBack','interiorWall1','interiorWall2']);

  // Table top
  const tableTop = box(2.0, 0.06, 1.5, MATS.woodLight);
  tableTop.position.set(0, 0.85, 2.5); // front room, center bay
  addTo('tableChairs', tableTop); tableGrp.add(tableTop);

  // Table legs
  for (const [lx, lz] of [[-0.85,-0.6],[0.85,-0.6],[-0.85,0.6],[0.85,0.6]]) {
    const leg = box(0.08, 0.8, 0.08, MATS.woodDark);
    leg.position.set(lx, 0.4, lz);
    addTo('tableChairs', leg); tableGrp.add(leg);
  }

  // Benches (4 — one on each side)
  function makeBench(bx, bz, rotY = 0) {
    const bg = new THREE.Group();
    const seat = box(1.6, 0.05, 0.35, MATS.woodLight);
    seat.position.y = 0.5;
    addTo('tableChairs', seat); bg.add(seat);
    for (const lx of [-0.65, 0.65]) {
      const leg = box(0.06, 0.5, 0.06, MATS.woodDark);
      leg.position.set(lx, 0.25, 0);
      addTo('tableChairs', leg); bg.add(leg);
    }
    bg.position.set(bx, bedY, bz);
    bg.rotation.y = rotY;
    return bg;
  }
  tableGrp.add(makeBench(0, 1.4, 0));             // front of table
  tableGrp.add(makeBench(0, 3.6, Math.PI));       // back of table
  tableGrp.add(makeBench(-1.1, 2.5, Math.PI/2));  // left
  tableGrp.add(makeBench(1.1, 2.5, -Math.PI/2));  // right

  // ═══════════════════════════════════════════════════════════════
  // KITCHEN STOVE (left bay)
  // Brick stove platform with wok, water jar, firewood
  // ═══════════════════════════════════════════════════════════════
  const stoveGrp = partGrp('stove', '灶台', '#8b5a3a', ['wallLeft','interiorWall1']);
  const stoveX = -BAY_W; // left bay center
  const stoveZ = -HD2 + 1.2; // back of house

  // Stove brick platform
  const stoveBody = box(1.6, 0.7, 1.0, MATS.stoveBrick);
  stoveBody.position.set(stoveX, bedY + 0.35, stoveZ);
  addTo('stove', stoveBody); stoveGrp.add(stoveBody);

  // Stove top (darker, soot)
  const stoveTop = box(1.6, 0.04, 1.0, MATS.stoveDark);
  stoveTop.position.set(stoveX, bedY + 0.72, stoveZ);
  addTo('stove', stoveTop); stoveGrp.add(stoveTop);

  // Wok (large pot on top)
  const wokGeo = new THREE.SphereGeometry(0.35, 16, 8, 0, Math.PI*2, 0, Math.PI/2);
  const wok = new THREE.Mesh(wokGeo, MATS.wokMetal);
  wok.position.set(stoveX, bedY + 0.74, stoveZ - 0.15);
  addTo('stove', wok); stoveGrp.add(wok);

  // Small pot
  const smallWokGeo = new THREE.SphereGeometry(0.22, 12, 6, 0, Math.PI*2, 0, Math.PI/2);
  const smallWok = new THREE.Mesh(smallWokGeo, MATS.wokMetal);
  smallWok.position.set(stoveX + 0.4, bedY + 0.76, stoveZ + 0.2);
  addTo('stove', smallWok); stoveGrp.add(smallWok);

  // Firewood stack beside stove
  for (let i = 0; i < 6; i++) {
    const log = cyl(0.05, 0.7, MATS.woodDark, 8);
    log.rotation.z = Math.PI/2;
    log.position.set(stoveX - 0.5, bedY + 0.08 + i * 0.1, stoveZ + 0.4);
    addTo('stove', log); stoveGrp.add(log);
  }

  // Water jar (large ceramic)
  const jarGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.7, 12);
  const jar = new THREE.Mesh(jarGeo, MATS.base);
  jar.position.set(stoveX + 0.7, bedY + 0.35, stoveZ + 0.3);
  addTo('stove', jar); stoveGrp.add(jar);

  // Chopping board on table nearby
  const board = box(0.5, 0.04, 0.35, MATS.woodLight);
  board.position.set(stoveX + 0.8, bedY + 0.75, stoveZ - 0.5);
  addTo('stove', board); stoveGrp.add(board);

  // ═══════════════════════════════════════════════════════════════
  // ANCESTOR SHRINE (center bay, against back wall)
  // ═══════════════════════════════════════════════════════════════
  const shrineGrp = partGrp('shrine', '神龛', '#4a2010', ['wallBack']);
  const shrineZ = -HD2 + 0.3; // against back wall

  // Shrine table
  const shrineTable = box(2.2, 0.06, 0.6, MATS.shrineMat);
  shrineTable.position.set(0, 1.1, shrineZ);
  addTo('shrine', shrineTable); shrineGrp.add(shrineTable);

  // Table legs
  for (const sx of [-0.95, 0.95]) {
    const leg = box(0.06, 1.0, 0.06, MATS.shrineMat);
    leg.position.set(sx, 0.5, shrineZ);
    addTo('shrine', leg); shrineGrp.add(leg);
  }

  // Ancestor tablets (vertical plaques)
  for (let i = -1; i <= 1; i++) {
    const tablet = box(0.25, 0.5, 0.04, MATS.woodDark);
    tablet.position.set(i * 0.4, 1.45, shrineZ);
    addTo('shrine', tablet); shrineGrp.add(tablet);
  }

  // Incense burner (small cylinder)
  const burnerGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 8);
  const burner = new THREE.Mesh(burnerGeo, MATS.wokMetal);
  burner.position.set(0, 1.2, shrineZ);
  addTo('shrine', burner); shrineGrp.add(burner);
}
