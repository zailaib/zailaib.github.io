/* Rule: Column Placement — columns should be at wall intersections (V2 unequal bays) */
import * as THREE from 'three';
import { HW2, HD2, BAY_X, CROSS_Z_FRONT, CROSS_Z_BACK } from '../../config.js';

const CORNER_THRESHOLD = 0.3;
const WANDER_THRESHOLD = 1.2; // V2: wider bays, allow more tolerance for unequal spacing

export function checkColumnPlacement(parts) {
  const violations = [];
  const colsPart = parts.get('columns');
  if (!colsPart) return violations;

  // Wall planes for V2 unequal-bay layout
  // X: all structural wall planes — exterior side walls + interior longitudinal walls
  // BAY_X = [-8, -5, -0.5, 4.5, 8] → all 5 lines
  const xWallPlanes = [...BAY_X];

  // Z: front/back exterior walls + both corridor cross walls
  const zWallPlanes = [HD2, CROSS_Z_FRONT, CROSS_Z_BACK, -HD2];

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
        detail: `柱子 (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)}) 距最近X梁 ${minXDist.toFixed(1)}m、Z梁 ${minZDist.toFixed(1)}m — 悬浮`,
        metrics: { distToXWall: +minXDist.toFixed(2), distToZWall: +minZDist.toFixed(2) },
        fix: { file: 'base/index.js', suggestion: '将柱子移到梁的交叉点' },
      });
    } else if (farX || farZ) {
      violations.push({
        rule: 'column-placement',
        severity: 'warning',
        parts: ['columns'],
        detail: `柱子 (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)}) 贴近一面梁但距垂直梁 ${Math.max(minXDist, minZDist).toFixed(1)}m`,
        metrics: { distToXWall: +minXDist.toFixed(2), distToZWall: +minZDist.toFixed(2) },
        fix: { file: 'base/index.js', suggestion: '将柱子移到梁的交叉点' },
      });
    }
  }
  return violations;
}
