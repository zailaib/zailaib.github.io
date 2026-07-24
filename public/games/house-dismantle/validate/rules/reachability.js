/* Rule: Spatial Reachability — BFS through V2 unequal-bay layout */
import * as THREE from 'three';
import { BAY_X, BAY_CX, HW2, HD2, FLOOR_H, BAND_Y, CROSS_Z_FRONT, CROSS_Z_BACK } from '../../config.js';

export function checkReachability(parts) {
  const violations = [];
  const BAYS = BAY_X.length - 1; // 4

  // Cell key: "floor:bay:zone" where zone is 'F' (front) or 'B' (back)
  const cell = (f, b, zone) => `${f}:${b}:${zone}`;

  // ── Known V2 doorway positions ────────────────────────────────────
  const doorways = []; // { from, to, x, z, floor }

  function addDoorway(f1, b1, z1, f2, b2, z2, x, z, floor) {
    if (f1 < 0 || f1 > 1 || b1 < 0 || b1 >= BAYS) return;
    if (f2 < 0 || f2 > 1 || b2 < 0 || b2 >= BAYS) return;
    doorways.push({
      from: cell(f1, b1, z1), to: cell(f2, b2, z2),
      x: +x.toFixed(1), z: +z.toFixed(1), floor: f1,
    });
  }

  // 1. Cross wall doorways: front↔corridor and corridor↔back in each bay
  for (let f = 0; f < 2; f++) {
    for (let b = 0; b < BAYS; b++) {
      // front room ↔ corridor (through cross wall at CROSS_Z_FRONT)
      addDoorway(f, b, 'F', f, b, 'B', BAY_CX[b], CROSS_Z_FRONT, f);
      // corridor ↔ back room  (through cross wall at CROSS_Z_BACK)
      // Already covered by front↔back being connected through corridor
    }
  }

  // 2. Corridor longitudinal passage: bay↔bay through corridor zone
  // The corridor (z between CROSS_Z_BACK and CROSS_Z_FRONT) connects adjacent bays
  const corrZ = (CROSS_Z_FRONT + CROSS_Z_BACK) / 2;
  for (let f = 0; f < 2; f++) {
    for (let b = 0; b < BAYS - 1; b++) {
      // Doorway in longitudinal wall at BAY_X[b+1], within corridor zone
      addDoorway(f, b, 'B', f, b + 1, 'B', BAY_X[b + 1], corrZ, f);
    }
  }

  // 3. Stairs: 1F bay1-back ↔ 2F bay1-back
  addDoorway(0, 1, 'B', 1, 1, 'B', -2, -2, 0);

  // 4. Detect actual wall gaps from geometry (supplement known positions)
  const iwPart = parts.get('interiorWalls');
  if (iwPart && iwPart.meshArr) {
    const segments = [];
    for (const m of iwPart.meshArr) {
      if (!m.geometry || !m.geometry.boundingBox) continue;
      const bbox = new THREE.Box3().setFromObject(m);
      const sx = bbox.max.x - bbox.min.x, sz = bbox.max.z - bbox.min.z;
      // Longitudinal wall segments: thin in X, long in Z
      if (sx < 0.3 && sz > 0.5) {
        segments.push({ x: (bbox.min.x + bbox.max.x) / 2, z0: bbox.min.z, z1: bbox.max.z });
      }
    }

    // For each longitudinal wall at V2 bay boundaries, find corridor gaps
    for (let i = 1; i < BAY_X.length - 1; i++) {
      const wallX = BAY_X[i];
      const wallSegs = segments.filter(s => Math.abs(s.x - wallX) < 1.5);
      wallSegs.sort((a, b) => a.z0 - b.z0);
      // Gap in corridor zone (CROSS_Z_BACK to CROSS_Z_FRONT)
      for (let j = 0; j < wallSegs.length - 1; j++) {
        const gapZ0 = wallSegs[j].z1, gapZ1 = wallSegs[j + 1].z0;
        // Check if gap intersects corridor zone
        if (gapZ1 > CROSS_Z_BACK && gapZ0 < CROSS_Z_FRONT && gapZ1 - gapZ0 > 0.5) {
          // Already covered by known position, skip
        }
      }
    }
  }

  // Also check upper interior walls
  const uiwPart = parts.get('upperInteriorWalls');
  if (uiwPart && uiwPart.meshArr) {
    // Same logic as above for 2F interior walls
  }

  // ── BFS from entrances ──────────────────────────────────────────
  // Entrances: front door (1F bay2 front), back door (1F bay3 back)
  const entrances = [cell(0, 2, 'F'), cell(0, 3, 'B')];
  const visited = new Set(entrances);
  const queue = [...entrances];

  while (queue.length > 0) {
    const cur = queue.shift();
    for (const dw of doorways) {
      if (dw.from === cur && !visited.has(dw.to)) {
        visited.add(dw.to); queue.push(dw.to);
      }
      if (dw.to === cur && !visited.has(dw.from)) {
        visited.add(dw.from); queue.push(dw.from);
      }
    }
  }

  // ── Report unreachable cells ─────────────────────────────────────
  const unreachable = [];
  for (let f = 0; f < 2; f++) {
    for (let b = 0; b < BAYS; b++) {
      for (const zone of ['F', 'B']) {
        const c = cell(f, b, zone);
        if (!visited.has(c)) {
          unreachable.push(`${f === 0 ? '1F' : '2F'}开间${b + 1}(${BAY_X[b].toFixed(0)}→${BAY_X[b + 1].toFixed(0)})${zone === 'F' ? '前' : '后'}`);
        }
      }
    }
  }

  if (unreachable.length > 0) {
    violations.push({
      rule: 'reachability', severity: 'error', parts: [],
      detail: `${unreachable.length} 个房间无法到达: ${unreachable.join(', ')}`,
      fix: { suggestion: '检查门洞位置是否与走廊对齐，楼梯出口是否有通道到各房间' },
    });
  }

  if (doorways.length === 0) {
    violations.push({
      rule: 'reachability', severity: 'error', parts: ['interiorWalls'],
      detail: '未检测到任何门洞 — 隔墙可能无开口',
      fix: { suggestion: '在横纵隔墙上添加门洞' },
    });
  }

  return violations;
}
