/* Rule: Column Placement — columns should be at wall intersections (4-bay) */
import * as THREE from 'three';
import { HW2, HD2, BAY_W, BAY_COUNT } from '../../config.js';

const CORNER_THRESHOLD = 0.3;
const WANDER_THRESHOLD = 0.8;

export function checkColumnPlacement(parts) {
  const violations = [];
  const colsPart = parts.get('columns');
  if (!colsPart) return violations;

  // Wall planes for 4-bay layout
  const xWallPlanes = [];
  for (let i = 1; i < BAY_COUNT; i++) {
    xWallPlanes.push(-HW2 + i * BAY_W); // -4, 0, 4
  }
  const zWallPlanes = [HD2, -HD2, 0]; // front, back, crossWall

  for (const mesh of colsPart.meshArr) {
    if (mesh.geometry?.type !== 'CylinderGeometry') continue;
    mesh.updateWorldMatrix(true, false);
    const pos = new THREE.Vector3();
    mesh.getWorldPosition(pos);

    const minXDist = Math.min(...xWallPlanes.map(wx => Math.abs(pos.x - wx)));
    const minZDist = Math.min(...zWallPlanes.map(wz => Math.abs(pos.z - wz)));

    const nearX = minXDist <= CORNER_THRESHOLD;
    const nearZ = minZDist <= CORNER_THRESHOLD;
    if (nearX && nearZ) continue;

    const farX = minXDist > WANDER_THRESHOLD;
    const farZ = minZDist > WANDER_THRESHOLD;

    if (farX && farZ) {
      violations.push({
        rule: 'column-placement',
        severity: 'error',
        parts: ['columns'],
        detail: `柱子 (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)}) 距最近X墙面 ${minXDist.toFixed(1)}m、Z墙面 ${minZDist.toFixed(1)}m — 悬浮`,
        metrics: { distToXWall: +minXDist.toFixed(2), distToZWall: +minZDist.toFixed(2) },
        fix: { file: 'house-core.js', line: 66, suggestion: '将柱子移到最近的墙面交叉点' },
      });
    } else if (farX || farZ) {
      violations.push({
        rule: 'column-placement',
        severity: 'warning',
        parts: ['columns'],
        detail: `柱子 (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)}) 贴近一面墙但距垂直墙面 ${Math.max(minXDist, minZDist).toFixed(1)}m`,
        metrics: { distToXWall: +minXDist.toFixed(2), distToZWall: +minZDist.toFixed(2) },
        fix: { file: 'house-core.js', line: 66, suggestion: '将柱子移到最近的墙面交叉点' },
      });
    }
  }
  return violations;
}
