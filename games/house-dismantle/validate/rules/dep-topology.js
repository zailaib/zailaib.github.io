/* Rule: Dependency Topology  4-bay 2-story house */
const LEVELS = {
  roofTiles: 4, roofFrame: 4,
  upperWallFront: 3, upperWallBack: 3, upperWallLeft: 3, upperWallRight: 3,
  floor2: 3,
  wallFront: 2, wallBack: 2, wallLeft: 2, wallRight: 2,
  interiorWalls: 2, columns: 2, floor: 2,
  doors1F: 1, doors2F: 1, windows1F: 1, windows2F: 1, stairs: 1,
  elderRoom1: 0, elderRoom2: 0, livingRoom: 0, kitchen: 0, diningRoom: 0, shrine: 0,
  masterBed: 0, secondBed: 0, study: 0, childRoom1: 0, childRoom2: 0,
  base: -1, ventDucts: -1, pipelines: -1,
  chickens: -2, well: -2,
};

export function checkDepTopology(PART_DEFS) {
  const violations = [];

  for (const part of PART_DEFS) {
    const partLevel = LEVELS[part.name] ?? 1;

    for (const depName of part.deps) {
      const depLevel = LEVELS[depName] ?? 1;
      const dep = PART_DEFS.find(d => d.name === depName);

      // Upward dependency: > 1 level gap
      if (depLevel > partLevel + 1) {
        violations.push({
          rule: 'dep-topology',
          severity: 'error',
          parts: [part.name, depName],
          detail: `${part.label} (L${partLevel}) 依赖 ${dep?.label || depName} (L${depLevel})  下层不应依赖上层`,
          metrics: { partLevel, depLevel },
          fix: { file: 'config.js', suggestion: `移除 ${part.name} → ${depName} 依赖` },
        });
      }

      // 1-level gap is warning
      if (depLevel === partLevel + 1) {
        violations.push({
          rule: 'dep-topology',
          severity: 'warning',
          parts: [part.name, depName],
          detail: `${part.label} (L${partLevel}) 依赖 ${dep?.label || depName} (L${depLevel})  跨层依赖需确认`,
          metrics: { partLevel, depLevel },
          fix: { file: 'config.js', suggestion: `确认 ${part.name} → ${depName} 是否合理` },
        });
      }
    }
  }

  return violations;
}
