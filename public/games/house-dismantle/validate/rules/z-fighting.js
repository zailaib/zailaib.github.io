/* Rule: Z-Fighting — detect co-planar overlapping meshes within the same part */
import { getWorldAABB } from '../helpers.js';

const DEPTH_EPSILON = 0.005;  // meter — positions within this are co-planar
const OVERLAP_MIN = 0.5;      // 50% area overlap triggers violation
const MIN_VOLUME = 0.001;     // m³ — skip meshes smaller than this (decorative details)
const PERPENDICULAR_SEP = 0.05; // meter — if separated > this in perpendicular axis, skip (false positive)

export function checkZFighting(parts) {
  const violations = [];

  for (const [name, p] of parts) {
    const meshes = p.meshArr;
    if (meshes.length < 2) continue;

    const reportedPairs = new Set();

    for (let i = 0; i < meshes.length; i++) {
      for (let j = i + 1; j < meshes.length; j++) {
        const boxA = getWorldAABB(meshes[i]);
        const boxB = getWorldAABB(meshes[j]);

        // Skip tiny decorative details (stone grooves, chicken combs, etc.)
        const volA = (boxA.max.x - boxA.min.x) * (boxA.max.y - boxA.min.y) * (boxA.max.z - boxA.min.z);
        const volB = (boxB.max.x - boxB.min.x) * (boxB.max.y - boxB.min.y) * (boxB.max.z - boxB.min.z);
        if (volA < MIN_VOLUME || volB < MIN_VOLUME) continue;

        const cxA = (boxA.min.x + boxA.max.x) / 2;
        const cyA = (boxA.min.y + boxA.max.y) / 2;
        const czA = (boxA.min.z + boxA.max.z) / 2;
        const cxB = (boxB.min.x + boxB.max.x) / 2;
        const cyB = (boxB.min.y + boxB.max.y) / 2;
        const czB = (boxB.min.z + boxB.max.z) / 2;

        const dx = Math.abs(cxA - cxB);
        const dy = Math.abs(cyA - cyB);
        const dz = Math.abs(czA - czB);

        // Check each axis for co-planarity + perpendicular overlap
        let overlapArea = 0;
        let depthAxis = '';

        // For two meshes to z-fight, they must be:
        // (a) co-planar in one axis (|dc|<epsilon), AND
        // (b) NOT well-separated in the perpendicular plane
        if (dz < DEPTH_EPSILON) {
          depthAxis = 'z';
          const ox = Math.max(0, Math.min(boxA.max.x, boxB.max.x) - Math.max(boxA.min.x, boxB.min.x));
          const oy = Math.max(0, Math.min(boxA.max.y, boxB.max.y) - Math.max(boxA.min.y, boxB.min.y));
          const aA = (boxA.max.x - boxA.min.x) * (boxA.max.y - boxA.min.y);
          const aB = (boxB.max.x - boxB.min.x) * (boxB.max.y - boxB.min.y);
          overlapArea = (ox * oy) / Math.min(aA, aB);
          // Skip if well-separated in X or Y (not real z-fighting)
          if (dx > PERPENDICULAR_SEP || dy > PERPENDICULAR_SEP) overlapArea = 0;
        } else if (dx < DEPTH_EPSILON) {
          depthAxis = 'x';
          const oy = Math.max(0, Math.min(boxA.max.y, boxB.max.y) - Math.max(boxA.min.y, boxB.min.y));
          const oz = Math.max(0, Math.min(boxA.max.z, boxB.max.z) - Math.max(boxA.min.z, boxB.min.z));
          const aA = (boxA.max.y - boxA.min.y) * (boxA.max.z - boxA.min.z);
          const aB = (boxB.max.y - boxB.min.y) * (boxB.max.z - boxB.min.z);
          overlapArea = (oy * oz) / Math.min(aA, aB);
          // Skip if well-separated in Y or Z (e.g. grooves on base surface)
          if (dy > PERPENDICULAR_SEP || dz > PERPENDICULAR_SEP) overlapArea = 0;
        } else if (dy < DEPTH_EPSILON) {
          depthAxis = 'y';
          const ox = Math.max(0, Math.min(boxA.max.x, boxB.max.x) - Math.max(boxA.min.x, boxB.min.x));
          const oz = Math.max(0, Math.min(boxA.max.z, boxB.max.z) - Math.max(boxA.min.z, boxB.min.z));
          const aA = (boxA.max.x - boxA.min.x) * (boxA.max.z - boxA.min.z);
          const aB = (boxB.max.x - boxB.min.x) * (boxB.max.z - boxB.min.z);
          overlapArea = (ox * oz) / Math.min(aA, aB);
          // Skip if well-separated in X or Z
          if (dx > PERPENDICULAR_SEP || dz > PERPENDICULAR_SEP) overlapArea = 0;
        }

        if (overlapArea > OVERLAP_MIN) {
          const pairKey = `${Math.min(i, j)},${Math.max(i, j)}`;
          if (reportedPairs.has(pairKey)) continue;
          reportedPairs.add(pairKey);

          violations.push({
            rule: 'z-fighting',
            severity: 'error',
            parts: [name],
            detail: `${name} 内 mesh#${i} 与 mesh#${j} 在 ${depthAxis} 轴共面重叠 ${(overlapArea * 100).toFixed(0)}% — Z-fighting`,
            metrics: {
              overlapArea: Math.round(overlapArea * 100) / 100,
              depthDiff: Math.round(dz * 1000) / 1000,
            },
            fix: {
              file: '待定位',
              suggestion: `将重叠 mesh 沿 ${depthAxis} 轴偏移 ±0.01m`,
            },
          });
        }
      }
    }
  }

  return violations;
}
