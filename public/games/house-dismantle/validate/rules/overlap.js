/* Rule: Overlap — detect unintended mesh intersections between different parts */
import { getWorldAABB, volumeRatio } from '../helpers.js';

// Host-guest whitelist: [guestPart, hostPart] — guest meshes may sit inside host
const GUEST_HOST = [
  ['doors', 'wallFront'],
  ['doors', 'wallBack'],
  ['windows', 'wallFront'],
  ['windows', 'wallBack'],
  ['windScreen', 'wallBack'],
  ['beds', 'wallRight'],
  ['beds', 'interiorWall2'],
  ['tableChairs', 'wallFront'],
  ['tableChairs', 'wallBack'],
  ['tableChairs', 'interiorWall1'],
  ['tableChairs', 'interiorWall2'],
  ['stove', 'wallLeft'],
  ['stove', 'interiorWall1'],
  ['shrine', 'wallBack'],
];

function isHostGuest(partA, partB) {
  return GUEST_HOST.some(([g, h]) =>
    (g === partA && h === partB) || (g === partB && h === partA),
  );
}

export function checkOverlap(parts) {
  const violations = [];

  // Collect all meshes with world AABBs
  const allMeshes = [];
  for (const [name, p] of parts) {
    for (const mesh of p.meshArr) {
      const box = getWorldAABB(mesh);
      const vol = (box.max.x - box.min.x) * (box.max.y - box.min.y) * (box.max.z - box.min.z);
      if (vol > 0.001) {
        allMeshes.push({ partName: name, mesh, box, volume: vol });
      }
    }
  }

  const reported = new Set();

  for (let i = 0; i < allMeshes.length; i++) {
    for (let j = i + 1; j < allMeshes.length; j++) {
      const a = allMeshes[i];
      const b = allMeshes[j];
      if (a.partName === b.partName) continue;
      if (isHostGuest(a.partName, b.partName)) continue;

      const ratio = volumeRatio(a.box, b.box);
      if (ratio > 0.05) {
        const key = [a.partName, b.partName].sort().join('|');
        if (reported.has(key)) continue;
        reported.add(key);

        violations.push({
          rule: 'overlap',
          severity: 'error',
          parts: [a.partName, b.partName],
          detail: `${a.partName} 与 ${b.partName} 空间重叠 ${(ratio * 100).toFixed(0)}%`,
          metrics: { overlapRatio: Math.round(ratio * 100) / 100 },
          fix: {
            file: 'house-openings.js',
            suggestion: `${a.partName} 与 ${b.partName} 位置冲突 — 调整其一坐标偏移`,
          },
        });
      }
    }
  }

  return violations;
}
