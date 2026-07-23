/* Rule: Clearance — minimum passage width between wall segments */
import { getWorldAABB } from '../helpers.js';
import { BAY_W, WALL_T } from '../../config.js';

const MIN_PASSAGE = 0.6;  // minimum doorway/passage width in meters
const MIN_COMFORT = 0.9;

export function checkClearance(parts) {
  const violations = [];
  const cwPart = parts.get('crossWall');
  if (!cwPart) return violations;

  // Collect large wall segment AABBs (wider than tall → wall segments)
  const segments = [];
  for (const mesh of cwPart.meshArr) {
    const box = getWorldAABB(mesh);
    const sx = box.max.x - box.min.x;
    const sy = box.max.y - box.min.y;
    const sz = box.max.z - box.min.z;
    // crossWall segments: wide in X, tall in Y, thin in Z
    if (sx > 1 && sy > 1 && sz < 0.5) {
      segments.push({ mesh, box, centerX: (box.min.x + box.max.x) / 2 });
    }
  }

  // Sort by X and find gaps
  segments.sort((a, b) => a.centerX - b.centerX);

  if (segments.length >= 2) {
    // Find the minimum gap between adjacent segments
    let minGap = Infinity;
    for (let i = 0; i < segments.length - 1; i++) {
      const gap = segments[i + 1].box.min.x - segments[i].box.max.x;
      if (gap < minGap) minGap = gap;
    }

    if (minGap < MIN_COMFORT) {
      const sev = minGap < MIN_PASSAGE ? 'error' : 'warning';
      violations.push({
        rule: 'clearance',
        severity: sev,
        parts: ['crossWall'],
        detail: `前后隔墙段间门洞宽 ${(minGap * 100).toFixed(0)}cm < ${(MIN_PASSAGE * 100).toFixed(0)}cm 最小通过宽度`,
        metrics: { gap: Math.round(minGap * 100) / 100, minRequired: MIN_PASSAGE },
        fix: {
          file: 'house-core.js',
          line: 111,
          suggestion: `segW 从 BAY_W - WALL_T*0.4 ≈ ${(BAY_W - WALL_T * 0.4).toFixed(2)}m 减小到约 ${(BAY_W - MIN_COMFORT).toFixed(1)}m，使门洞 ≥ ${MIN_COMFORT}m`,
        },
      });
    }
  }

  return violations;
}
