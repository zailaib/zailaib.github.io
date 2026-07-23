/* Rule: Polygon Consistency — detect low-poly / high-poly mismatch */
const MAX_SEGMENT_RATIO = 3;

export function checkPolyConsistency(parts) {
  const violations = [];
  const entries = [];

  for (const [name, p] of parts) {
    for (let i = 0; i < p.meshArr.length; i++) {
      const geo = p.meshArr[i].geometry;
      if (!geo?.parameters) continue;
      const segs = geo.parameters.radialSegments;
      if (segs && segs > 0) {
        entries.push({ partName: name, meshIdx: i, segments: segs, type: geo.type });
      }
    }
  }

  if (entries.length < 2) return violations;

  const segs = entries.map(e => e.segments);
  const max = Math.max(...segs);
  const min = Math.min(...segs);
  const ratio = max / min;

  if (ratio > MAX_SEGMENT_RATIO) {
    const minEntries = entries.filter(e => e.segments === min);
    const maxEntries = entries.filter(e => e.segments === max);
    const minParts = [...new Set(minEntries.map(e => e.partName))];
    const maxParts = [...new Set(maxEntries.map(e => e.partName))];

    violations.push({
      rule: 'poly-consistency',
      severity: 'warning',
      parts: [...minParts, ...maxParts],
      detail: `几何精度不一致：最粗 ${min}段 (${minParts.join('、')}) vs 最细 ${max}段 (${maxParts.join('、')})，比值 ${ratio.toFixed(1)}x > ${MAX_SEGMENT_RATIO}x`,
      metrics: { minSegments: min, maxSegments: max, ratio: Math.round(ratio * 10) / 10 },
      fix: {
        file: minParts.map(p => p + '相关').join('、'),
        suggestion: `将 ${minParts.join('、')} 的分段数从 ${min} 提升到至少 ${Math.ceil(max / MAX_SEGMENT_RATIO)}，或统一 low-poly 风格`,
      },
    });
  }

  return violations;
}
