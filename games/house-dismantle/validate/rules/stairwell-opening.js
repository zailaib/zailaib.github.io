/* Rule: Stairwell Opening  stairs must be within the 2F floor opening */
import { getWorldAABB } from '../helpers.js';

const MARGIN = 0.1; // meter  allow stairs to extend slightly past opening edge

export function checkStairwellOpening(parts) {
  const violations = [];
  const floor2 = parts.get('floor2');
  const stairs = parts.get('stairs');
  if (!floor2 || !stairs) return violations;

  const opening = floor2.stairwellOpening;
  if (!opening) {
    violations.push({
      rule: 'stairwell-opening',
      severity: 'warning',
      parts: ['floor2'],
      detail: 'floor2 未导出 stairwellOpening 边界  无法验证楼梯是否在洞口内',
      fix: { file: 'floor2/floor.js', suggestion: '添加 pFloor2.stairwellOpening = { xMin, xMax, zMin, zMax, yFloor }' },
    });
    return violations;
  }

  for (let i = 0; i < stairs.meshArr.length; i++) {
    const box = getWorldAABB(stairs.meshArr[i]);
    const vol = (box.max.x - box.min.x) * (box.max.y - box.min.y) * (box.max.z - box.min.z);
    if (vol < 0.001) continue; // skip tiny details

    const outX = box.min.x < opening.xMin - MARGIN || box.max.x > opening.xMax + MARGIN;
    const outZ = box.min.z < opening.zMin - MARGIN || box.max.z > opening.zMax + MARGIN;

    if (outX || outZ) {
      const issues = [];
      if (box.min.x < opening.xMin - MARGIN) issues.push(`左边缘 x=${box.min.x.toFixed(2)} < 洞口 xMin=${opening.xMin}`);
      if (box.max.x > opening.xMax + MARGIN) issues.push(`右边缘 x=${box.max.x.toFixed(2)} > 洞口 xMax=${opening.xMax}`);
      if (box.min.z < opening.zMin - MARGIN) issues.push(`后边缘 z=${box.min.z.toFixed(2)} < 洞口 zMin=${opening.zMin.toFixed(1)}`);
      if (box.max.z > opening.zMax + MARGIN) issues.push(`前边缘 z=${box.max.z.toFixed(2)} > 洞口 zMax=${opening.zMax}`);

      violations.push({
        rule: 'stairwell-opening',
        severity: 'error',
        parts: ['stairs', 'floor2'],
        detail: `楼梯 mesh#${i} 超出二楼洞口: ${issues.join('；')}`,
        metrics: { meshIdx: i, stairXMin: +box.min.x.toFixed(2), stairXMax: +box.max.x.toFixed(2), stairZMin: +box.min.z.toFixed(2), stairZMax: +box.max.z.toFixed(2) },
        fix: { file: 'floor1/openings.js', suggestion: '调整楼梯位置或 stepD/stepCount，使其完全位于洞口内' },
      });
    }
  }

  return violations;
}
