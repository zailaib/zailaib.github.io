/* Roof — tiles + frame */
import * as THREE from 'three';
import { HOUSE_W, HOUSE_D, ROOF_H, EAVE_H, ROOF_OH, ROOF_RISE, HW2, HD2 } from '../config.js';

export function buildRoof(houseGroup, parts, MATS) {
  function addTo(name, mesh) {
    const p = parts.get(name);
    if (p) { p.meshArr.push(mesh); mesh.userData.partName = name; mesh.castShadow = true; mesh.receiveShadow = true; }
  }

  // Roof tiles
  const roofGrp = parts.get('roofTiles').group;
  const rHW = HW2 + ROOF_OH + 0.1, rHD = HD2 + ROOF_OH + 0.1;
  const verts = new Float32Array([
    -rHW, ROOF_H, 0, rHW, ROOF_H, 0,
    -rHW, EAVE_H, rHD, rHW, EAVE_H, rHD,
    -rHW, EAVE_H, -rHD, rHW, EAVE_H, -rHD,
  ]);
  const roofGeo = new THREE.BufferGeometry();
  roofGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  roofGeo.setIndex([0, 1, 3, 0, 3, 2, 0, 5, 1, 0, 4, 5, 0, 2, 4, 1, 5, 3]);
  roofGeo.computeVertexNormals();
  const roofMesh = new THREE.Mesh(roofGeo, MATS.roofTile);
  addTo('roofTiles', roofMesh); roofGrp.add(roofMesh);

  // Ridge cap
  const ridgeCap = new THREE.Mesh(new THREE.BoxGeometry(HOUSE_W + 1.8, 0.2, 0.3), MATS.ridge);
  ridgeCap.position.set(0, ROOF_H + 0.1, 0);
  addTo('roofTiles', ridgeCap); roofGrp.add(ridgeCap);

  for (const side of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.35), MATS.ridge);
    tip.position.set(side * (HW2 + 1.0), ROOF_H + 0.25, 0);
    tip.rotation.z = side * 0.15; tip.rotation.x = 0.1;
    addTo('roofTiles', tip); roofGrp.add(tip);
  }

  // Roof frame
  const rfGrp = parts.get('roofFrame').group;
  const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(HOUSE_W + 1.4, 0.15, 0.12), MATS.roofFrame);
  ridgeBeam.position.set(0, ROOF_H - 0.08, 0);
  addTo('roofFrame', ridgeBeam); rfGrp.add(ridgeBeam);

  for (const z of [-HD2 - 0.8, HD2 + 0.8]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(HOUSE_W + 1.4, 0.1, 0.1), MATS.roofFrame);
    p.position.set(0, EAVE_H + 0.05, z);
    addTo('roofFrame', p); rfGrp.add(p);
  }

  // Rafters
  const rafterCount = 13;
  for (let i = 0; i < rafterCount; i++) {
    const x = -HW2 - 0.5 + i * (HOUSE_W + 1) / (rafterCount - 1);
    for (const side of [-1, 1]) {
      const halfSpan = HD2 + ROOF_OH;
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, halfSpan), MATS.roofFrame);
      rafter.position.set(x, (ROOF_H + EAVE_H) / 2 + (i % 3) * 0.003, side * (halfSpan / 2 - ROOF_OH / 2));
      rafter.rotation.x = side * Math.atan2(ROOF_H - EAVE_H, halfSpan);
      addTo('roofFrame', rafter); rfGrp.add(rafter);
    }
  }
}
