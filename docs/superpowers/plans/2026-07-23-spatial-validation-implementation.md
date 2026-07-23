# House Dismantle Spatial Validation Engine — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement task-by-task.

**Goal:** Build a CAD-like spatial constraint checker that validates the 3D house model and returns structured violations for AI-driven auto-fix.

**Architecture:** Each rule is a standalone function `check(parts, PART_DEFS) → Violation[]`. A `helpers.js` provides shared geometry utilities. `index.js` orchestrates all rules and returns aggregated results.

**Tech Stack:** Three.js 0.160 (browser), ES modules, JSDoc types.

## Global Constraints

- All files under `public/games/house-dismantle/validate/`
- No dependencies beyond Three.js and existing config.js
- Each rule imports helpers as needed
- Violations include `fix.file` and `fix.line` for AI traceability
- Console output via `console.table()` in dev mode

---

### Task 1: Create directory + helpers.js

**Files:**
- Create: `public/games/house-dismantle/validate/helpers.js`

**Interfaces:**
- Produces: `getWorldAABB(mesh)`, `getGeometryParams(mesh)`, `intersectVolume(boxA, boxB)`, `volumeRatio(boxA, boxB)`

- [ ] **Step 1: Write helpers.js**

```js
/* House Dismantle — Validation Helpers */
import * as THREE from 'three';

/** Compute world-space AABB for a single mesh */
export function getWorldAABB(mesh) {
  if (!mesh.geometry) return new THREE.Box3();
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox.clone();
  mesh.updateWorldMatrix(true, false);
  box.applyMatrix4(mesh.matrixWorld);
  return box;
}

/** Extract geometry detail info for poly-consistency check */
export function getGeometryParams(mesh) {
  const geo = mesh.geometry;
  if (!geo) return null;
  const params = { type: geo.type, radialSegments: null };
  if (geo.parameters?.radialSegments) {
    params.radialSegments = geo.parameters.radialSegments;
  } else if (geo.type === 'CylinderGeometry') {
    // Three.js 0.160 stores segments differently; try parameters
    params.radialSegments = geo.parameters?.radialSegments ?? 32;
  }
  return params;
}

/** Compute intersection volume of two AABBs. Returns 0 if disjoint. */
export function intersectVolume(boxA, boxB) {
  const ix = Math.max(0, Math.min(boxA.max.x, boxB.max.x) - Math.max(boxA.min.x, boxB.min.x));
  const iy = Math.max(0, Math.min(boxA.max.y, boxB.max.y) - Math.max(boxA.min.y, boxB.min.y));
  const iz = Math.max(0, Math.min(boxA.max.z, boxB.max.z) - Math.max(boxA.min.z, boxB.min.z));
  return ix * iy * iz;
}

/** Volume of a Box3 */
export function boxVolume(box) {
  const dx = box.max.x - box.min.x;
  const dy = box.max.y - box.min.y;
  const dz = box.max.z - box.min.z;
  return dx * dy * dz;
}

/** Intersection volume / min(volA, volB). Returns 0-1. */
export function volumeRatio(boxA, boxB) {
  const iv = intersectVolume(boxA, boxB);
  if (iv === 0) return 0;
  return iv / Math.min(boxVolume(boxA), boxVolume(boxB));
}

/** Check if two AABBs overlap in XY plane (ignore Z) */
export function xyOverlap(boxA, boxB) {
  const ix = Math.max(0, Math.min(boxA.max.x, boxB.max.x) - Math.max(boxA.min.x, boxB.min.x));
  const iy = Math.max(0, Math.min(boxA.max.y, boxB.max.y) - Math.max(boxA.min.y, boxB.min.y));
  const areaA = (boxA.max.x - boxA.min.x) * (boxA.max.y - boxA.min.y);
  const areaB = (boxB.max.x - boxB.min.x) * (boxB.max.y - boxB.min.y);
  return (ix * iy) / Math.min(areaA, areaB);
}
```

- [ ] **Step 2: Commit**

```bash
git add public/games/house-dismantle/validate/helpers.js
git commit -m "feat(validate): add geometry helper utilities"
```

---

### Task 2: R5 dependency topology check

**Files:**
- Create: `public/games/house-dismantle/validate/rules/dep-topology.js`

**Interfaces:**
- Consumes: `PART_DEFS` (from config.js)
- Produces: `checkDepTopology(PART_DEFS) → Violation[]`

- [ ] **Step 1: Write dep-topology.js**

```js
/* Rule: Dependency Topology — detect counter-intuitive dependencies */
import { CATEGORIES } from '../../config.js';

// Physical construction levels (higher = upper floor)
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

const CAT_ORDER = { roof: 5, structure: 4, openings: 3, interior: 2, base: 1, plumbing: 1, yard: 0 };

export function checkDepTopology(PART_DEFS) {
  const violations = [];

  for (const part of PART_DEFS) {
    const partLevel = LEVELS[part.name] ?? 1;
    const partCat = part.cat;
    const partCatOrder = CAT_ORDER[partCat] ?? 2;

    for (const depName of part.deps) {
      const depLevel = LEVELS[depName] ?? 1;
      const dep = PART_DEFS.find(d => d.name === depName);
      const depCatOrder = dep ? (CAT_ORDER[dep.cat] ?? 2) : 2;

      // Upward dependency: lower-level part depends on higher-level
      if (depLevel > partLevel + 1) {
        violations.push({
          rule: 'dep-topology',
          severity: 'error',
          parts: [part.name, depName],
          detail: `${part.label} (L${partLevel}) 依赖 ${dep?.label || depName} (L${depLevel})——下层不应依赖上层结构`,
          metrics: { partLevel, depLevel },
          fix: {
            file: 'config.js',
            line: findDepLine(part.name, depName),
            suggestion: `移除 ${part.name} 对 ${depName} 的依赖，或将其加入 opens 宿主关系而非硬依赖`,
          },
        });
      }

      // Structure depends on furniture/interior — physically wrong
      if (partCatOrder >= 4 && depCatOrder <= 2 && depCatOrder > 0) {
        violations.push({
          rule: 'dep-topology',
          severity: 'warning',
          parts: [part.name, depName],
          detail: `${part.label} (${part.cat}) 依赖 ${dep?.label || depName} (${dep?.cat})——结构不应依赖软装`,
          metrics: { partCat: partCatOrder, depCat: depCatOrder },
          fix: {
            file: 'config.js',
            suggestion: `考虑移除 ${part.name} → ${depName} 的依赖`,
          },
        });
      }
    }
  }
  return violations;
}

function findDepLine(partName, depName) {
  // Approximate line numbers from PART_DEFS in config.js
  const lines = {
    'stairs,upperWallFront': 102, 'stairs,upperWallBack': 102,
    'crossWall,upperWallFront': 89, 'crossWall,upperWallBack': 89,
    'crossWall,interiorWall1': 89, 'crossWall,interiorWall2': 89,
  };
  return lines[`${partName},${depName}`] || null;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/games/house-dismantle/validate/rules/dep-topology.js
git commit -m "feat(validate): add dependency topology rule (R5)"
```

---

### Task 3: R4 room height check

**Files:**
- Create: `public/games/house-dismantle/validate/rules/room-height.js`

**Interfaces:**
- Consumes: `WALL_H1`, `WALL_H2` from config.js
- Produces: `checkRoomHeight() → Violation[]`

- [ ] **Step 1: Write room-height.js**

```js
/* Rule: Room Height — check habitable clearances */
import { WALL_H1, WALL_H2, FLOOR_H } from '../../config.js';

const MIN_HABITABLE = 1.8; // minimum usable room height in meters

export function checkRoomHeight() {
  const violations = [];

  const h1Clear = WALL_H1;            // ground floor clear height
  const h2Clear = WALL_H2;            // upper half-story clear height

  if (h1Clear < MIN_HABITABLE) {
    violations.push({
      rule: 'room-height',
      severity: 'error',
      parts: ['floor', 'wallFront'],
      detail: `一楼净高 ${h1Clear.toFixed(1)}m < ${MIN_HABITABLE}m 最低居住标准`,
      metrics: { actual: h1Clear, minRequired: MIN_HABITABLE },
      fix: { file: 'config.js', line: 8, suggestion: `WALL_H1 至少设为 ${MIN_HABITABLE}m` },
    });
  }

  if (h2Clear < MIN_HABITABLE) {
    violations.push({
      rule: 'room-height',
      severity: 'error',
      parts: ['floor2', 'upperWallFront'],
      detail: `二楼净高 ${h2Clear.toFixed(1)}m < ${MIN_HABITABLE}m 最低居住标准`,
      metrics: { actual: h2Clear, minRequired: MIN_HABITABLE },
      fix: { file: 'config.js', line: 9, suggestion: `WALL_H2 至少设为 ${MIN_HABITABLE}m` },
    });
  }

  return violations;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/games/house-dismantle/validate/rules/room-height.js
git commit -m "feat(validate): add room height check (R4)"
```

---

### Task 4: R3 column placement check

**Files:**
- Create: `public/games/house-dismantle/validate/rules/column-placement.js`

**Interfaces:**
- Consumes: parts Map (for columns part), HOUSE_W, HOUSE_D, BAY_W, HW2, HD2 from config
- Produces: `checkColumnPlacement(parts) → Violation[]`

- [ ] **Step 1: Write column-placement.js**

```js
/* Rule: Column Placement — columns should be near wall planes */
import { HW2, HD2, BAY_W, WALL_T } from '../../config.js';

const MAX_DIST_TO_WALL = 1.5; // meter — column further than this from any wall is suspect

export function checkColumnPlacement(parts) {
  const violations = [];
  const colsPart = parts.get('columns');
  if (!colsPart) return violations;

  // Known wall planes in X and Z
  // X-planes: left wall, right wall, interiorWall1, interiorWall2
  const xWallPlanes = [-HW2, HW2, -BAY_W / 2, BAY_W / 2];
  // Z-planes: front wall, back wall, crossWall
  const zWallPlanes = [HD2, -HD2, 1.0]; // crossWall at z=1.0

  // Collect column positions from mesh centers
  const colPositions = [];
  for (const mesh of colsPart.meshArr) {
    if (mesh.geometry?.type === 'CylinderGeometry') {
      mesh.updateWorldMatrix(true, false);
      const pos = new THREE.Vector3();
      mesh.getWorldPosition(pos);
      colPositions.push(pos);
    }
  }

  for (const pos of colPositions) {
    const minXDist = Math.min(...xWallPlanes.map(wx => Math.abs(pos.x - wx)));
    const minZDist = Math.min(...zWallPlanes.map(wz => Math.abs(pos.z - wz)));
    const minDist = Math.min(minXDist, minZDist);

    if (minDist > MAX_DIST_TO_WALL) {
      violations.push({
        rule: 'column-placement',
        severity: 'warning',
        parts: ['columns'],
        detail: `柱子位于 (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})，距最近墙面 ${minDist.toFixed(1)}m > ${MAX_DIST_TO_WALL}m`,
        metrics: { distanceToNearestWall: Math.round(minDist * 100) / 100, maxAllowed: MAX_DIST_TO_WALL },
        fix: { file: 'house-core.js', line: 66, suggestion: `将柱子移到靠近墙面的位置（x=${pos.x.toFixed(1)} 附近最近的墙面在 x=${xWallPlanes.reduce((a,b) => Math.abs(pos.x-a)<Math.abs(pos.x-b)?a:b)}）` },
      });
    }
  }
  return violations;
}
```

Wait, this imports THREE but doesn't import it. Let me fix that — it needs `import * as THREE from 'three';`.

- [ ] **Step 2: Commit**

```bash
git add public/games/house-dismantle/validate/rules/column-placement.js
git commit -m "feat(validate): add column placement check (R3)"
```

---

### Task 5: R7 polygon consistency check

**Files:**
- Create: `public/games/house-dismantle/validate/rules/poly-consistency.js`

**Interfaces:**
- Consumes: parts Map
- Produces: `checkPolyConsistency(parts) → Violation[]`

- [ ] **Step 1: Write poly-consistency.js**

```js
/* Rule: Polygon Consistency — detect low-poly / high-poly mismatch */
const MAX_SEGMENT_RATIO = 3;

export function checkPolyConsistency(parts) {
  const violations = [];
  const entries = []; // [{ partName, meshIdx, segments }]

  for (const [name, p] of parts) {
    for (let i = 0; i < p.meshArr.length; i++) {
      const geo = p.meshArr[i].geometry;
      if (!geo?.parameters) continue;
      const segs = geo.parameters.radialSegments
        || geo.parameters.widthSegments
        || geo.parameters.heightSegments;
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
    violations.push({
      rule: 'poly-consistency',
      severity: 'warning',
      parts: [...new Set([...minEntries, ...maxEntries].map(e => e.partName))],
      detail: `几何精度不一致：最粗 ${min}段 (${minEntries.map(e => e.partName).join(',')}) vs 最细 ${max}段 (${maxEntries.map(e => e.partName).join(',')})，比值 ${ratio.toFixed(1)}x > ${MAX_SEGMENT_RATIO}x`,
      metrics: { minSegments: min, maxSegments: max, ratio: Math.round(ratio * 10) / 10 },
      fix: {
        file: minEntries.map(e => `${e.partName}相关`).join(', '),
        suggestion: `将 ${minEntries.map(e => e.partName).join('、')} 的分段数从 ${min} 提升到至少 ${Math.ceil(max / MAX_SEGMENT_RATIO)}，或统一使用 low-poly 风格`,
      },
    });
  }
  return violations;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/games/house-dismantle/validate/rules/poly-consistency.js
git commit -m "feat(validate): add polygon consistency check (R7)"
```

---

### Task 6: R2 clearance check (crossWall doorways)

**Files:**
- Create: `public/games/house-dismantle/validate/rules/clearance.js`

**Interfaces:**
- Consumes: parts Map, BAY_W from config
- Produces: `checkClearance(parts) → Violation[]`

- [ ] **Step 1: Write clearance.js**

```js
/* Rule: Clearance — minimum passage width */
import { getWorldAABB } from '../helpers.js';
import { BAY_W, WALL_T } from '../../config.js';

const MIN_PASSAGE = 0.6;  // minimum doorway/passage width in meters
const MIN_COMFORT = 0.9;

export function checkClearance(parts) {
  const violations = [];
  const cwPart = parts.get('crossWall');
  if (!cwPart) return violations;

  // Collect wall segment AABBs (the large box segments, not tiny details)
  const segments = [];
  for (const mesh of cwPart.meshArr) {
    const box = getWorldAABB(mesh);
    const sx = box.max.x - box.min.x;
    const sy = box.max.y - box.min.y;
    const sz = box.max.z - box.min.z;
    // Wall segments are wide in X, tall in Y, thin in Z
    if (sx > 1 && sy > 1 && sz < 0.5) {
      segments.push({ mesh, box, centerX: (box.min.x + box.max.x) / 2 });
    }
  }

  // Sort by X position and find gaps
  segments.sort((a, b) => a.centerX - b.centerX);
  for (let i = 0; i < segments.length - 1; i++) {
    const gap = segments[i + 1].box.min.x - segments[i].box.max.x;
    if (gap < MIN_COMFORT) {
      const sev = gap < MIN_PASSAGE ? 'error' : 'warning';
      violations.push({
        rule: 'clearance',
        severity: sev,
        parts: ['crossWall'],
        detail: `隔墙段间门洞宽 ${(gap * 100).toFixed(0)}cm < ${(MIN_PASSAGE * 100).toFixed(0)}cm 最小通过宽度`,
        metrics: { gap: Math.round(gap * 100) / 100, minRequired: MIN_PASSAGE },
        fix: {
          file: 'house-core.js',
          line: 111,
          suggestion: `segW 从 BAY_W - WALL_T*0.4 (${(BAY_W - WALL_T*0.4).toFixed(2)}m) 减小到 BAY_W - ${(MIN_COMFORT).toFixed(1)} (${(BAY_W - MIN_COMFORT).toFixed(1)}m)，使门洞达到 ${MIN_COMFORT.toFixed(1)}m`,
        },
      });
      break; // one violation covers all gaps
    }
  }
  return violations;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/games/house-dismantle/validate/rules/clearance.js
git commit -m "feat(validate): add clearance check (R2)"
```

---

### Task 7: R1 overlap detection

**Files:**
- Create: `public/games/house-dismantle/validate/rules/overlap.js`

**Interfaces:**
- Consumes: parts Map
- Produces: `checkOverlap(parts) → Violation[]`

- [ ] **Step 1: Write overlap.js**

```js
/* Rule: Overlap — detect unintended mesh intersections */
import { getWorldAABB, volumeRatio } from '../helpers.js';

// Host-guest whitelist: [guestPart, hostPart]
const GUEST_HOST = [
  ['doors', 'wallFront'],
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
    (g === partA && h === partB) || (g === partB && h === partA)
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
      if (vol > 0.001) { // skip near-zero-volume meshes
        allMeshes.push({ partName: name, mesh, box, volume: vol });
      }
    }
  }

  const reported = new Set();

  for (let i = 0; i < allMeshes.length; i++) {
    for (let j = i + 1; j < allMeshes.length; j++) {
      const a = allMeshes[i], b = allMeshes[j];
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
            file: '待定位',
            suggestion: `${a.partName} 与 ${b.partName} 位置冲突——调整其一偏移量`,
          },
        });
      }
    }
  }
  return violations;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/games/house-dismantle/validate/rules/overlap.js
git commit -m "feat(validate): add overlap detection (R1)"
```

---

### Task 8: R6 z-fighting detection

**Files:**
- Create: `public/games/house-dismantle/validate/rules/z-fighting.js`

**Interfaces:**
- Consumes: parts Map
- Produces: `checkZFighting(parts) → Violation[]`

- [ ] **Step 1: Write z-fighting.js**

```js
/* Rule: Z-Fighting — detect co-planar overlapping meshes within same part */
import { getWorldAABB } from '../helpers.js';

const DEPTH_EPSILON = 0.005; // meter — positions within this are considered co-planar
const XY_OVERLAP_MIN = 0.3;  // 30% XY overlap to qualify

export function checkZFighting(parts) {
  const violations = [];

  for (const [name, p] of parts) {
    const meshes = p.meshArr;
    if (meshes.length < 2) continue;

    // Determine which axis is "depth" for this part based on wall orientation
    // For simplicity, check all 3 axes for each pair
    const reportedPairs = new Set();

    for (let i = 0; i < meshes.length; i++) {
      for (let j = i + 1; j < meshes.length; j++) {
        const boxA = getWorldAABB(meshes[i]);
        const boxB = getWorldAABB(meshes[j]);

        // Check if centers are very close but not identical
        const cx = Math.abs((boxA.min.x + boxA.max.x) / 2 - (boxB.min.x + boxB.max.x) / 2);
        const cy = Math.abs((boxA.min.y + boxA.max.y) / 2 - (boxB.min.y + boxB.max.y) / 2);
        const cz = Math.abs((boxA.min.z + boxA.max.z) / 2 - (boxB.min.z + boxB.max.z) / 2);

        // Co-planar in at least one axis AND overlapping in the other two
        const coPlanarZ = cz < DEPTH_EPSILON;
        const coPlanarX = cx < DEPTH_EPSILON;
        const coPlanarY = cy < DEPTH_EPSILON;

        // XY overlap for Z-co-planar, XZ for Y-co-planar, YZ for X-co-planar
        let overlapArea = 0;
        if (coPlanarZ) {
          const ox = Math.max(0, Math.min(boxA.max.x, boxB.max.x) - Math.max(boxA.min.x, boxB.min.x));
          const oy = Math.max(0, Math.min(boxA.max.y, boxB.max.y) - Math.max(boxA.min.y, boxB.min.y));
          const areaA = (boxA.max.x - boxA.min.x) * (boxA.max.y - boxA.min.y);
          const areaB = (boxB.max.x - boxB.min.x) * (boxB.max.y - boxB.min.y);
          overlapArea = (ox * oy) / Math.min(areaA, areaB);
        } else if (coPlanarX) {
          const oy = Math.max(0, Math.min(boxA.max.y, boxB.max.y) - Math.max(boxA.min.y, boxB.min.y));
          const oz = Math.max(0, Math.min(boxA.max.z, boxB.max.z) - Math.max(boxA.min.z, boxB.min.z));
          const areaA = (boxA.max.y - boxA.min.y) * (boxA.max.z - boxA.min.z);
          const areaB = (boxB.max.y - boxB.min.y) * (boxB.max.z - boxB.min.z);
          overlapArea = (oy * oz) / Math.min(areaA, areaB);
        } else if (coPlanarY) {
          const ox = Math.max(0, Math.min(boxA.max.x, boxB.max.x) - Math.max(boxA.min.x, boxB.min.x));
          const oz = Math.max(0, Math.min(boxA.max.z, boxB.max.z) - Math.max(boxA.min.z, boxB.min.z));
          const areaA = (boxA.max.x - boxA.min.x) * (boxA.max.z - boxA.min.z);
          const areaB = (boxB.max.x - boxB.min.x) * (boxB.max.z - boxB.min.z);
          overlapArea = (ox * oz) / Math.min(areaA, areaB);
        }

        if (overlapArea > XY_OVERLAP_MIN) {
          const pairKey = `${i},${j}`;
          if (reportedPairs.has(pairKey)) continue;
          reportedPairs.add(pairKey);

          violations.push({
            rule: 'z-fighting',
            severity: 'error',
            parts: [name],
            detail: `${name} 内有 mesh 在相同深度重叠 (面积比 ${(overlapArea * 100).toFixed(0)}%)，会产生 Z-fighting 闪烁`,
            metrics: { overlapArea: Math.round(overlapArea * 100) / 100, depthDiff: Math.round(cz * 1000) / 1000 },
            fix: {
              file: 'house-core.js',
              line: 168,
              suggestion: `将重叠 mesh 的深度偏移 ±0.01m`,
            },
          });
        }
      }
    }
  }
  return violations;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/games/house-dismantle/validate/rules/z-fighting.js
git commit -m "feat(validate): add z-fighting detection (R6)"
```

---

### Task 9: Entry point index.js

**Files:**
- Create: `public/games/house-dismantle/validate/index.js`

**Interfaces:**
- Consumes: all rule modules, config.js
- Produces: `validateHouse(parts) → Violation[]`

- [ ] **Step 1: Write index.js**

```js
/* House Dismantle — Spatial Validation Engine
   Usage: import { validateHouse } from './validate/index.js';
          const violations = validateHouse(parts);
*/
import { PART_DEFS } from '../config.js';
import { checkDepTopology } from './rules/dep-topology.js';
import { checkRoomHeight } from './rules/room-height.js';
import { checkColumnPlacement } from './rules/column-placement.js';
import { checkPolyConsistency } from './rules/poly-consistency.js';
import { checkClearance } from './rules/clearance.js';
import { checkOverlap } from './rules/overlap.js';
import { checkZFighting } from './rules/z-fighting.js';

/**
 * @param {Map} parts — the parts Map from app.js
 * @returns {Array<{rule:string, severity:'error'|'warning', parts:string[], detail:string, metrics:object, fix:{file:string, line?:number, suggestion:string}}>}
 */
export function validateHouse(parts) {
  const allViolations = [
    // Pure data rules (no Three.js geometry traversal needed)
    ...checkDepTopology(PART_DEFS),
    ...checkRoomHeight(),
    // Geometry-aware rules
    ...checkColumnPlacement(parts),
    ...checkPolyConsistency(parts),
    ...checkClearance(parts),
    ...checkOverlap(parts),
    ...checkZFighting(parts),
  ];

  // Log summary
  const errors = allViolations.filter(v => v.severity === 'error');
  const warnings = allViolations.filter(v => v.severity === 'warning');

  if (allViolations.length > 0) {
    console.group(`🏠 House Spatial Validation — ${errors.length} errors, ${warnings.length} warnings`);
    console.table(allViolations.map(v => ({
      rule: v.rule,
      sev: v.severity,
      parts: v.parts.join(', '),
      detail: v.detail,
    })));
    console.groupEnd();
  } else {
    console.log('🏠 House Spatial Validation — ✅ all clear');
  }

  return allViolations;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/games/house-dismantle/validate/index.js
git commit -m "feat(validate): add validation engine entry point"
```

---

### Task 10: Integrate into app.js

**Files:**
- Modify: `public/games/house-dismantle/app.js`

**Interfaces:**
- Consumes: validateHouse from validate/index.js
- Produces: auto-runs validation after house build

- [ ] **Step 1: Add import and call in app.js**

After the existing imports (~line 14), add:
```js
import { validateHouse } from './validate/index.js';
```

After the build calls (~line 92), add:
```js
// ── Spatial validation ─────────────────────────────────────────────
validateHouse(parts);
```

- [ ] **Step 2: Commit**

```bash
git add public/games/house-dismantle/app.js
git commit -m "feat(validate): integrate validation engine into app.js"
```

---

### Task 11: Verify end-to-end

- [ ] **Step 1: Check the game loads without errors**

Open `http://localhost:4321/games/house-dismantle/` in browser, check console for validation output.

Expected: console.table with ~8-10 violations covering all 7 rules.

- [ ] **Step 2: Commit any fixes**
