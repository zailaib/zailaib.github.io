/* Rule: Overlap — detect unintended mesh intersections between different parts */
import { getWorldAABB, volumeRatio } from '../helpers.js';

// Universal hosts: structural platforms that everything naturally touches
const UNIVERSAL_HOSTS = new Set(['floor', 'floor2', 'base']);

// Specific overlap whitelist: [partA, partB] — these pairs intentionally overlap
const ALLOWED_OVERLAPS = [
  // Wall stacking — lower wall tops meet upper wall bottoms at the band
  ['wallFront', 'upperWallFront'],
  ['wallBack', 'upperWallBack'],
  ['wallLeft', 'upperWallLeft'],
  ['wallRight', 'upperWallRight'],
  // Roof frame sits inside roof tiles
  ['roofFrame', 'roofTiles'],
  // Interior walls sit on floor and touch exterior walls
  ['interiorWall1', 'wallFront'],
  ['interiorWall1', 'wallBack'],
  ['interiorWall2', 'wallFront'],
  ['interiorWall2', 'wallBack'],
  ['crossWall', 'wallLeft'],
  ['crossWall', 'wallRight'],
  // Doors/windows are embedded in walls (frame sits in wall opening)
  ['doors', 'wallFront'],
  ['doors', 'wallBack'],
  ['windows', 'wallFront'],
  ['windows', 'wallBack'],
  // Furniture against walls — intentional proximity
  ['beds', 'wallRight'],
  ['beds', 'interiorWall2'],
  ['tableChairs', 'interiorWall1'],
  ['tableChairs', 'interiorWall2'],
  ['stove', 'wallLeft'],
  ['stove', 'interiorWall1'],
  ['shrine', 'wallBack'],
  ['windScreen', 'wallBack'],
  // Gable walls (left/right) naturally penetrate roof — that's how gable roofs work
  ['upperWallLeft', 'roofTiles'],
  ['upperWallRight', 'roofTiles'],
  // Stairs run along back wall — intentional
  ['stairs', 'wallBack'],
  // Stairs go through floor2 opening
  ['stairs', 'floor2'],
  // Columns pass through floor platform
  ['columns', 'floor'],
  // Pipelines around base
  ['pipelines', 'base'],
  // Upper walls sit on floor2
  ['upperWallFront', 'floor2'],
  ['upperWallBack', 'floor2'],
  ['upperWallLeft', 'floor2'],
  ['upperWallRight', 'floor2'],
];
  // Columns pass through floor platform
  ['columns', 'floor'],
  // Pipelines around base
  ['pipelines', 'base'],
  // Upper walls sit on floor2
  ['upperWallFront', 'floor2'],
  ['upperWallBack', 'floor2'],
  ['upperWallLeft', 'floor2'],
  ['upperWallRight', 'floor2'],
];

function isAllowedOverlap(partA, partB) {
  // Universal hosts overlap with everything (they're ground/platform)
  if (UNIVERSAL_HOSTS.has(partA) || UNIVERSAL_HOSTS.has(partB)) return true;
  // Check specific whitelist
  return ALLOWED_OVERLAPS.some(([a, b]) =>
    (a === partA && b === partB) || (a === partB && b === partA),
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
      if (isAllowedOverlap(a.partName, b.partName)) continue;

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
