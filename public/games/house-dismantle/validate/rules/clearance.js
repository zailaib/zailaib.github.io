/* Rule: Clearance — minimum passage width in interior walls (4-bay) */
import { getWorldAABB } from '../helpers.js';
import { BAY_W } from '../../config.js';

const MIN_PASSAGE = 0.7;  // minimum doorway width in meters
const MIN_COMFORT = 0.9;

export function checkClearance(parts) {
  const violations = [];
  const iwPart = parts.get('interiorWalls');
  if (!iwPart) return violations;

  // Interior cross wall segments (front-back divider at z=0)
  // These are the segments between bays with doorways
  const segments = [];
  for (const mesh of iwPart.meshArr) {
    const box = getWorldAABB(mesh);
    const sx = box.max.x - box.min.x;
    const sy = box.max.y - box.min.y;
    const sz = box.max.z - box.min.z;
    // Cross wall segments: wide in X, tall in Y, thin in Z
    if (sx > 1 && sy > 1 && sz < 0.5) {
      segments.push({ mesh, box, centerX: (box.min.x + box.max.x) / 2 });
    }
  }

  segments.sort((a, b) => a.centerX - b.centerX);

  if (segments.length >= 2) {
    let minGap = Infinity;
    for (let i = 0; i < segments.length - 1; i++) {
      const gap = segments[i + 1].box.min.x - segments[i].box.max.x;
      if (gap > 0 && gap < minGap) minGap = gap;
    }

    if (minGap < MIN_COMFORT && minGap > 0.01) {
      const sev = minGap < MIN_PASSAGE ? 'error' : 'warning';
      violations.push({
        rule: 'clearance',
        severity: sev,
        parts: ['interiorWalls'],
        detail: `内隔墙段间门洞宽 ${(minGap * 100).toFixed(0)}cm < ${(MIN_PASSAGE * 100).toFixed(0)}cm`,
        metrics: { gap: +minGap.toFixed(2), minRequired: MIN_PASSAGE },
        fix: { file: 'house-core.js', suggestion: `门洞至少 ${MIN_PASSAGE}m 宽` },
      });
    }
  }

  return violations;
}
