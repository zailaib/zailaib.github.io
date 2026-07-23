/* Rule: Column Placement — columns should be near wall planes */
import * as THREE from 'three';
import { HW2, HD2, BAY_W } from '../../config.js';

const MAX_DIST_TO_WALL = 1.5; // meter — column further than this from any wall is suspect

export function checkColumnPlacement(parts) {
  const violations = [];
  const colsPart = parts.get('columns');
  if (!colsPart) return violations;

  // Known wall planes
  const xWallPlanes = [-HW2, HW2, -BAY_W / 2, BAY_W / 2];
  const zWallPlanes = [HD2, -HD2, 1.0]; // front, back, crossWall

  for (const mesh of colsPart.meshArr) {
    if (mesh.geometry?.type !== 'CylinderGeometry') continue;
    mesh.updateWorldMatrix(true, false);
    const pos = new THREE.Vector3();
    mesh.getWorldPosition(pos);

    const minXDist = Math.min(...xWallPlanes.map(wx => Math.abs(pos.x - wx)));
    const minZDist = Math.min(...zWallPlanes.map(wz => Math.abs(pos.z - wz)));
    const minDist = Math.min(minXDist, minZDist);

    if (minDist > MAX_DIST_TO_WALL) {
      // Find nearest wall plane for suggestion
      const allPlanes = [
        ...xWallPlanes.map(wx => ({ axis: 'x', pos: wx, dist: Math.abs(pos.x - wx) })),
        ...zWallPlanes.map(wz => ({ axis: 'z', pos: wz, dist: Math.abs(pos.z - wz) })),
      ];
      allPlanes.sort((a, b) => a.dist - b.dist);
      const nearest = allPlanes[0];

      violations.push({
        rule: 'column-placement',
        severity: 'warning',
        parts: ['columns'],
        detail: `柱子 (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)}) 距最近墙面 ${minDist.toFixed(1)}m > ${MAX_DIST_TO_WALL}m`,
        metrics: { distanceToNearestWall: Math.round(minDist * 100) / 100, maxAllowed: MAX_DIST_TO_WALL },
        fix: {
          file: 'house-core.js',
          line: 66,
          suggestion: `将柱子移近 ${nearest.axis}=${nearest.pos.toFixed(1)} 的墙面（当前距离 ${nearest.dist.toFixed(1)}m）`,
        },
      });
    }
  }

  return violations;
}
