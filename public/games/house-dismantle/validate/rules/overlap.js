/* Rule: Overlap — 4-bay house */
import { getWorldAABB, volumeRatio } from '../helpers.js';

const UNIVERSAL_HOSTS = new Set(['floor', 'floor2', 'base']);

const ALLOWED_OVERLAPS = [
  // Wall stacking
  ['wallFront', 'upperWallFront'], ['wallBack', 'upperWallBack'],
  ['wallLeft', 'upperWallLeft'], ['wallRight', 'upperWallRight'],
  // Roof frame inside tiles
  ['roofFrame', 'roofTiles'],
  // Doors/windows embedded in walls
  ['doors1F', 'wallFront'], ['doors1F', 'wallBack'],
  ['windows1F', 'wallFront'], ['windows1F', 'wallBack'],
  ['windows2F', 'upperWallFront'], ['windows2F', 'upperWallBack'],
  // Interior walls meet exterior walls
  ['interiorWalls', 'wallFront'], ['interiorWalls', 'wallBack'],
  ['interiorWalls', 'wallLeft'], ['interiorWalls', 'wallRight'],
  // Upper walls on floor2
  ['upperWallFront', 'floor2'], ['upperWallBack', 'floor2'],
  ['upperWallLeft', 'floor2'], ['upperWallRight', 'floor2'],
  // Columns pass through floors
  ['columns', 'floor'], ['columns', 'floor2'],
  // Stairs through floor2 opening
  ['stairs', 'floor2'], ['stairs', 'wallBack'],
  // Gable walls penetrate roof
  ['upperWallLeft', 'roofTiles'], ['upperWallRight', 'roofTiles'],
  // Pipelines around base
  ['pipelines', 'base'],
  // Furniture against walls
  ['elderRoom1', 'wallLeft'], ['elderRoom1', 'interiorWalls'],
  ['elderRoom2', 'interiorWalls'],
  ['livingRoom', 'interiorWalls'],
  ['kitchen', 'wallRight'], ['kitchen', 'interiorWalls'],
  ['diningRoom', 'wallLeft'], ['diningRoom', 'interiorWalls'],
  ['shrine', 'wallBack'],
  ['masterBed', 'upperWallLeft'], ['masterBed', 'interiorWalls'],
  ['secondBed', 'interiorWalls'],
  ['study', 'interiorWalls'],
  ['childRoom1', 'upperWallRight'], ['childRoom1', 'interiorWalls'],
  ['childRoom2', 'upperWallLeft'], ['childRoom2', 'interiorWalls'],
];

function isAllowed(partA, partB) {
  if (UNIVERSAL_HOSTS.has(partA) || UNIVERSAL_HOSTS.has(partB)) return true;
  return ALLOWED_OVERLAPS.some(([a, b]) => (a === partA && b === partB) || (a === partB && b === partA));
}

export function checkOverlap(parts) {
  const violations = [], all = [];
  for (const [name, p] of parts) {
    for (const mesh of p.meshArr) {
      const box = getWorldAABB(mesh);
      const vol = (box.max.x - box.min.x) * (box.max.y - box.min.y) * (box.max.z - box.min.z);
      if (vol > 0.001) all.push({ partName: name, box, volume: vol });
    }
  }
  const reported = new Set();
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j];
      if (a.partName === b.partName) continue;
      if (isAllowed(a.partName, b.partName)) continue;
      const ratio = volumeRatio(a.box, b.box);
      if (ratio > 0.05) {
        const key = [a.partName, b.partName].sort().join('|');
        if (reported.has(key)) continue; reported.add(key);
        violations.push({
          rule: 'overlap', severity: ratio > 0.3 ? 'error' : 'warning',
          parts: [a.partName, b.partName],
          detail: `${a.partName} 与 ${b.partName} 重叠 ${(ratio * 100).toFixed(0)}%`,
          metrics: { ratio: +ratio.toFixed(2) },
          fix: { file: '待定位', suggestion: `${a.partName} ↔ ${b.partName} 调整其一坐标` },
        });
      }
    }
  }
  return violations;
}
