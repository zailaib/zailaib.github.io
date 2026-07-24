/* Rule: Clearance  minimum passage width in V2 dual cross walls */
import { getWorldAABB } from '../helpers.js';
import { BAY_WIDTHS } from '../../config.js';

const MIN_PASSAGE = 0.7;  // minimum doorway width in meters
const MIN_COMFORT = 0.9;

export function checkClearance(parts) {
  const violations = [];
  const iwPart = parts.get('interiorWalls');
  if (!iwPart) return violations;

  // Collect cross wall segments (wide in X, tall in Y, thin in Z)
  // V2 has TWO cross walls at different Z levels: separate them
  const allSegments = [];
  for (const mesh of iwPart.meshArr) {
    const box = getWorldAABB(mesh);
    const sx = box.max.x - box.min.x;
    const sy = box.max.y - box.min.y;
    const sz = box.max.z - box.min.z;
    if (sx > 1 && sy > 1 && sz < 0.5) {
      const cz = (box.min.z + box.max.z) / 2;
      allSegments.push({ mesh, box, centerX: (box.min.x + box.max.x) / 2, centerZ: cz });
    }
  }

  if (allSegments.length < 2) return violations;

  // Group by Z level (cross walls are at distinct Z positions)
  const zGroups = new Map();
  for (const seg of allSegments) {
    // Round to nearest 0.5m to group co-planar segments
    const zKey = Math.round(seg.centerZ * 2) / 2;
    if (!zGroups.has(zKey)) zGroups.set(zKey, []);
    zGroups.get(zKey).push(seg);
  }

  // Check each z-group independently
  for (const [zKey, group] of zGroups) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.centerX - b.centerX);

    let minGap = Infinity;
    for (let i = 0; i < group.length - 1; i++) {
      const gap = group[i + 1].box.min.x - group[i].box.max.x;
      if (gap > 0 && gap < minGap) minGap = gap;
    }

    if (minGap < MIN_COMFORT && minGap > 0.01) {
      const sev = minGap < MIN_PASSAGE ? 'error' : 'warning';
      violations.push({
        rule: 'clearance',
        severity: sev,
        parts: ['interiorWalls'],
        detail: `交叉墙 z≈${zKey.toFixed(1)} 段间门洞宽 ${(minGap * 100).toFixed(0)}cm < ${(MIN_PASSAGE * 100).toFixed(0)}cm`,
        metrics: { gap: +minGap.toFixed(2), minRequired: MIN_PASSAGE, zLevel: zKey },
        fix: { file: 'floor1/walls.js', suggestion: `门洞至少 ${MIN_PASSAGE}m 宽` },
      });
    }
  }

  return violations;
}
