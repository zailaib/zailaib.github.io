/* 2F — rooms (masterBed, secondBed, study, childRoom1, childRoom2) */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, WALL_T, INT_WALL_T, BAY_W, HW2, HD2, BAND_Y } from '../config.js';

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function buildFloor2Rooms(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  const B = BAND_Y;

  function makeBed(gx, gz, fy, w = 2.2, d = 1.8) {
    const bg = new THREE.Group();
    const frame = box(w, 0.15, d, MATS.bedFrame); frame.position.y = 0.08 + fy;
    bg.add(frame);
    const head = box(w, 0.8, 0.06, MATS.bedFrame); head.position.set(0, 0.5 + fy, -d / 2 + 0.05);
    bg.add(head);
    const foot = box(w, 0.3, 0.05, MATS.bedFrame); foot.position.set(0, 0.2 + fy, d / 2 - 0.03);
    bg.add(foot);
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
    wg.add(box(1.2, 2.0, 0.6, MATS.woodDark)); wg.children[0].position.y = 1.0 + fy;
    wg.add(box(0.55, 1.8, 0.04, MATS.woodLight)); wg.children[1].position.set(-0.28, 1.0 + fy, 0.32);
    wg.add(box(0.55, 1.8, 0.04, MATS.woodLight)); wg.children[2].position.set(0.28, 1.0 + fy, 0.32);
    wg.position.set(gx, 0, gz); return wg;
  }

  function makeDesk(gx, gz, fy, w = 1.6, d = 0.7) {
    const dg = new THREE.Group();
    dg.add(box(w, 0.05, d, MATS.woodLight)); dg.children[0].position.y = 0.9 + fy;
    for (const [lx, lz] of [[-w / 2 + 0.1, -d / 2 + 0.1], [w / 2 - 0.1, -d / 2 + 0.1], [-w / 2 + 0.1, d / 2 - 0.1], [w / 2 - 0.1, d / 2 - 0.1]]) {
      const leg = box(0.06, 0.85, 0.06, MATS.woodDark); leg.position.set(lx, 0.42 + fy, lz); dg.add(leg);
    }
    dg.position.set(gx, 0, gz); return dg;
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

  // Master bedroom (x=-6, z=2.2)
  const mb = parts.get('masterBed').group;
  mb.add(makeBed(-6, 3.5, B, 2.2, 1.8));
  mb.add(makeWardrobe(-5.5, 1.0, B));
  mb.add(makeDesk(-7.0, 1.5, B, 1.2, 0.6));

  // Second bedroom (x=-2, z=2.2)
  const sb2 = parts.get('secondBed').group;
  sb2.add(makeBed(-2, 3.5, B));
  sb2.add(makeDesk(-1.0, 1.5, B, 1.4, 0.6));

  // Study (x=2, z=2.2)
  const sy = parts.get('study').group;
  sy.add(makeDesk(2, 3.5, B, 2.0, 0.8));
  sy.add(makeChair(2, 2.5, B));
  const bs = box(1.8, 2.2, 0.35, MATS.woodDark); bs.position.set(2, 1.1 + B, 1.8); addTo('study', bs); sy.add(bs);
  for (let sh = 0; sh < 3; sh++) {
    const shelf = box(1.6, 0.04, 0.33, MATS.woodLight);
    shelf.position.set(2, 0.6 + B + sh * 0.6, 1.82 + (sh % 2 === 0 ? 0.005 : -0.005));
    addTo('study', shelf); sy.add(shelf);
  }

  // Child room 1 (x=6, z=2.2)
  const cr1 = parts.get('childRoom1').group;
  cr1.add(makeBed(6, 3.5, B, 1.8, 1.3));
  const toyBox = box(0.7, 0.5, 0.5, MATS.woodLight); toyBox.position.set(7.0, 0.25 + B, 1.5); addTo('childRoom1', toyBox); cr1.add(toyBox);
  cr1.add(makeDesk(5.5, 1.5, B, 1.2, 0.5));

  // Child room 2 (x=-6, z=-2.2)
  const cr2 = parts.get('childRoom2').group;
  cr2.add(makeBed(-6, -1.5, B, 1.8, 1.3));
  cr2.add(makeDesk(-7.0, -2.5, B, 1.2, 0.5));
  const bs2 = box(1.2, 1.5, 0.3, MATS.woodDark); bs2.position.set(-5.5, 0.75 + B, -3.0); addTo('childRoom2', bs2); cr2.add(bs2);

  // Register all created meshes
  for (const name of ['masterBed', 'secondBed', 'study', 'childRoom1', 'childRoom2']) {
    const p = parts.get(name);
    if (!p) continue;
    p.group.traverse(c => { if (c.isMesh && !p.meshArr.includes(c)) { p.meshArr.push(c); c.userData.partName = name; c.castShadow = true; c.receiveShadow = true; } });
  }
}
