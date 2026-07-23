/* Rule: Column Placement — columns should be at wall intersections */
import * as THREE from 'three';
import { HW2, HD2, BAY_W } from '../../config.js';

const CORNER_THRESHOLD = 0.3;  // meter — column within this of BOTH axes is at a corner
const WANDER_THRESHOLD = 0.8;  // meter — beyond this from an axis, the column floats

export function checkColumnPlacement(parts) {
  const violations = [];
  const colsPart = parts.get('columns');
  if (!colsPart) return violations;

  // Known wall planes
  const xWallPlanes = [-HW2, HW2, -BAY_W / 2, BAY_W / 2]; // left, right, intL, intR
  const zWallPlanes = [HD2, -HD2, 1.0];                   // front, back, crossWall

  for (const mesh of colsPart.meshArr) {
    if (mesh.geometry?.type !== 'CylinderGeometry') continue;
    mesh.updateWorldMatrix(true, false);
    const pos = new THREE.Vector3();
    mesh.getWorldPosition(pos);

    const minXDist = Math.min(...xWallPlanes.map(wx => Math.abs(pos.x - wx)));
    const minZDist = Math.min(...zWallPlanes.map(wz => Math.abs(pos.z - wz)));

    const nearX = minXDist <= CORNER_THRESHOLD;
    const nearZ = minZDist <= CORNER_THRESHOLD;

    if (nearX && nearZ) continue; // corner column — perfectly placed

    const farX = minXDist > WANDER_THRESHOLD;
    const farZ = minZDist > WANDER_THRESHOLD;

    if (farX && farZ) {
      // Floating — far from any wall in both axes
      violations.push({
        rule: 'column-placement',
        severity: 'error',
        parts: ['columns'],
        detail: `柱子 (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)}) 距 X 墙面 ${minXDist.toFixed(1)}m、Z 墙面 ${minZDist.toFixed(1)}m — 悬浮在房间中央`,
        metrics: { distToXWall: Math.round(minXDist * 100) / 100, distToZWall: Math.round(minZDist * 100) / 100 },
        fix: {
          file: 'house-core.js',
          line: 66,
          suggestion: `将柱子移到最近的墙面交叉点 (x≈${xWallPlanes.reduce((a, b) => Math.abs(pos.x - a) < Math.abs(pos.x - b) ? a : b)}, z≈${zWallPlanes.reduce((a, b) => Math.abs(pos.z - a) < Math.abs(pos.z - b) ? a : b)})`,
        },
      });
    } else if (farX || farZ) {
      // On one wall but not at an intersection
      const farAxis = farX ? 'Z' : 'X';
      const farDist = farX ? minXDist : minZDist;
      violations.push({
        rule: 'column-placement',
        severity: 'warning',
        parts: ['columns'],
        detail: `柱子 (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)}) 贴近一面墙但距垂直墙面 ${farDist.toFixed(1)}m — 不在墙交点`,
        metrics: { distToXWall: Math.round(minXDist * 100) / 100, distToZWall: Math.round(minZDist * 100) / 100 },
        fix: {
          file: 'house-core.js',
          line: 66,
          suggestion: `将柱子沿 ${farAxis} 轴移动到最近的墙面（${farAxis === 'X' ? xWallPlanes.reduce((a, b) => Math.abs(pos.x - a) < Math.abs(pos.x - b) ? a : b) : zWallPlanes.reduce((a, b) => Math.abs(pos.z - a) < Math.abs(pos.z - b) ? a : b)}）`,
        },
      });
    }
  }

  return violations;
}
