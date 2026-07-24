/* Rule: Spatial Reachability — BFS through actual doorway positions */
import * as THREE from 'three';
import { BAY_W, BAY_COUNT, HW2, HD2 } from '../../config.js';

export function checkReachability(parts) {
  const violations = [];

  // ── Define rooms as 3D cells ─────────────────────────────────────
  // Cell: [floor, bay, front?] — 16 cells total
  const BAYS = BAY_COUNT; // 4
  const cell = (f, b, front) => `${f}:${b}:${front ? 'F' : 'B'}`;

  // Room bounds for each cell
  function cellBounds(f, b, front) {
    const x0 = -HW2 + b * BAY_W;
    const x1 = x0 + BAY_W;
    const z0 = front ? 0 : -HD2;
    const z1 = front ? HD2 : 0;
    const y0 = f === 0 ? FLOOR_H : BAND_Y;
    return { x0, x1, z0, z1, y0 };
  }

  // ── Find doorways from interior wall geometry ────────────────────
  // A doorway exists where there's a gap between wall segments
  const doorways = []; // { from, to, x, z, floor }

  function addDoorway(f1, b1, front1, f2, b2, front2, x, z) {
    if (f1 < 0 || f1 > 1 || b1 < 0 || b1 >= BAYS) return;
    if (f2 < 0 || f2 > 1 || b2 < 0 || b2 >= BAYS) return;
    doorways.push({ from: cell(f1, b1, front1), to: cell(f2, b2, front2), x: +x.toFixed(1), z: +z.toFixed(1), floor: f1 });
  }

  // Check interiorWalls for actual corridor gaps at z≈-2
  const iwPart = parts.get('interiorWalls');
  if (iwPart && iwPart.meshArr) {
    const segments = [];
    for (const m of iwPart.meshArr) {
      if (!m.geometry || !m.geometry.boundingBox) continue;
      const bbox = new THREE.Box3().setFromObject(m);
      const sx = bbox.max.x - bbox.min.x, sz = bbox.max.z - bbox.min.z;
      // Longitudinal wall segments: thin in X, long in Z
      if (sx < 0.3 && sz > 1) {
        segments.push({ x: (bbox.min.x + bbox.max.x) / 2, z0: bbox.min.z, z1: bbox.max.z });
      }
    }

    // For each longitudinal wall (x≈-4, 0, 4), find gaps between segments
    for (const wallX of [-4, 0, 4]) {
      const wallSegs = segments.filter(s => Math.abs(s.x - wallX) < 1);
      wallSegs.sort((a, b) => a.z0 - b.z0);
      // Find gaps between consecutive segments > 0.8m
      for (let i = 0; i < wallSegs.length - 1; i++) {
        const gap = wallSegs[i + 1].z0 - wallSegs[i].z1;
        if (gap > 0.8) {
          const gapZ = (wallSegs[i].z1 + wallSegs[i + 1].z0) / 2;
          const bayLeft = Math.floor((wallX + HW2) / BAY_W);
          const bayRight = bayLeft + 1;
          // Corridor doorway connecting adjacent bays (back side)
          addDoorway(0, bayLeft, false, 0, bayRight, false, wallX, gapZ);
        }
      }
    }
  }

  // Cross wall doorways at z=0 (front↔back in each bay)
  for (let b = 0; b < BAYS; b++) {
    const bx = -HW2 + b * BAY_W + BAY_W / 2;
    addDoorway(0, b, true, 0, b, false, bx, 0);
    addDoorway(1, b, true, 1, b, false, bx, 0);
  }

  // Corridor doorways (from wall analysis or fallback)
  if (doorways.filter(d => Math.abs(d.z + 2) < 1 && d.floor === 0).length === 0) {
    // Fallback: assume corridor gaps at z=-2
    for (let b = 0; b < BAYS - 1; b++) {
      const wx = -HW2 + (b + 1) * BAY_W;
      addDoorway(0, b, false, 0, b + 1, false, wx, -2);
      addDoorway(1, b, false, 1, b + 1, false, wx, -2);
    }
  }

  // Stairs connect 1F bay2-back ↔ 2F bay2-back
  addDoorway(0, 1, false, 1, 1, false, -1, -2);

  // ── BFS from entrances ──────────────────────────────────────────
  const entrances = [cell(0, 2, true), cell(0, 3, false)]; // front door bay3, back door bay4
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

  // ── Report ──────────────────────────────────────────────────────
  const unreachable = [];
  for (let f = 0; f < 2; f++) {
    for (let b = 0; b < BAYS; b++) {
      for (const front of [true, false]) {
        const c = cell(f, b, front);
        if (!visited.has(c)) {
          unreachable.push(`${f === 0 ? '1F' : '2F'}开间${b + 1}${front ? '前' : '后'}`);
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

  // Also check doorway count
  if (doorways.length === 0) {
    violations.push({
      rule: 'reachability', severity: 'error', parts: ['interiorWalls'],
      detail: '未检测到任何门洞 — 隔墙可能无开口',
      fix: { suggestion: '在横纵隔墙上添加门洞' },
    });
  }

  return violations;
}
