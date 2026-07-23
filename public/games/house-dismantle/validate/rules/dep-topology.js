/* Rule: Dependency Topology — detect counter-intuitive dependencies */
import { CATEGORIES } from '../../config.js';

// Physical construction levels (higher = upper floor / later to dismantle)
const LEVELS = {
  roofTiles: 3, roofFrame: 3,
  upperWallFront: 2, upperWallBack: 2, upperWallLeft: 2, upperWallRight: 2,
  floor2: 2,
  wallFront: 1, wallBack: 1, wallLeft: 1, wallRight: 1,
  interiorWall1: 1, interiorWall2: 1, crossWall: 1,
  columns: 1, floor: 1,
  doors: 1, windows: 1, stairs: 1, windScreen: 1,
  beds: 1, tableChairs: 1, stove: 1, shrine: 1,
  base: 0, pipelines: 0,
  chickens: 0, well: 0,
};

// Category ordering: higher = later to remove / more structural
const CAT_ORDER = { roof: 5, structure: 4, openings: 3, interior: 2, base: 1, plumbing: 1, yard: 0 };

// Approximate line numbers for known problematic deps in config.js PART_DEFS
const DEP_LINES = {
  'stairs,upperWallFront': 102, 'stairs,upperWallBack': 102,
  'crossWall,upperWallFront': 89, 'crossWall,upperWallBack': 89,
  'crossWall,interiorWall1': 89, 'crossWall,interiorWall2': 89,
  'pipelines,base': 118,
};

export function checkDepTopology(PART_DEFS) {
  const violations = [];

  for (const part of PART_DEFS) {
    const partLevel = LEVELS[part.name] ?? 1;
    const partCatOrder = CAT_ORDER[part.cat] ?? 2;

    for (const depName of part.deps) {
      const depLevel = LEVELS[depName] ?? 1;
      const dep = PART_DEFS.find(d => d.name === depName);
      const depCatOrder = dep ? (CAT_ORDER[dep.cat] ?? 2) : 2;

      // Upward dependency: lower-level part depends on higher-level (> 1 level gap)
      if (depLevel > partLevel + 1) {
        violations.push({
          rule: 'dep-topology',
          severity: 'error',
          parts: [part.name, depName],
          detail: `${part.label} (L${partLevel}) 依赖 ${dep?.label || depName} (L${depLevel}) — 下层不应依赖上层结构`,
          metrics: { partLevel, depLevel },
          fix: {
            file: 'config.js',
            line: DEP_LINES[`${part.name},${depName}`] || null,
            suggestion: `移除 ${part.name} 对 ${depName} 的依赖`,
          },
        });
      }

      // Mild upward: 1 level gap is a warning
      if (depLevel === partLevel + 1) {
        violations.push({
          rule: 'dep-topology',
          severity: 'warning',
          parts: [part.name, depName],
          detail: `${part.label} (L${partLevel}) 依赖 ${dep?.label || depName} (L${depLevel}) — 跨层依赖需确认合理性`,
          metrics: { partLevel, depLevel },
          fix: {
            file: 'config.js',
            line: DEP_LINES[`${part.name},${depName}`] || null,
            suggestion: `考虑 ${part.name} 是否真的需要先拆除 ${depName}`,
          },
        });
      }

      // Structure depends on furniture — physically wrong
      if (partCatOrder >= 4 && depCatOrder <= 2 && depCatOrder > 0) {
        violations.push({
          rule: 'dep-topology',
          severity: 'warning',
          parts: [part.name, depName],
          detail: `${part.label} (${part.cat}) 依赖 ${dep?.label || depName} (${dep?.cat}) — 结构不应依赖软装`,
          metrics: { partCat: partCatOrder, depCat: depCatOrder },
          fix: {
            file: 'config.js',
            suggestion: `移除 ${part.name} → ${depName}，家具应在结构之后安装、之前拆除`,
          },
        });
      }
    }
  }

  return violations;
}
