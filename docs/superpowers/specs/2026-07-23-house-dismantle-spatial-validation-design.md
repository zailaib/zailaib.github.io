# House Dismantle — 空间约束检测引擎

> 设计规范 | 2026-07-23
>
> **目标**: AI 可自检自修——导入验证模块，跑规则，输出结构化 violations，AI 定位代码、自动修复。

## 架构

```
validate/
├── index.js              # 入口：validateHouse(parts) → Violation[]
├── extractor.js          # 从 parts Map 提取空间模型
├── rules/
│   ├── overlap.js        # AABB 几何重叠
│   ├── clearance.js      # 通道/门洞最小宽度
│   ├── column-placement.js  # 柱位合理性
│   ├── room-height.js    # 层高约束
│   ├── dep-topology.js   # 依赖拓扑检测
│   ├── z-fighting.js     # 同深度 mesh 冲突
│   └── poly-consistency.js  # 几何精度一致性
└── types.d.ts            # JSDoc 类型定义
```

### 数据流

```
parts Map (app.js 现有)
  → extractor(model)     → SpatialModel { walls, columns, openings, furniture, floors, roof, misc }
  → runRules(model)      → Violation[]
  → console.table()      → AI 读取 → 定位 → 修复
```

### 调用方式

```js
// app.js，house 构建完成后
import { validateHouse } from './validate/index.js';

const violations = validateHouse(parts);
if (violations.length > 0) {
  console.group('🏠 House Spatial Validation');
  console.table(violations.map(v => ({
    rule: v.rule,
    severity: v.severity,
    parts: v.parts.join(', '),
    message: v.message,
    file: v.fix?.file,
    line: v.fix?.line,
  })));
  console.groupEnd();
}
```

## Violation 数据结构

```ts
interface Violation {
  rule: string;           // 规则名，如 'overlap', 'clearance', 'column-placement'
  severity: 'error' | 'warning';
  parts: string[];        // 涉及的 part name（对应 PART_DEFS 中的 name）
  detail: string;         // 人类可读描述
  metrics: Record<string, number>;  // 量化数据，如 { gap: 0.19, minRequired: 0.9 }
  fix: {
    file: string;         // 相对于 public/games/house-dismantle/
    line?: number;        // 近似行号
    suggestion: string;   // 修复建议
  };
}
```

## 空间模型 (SpatialModel)

```ts
// extractor.js 从 parts Map 提取
interface SpatialModel {
  walls: WallEntry[];
  columns: ColumnEntry[];
  openings: OpeningEntry[];    // doors, windows, stairs, windScreen
  furniture: FurnitureEntry[]; // beds, tableChairs, stove, shrine
  floors: FloorEntry[];
  roof: RoofEntry[];
  misc: MiscEntry[];           // chickens, well, pipelines
}

interface WallEntry {
  name: string;          // part name
  axis: 'x' | 'z';       // 墙体走向
  bounds: {              // 世界空间 AABB (从 meshArr 聚合)
    min: [number,number,number];
    max: [number,number,number];
  };
  meshes: THREE.Mesh[];
  isInterior: boolean;
}

interface ColumnEntry {
  name: string;          // 'columns'
  positions: [number,number,number][];  // 每根柱子的世界位置
}

// ... 类似结构
```

### 提取策略

每个 part 遍历 `meshArr`，对每个 mesh 计算 `THREE.Box3`（已考虑 `group.position` + mesh 本地 position），聚合为该 part 的 world-space AABB。同时记录每个独立 mesh 的 bounds 供细粒度检测。

## 规则定义

### R1: `overlap` — 几何重叠检测

**检测范围**: 所有不同 part 之间，排除宿主-子件关系（门框在墙内不算冲突）。

**宿主-子件白名单**（子件的 mesh 可以嵌入宿主 mesh）:

| 子件 part | 宿主 part |
|-----------|----------|
| doors | wallFront |
| windows | wallFront, wallBack |
| stairs | (无宿主) |
| windScreen | (无宿主) |
| 内门 mesh (挂在 interiorWall1/2 上) | interiorWall1, interiorWall2 |
| 所有家具 | 所有墙 |

**算法**:
1. 为每个 part 的所有 mesh 计算 world-space `THREE.Box3`
2. 遍历所有 mesh 对 (meshA ∈ partA, meshB ∈ partB, partA ≠ partB)
3. 跳过白名单组合
4. 若 `boxA.intersectsBox(boxB)` → 计算重叠体积比 `intersectVolume / min(volA, volB)`
5. 若比值 > 5% → 报 violation

**预期检出**:
- 后门 mesh vs 右开间后窗 mesh（house-openings.js:131 vs 126）
- 通风窗 frame/mullH/mullV 三者在同一 z（house-core.js:163-181，由 R6 处理）

### R2: `clearance` — 最小通过宽度

**检测范围**: 隔墙段间门洞、房间间通道。

**算法 (针对 crossWall 三段式)**:
1. 找到 `crossWall` 的 3 个 mesh 的 X 范围
2. 计算相邻段间缝隙宽度 `gap = segB.minX - segA.maxX`
3. 若 `gap < 0.6` (m) → error; 若 `gap < 0.9` → warning

**通用算法**:
1. 对每对相邻墙体（同走向、平行），检测它们的边缘间距
2. 若间距 < 0.6m 且无门标记 → 报 warning

**预期检出**:
- crossWall 段间缝隙 ≈ 0.19m（house-core.js:111, segW 导致）

### R3: `column-placement` — 柱位合理性

**规则**: 木柱应靠近墙面（承重逻辑），离所有墙面 >1.5m 的柱子不合理。

**算法**:
1. 遍历每根柱子的 (x, z) 位置
2. 计算到最近墙面（外墙或内墙）的距离
3. 若最小距离 > 1.5m → error

**预期检出**:
- z=0 轴线上两根柱子，距前后墙各约 4.5m，距隔墙 1.0m（house-core.js:69）

### R4: `room-height` — 层高约束

**规则**: 居住空间净高应 ≥ 1.8m。

**算法**:
1. 一楼净高 = WALL_H1 = 2.8m → 通过
2. 二楼净高 = WALL_H2 = 1.5m → 不通过 (error)
3. 若配置值改变，自动重新检测

**预期检出**:
- WALL_H2 = 1.5m < 1.8m（config.js:9）

### R5: `dep-topology` — 依赖拓扑

**规则**: 依赖关系应符合物理建造/拆除顺序。定义楼层层次：

```
Level 3:  roofTiles, roofFrame
Level 2:  upperWallFront, upperWallBack, upperWallLeft, upperWallRight, floor2
Level 1:  wallFront, wallBack, wallLeft, wallRight, interiorWall1, interiorWall2, crossWall, columns, floor
Level 0:  base
Openings: doors, windows, stairs, windScreen (嵌入墙体)
Interior: beds, tableChairs, stove, shrine (家具软装)
Yard:     chickens, well
Plumbing: pipelines (Level 0)
```

**检测项**:
1. **向上依赖**: Level N 的 part 不应依赖 Level N+1 的 part（下层拆了上层必须先拆？不合理）
2. **软装依赖结构**: Interior 依赖 Structure 合理，但 Structure 依赖 Interior 不合理
3. **跨层依赖合理性**: stairs 依赖 upperWall* 不合理（楼梯是独立结构）

**算法**:
1. 为每个 part 标记层级 `{ partName → level }`
2. 遍历 PART_DEFS，检查每条 deps 边
3. 若 dep.level > part.level → 报 warning（除非是开口嵌入关系）

**预期检出**:
- stairs (openings) → upperWallFront, upperWallBack（config.js:102）
- crossWall (L1) → upperWallFront, upperWallBack（config.js:89）
- crossWall (L1) → interiorWall1, interiorWall2（config.js:89，同层但依赖方向存疑）
- pipelines (L0) → base (L0)（config.js:118——应该反过来？水管先拆）

### R6: `z-fighting` — 同深度重叠

**规则**: 同一 group 内的 mesh，若中心点 z 差 < 0.005m 且 bbox 在 xy 平面重叠，会闪烁。

**算法**:
1. 遍历每个 part 的 meshArr
2. 对每对 mesh (i, j)，检查：
   - `|pos_i.z - pos_j.z| < 0.005`（或对应法线方向的深度差）
   - XY 平面 bbox 重叠面积 > 50%
3. 满足条件 → error

**预期检出**:
- 通风窗 frame/mullH/mullV（house-core.js:168-180），三者 z 同为 `HD2 + WALL_T/2 + 0.03`

### R7: `poly-consistency` — 多边形精度一致性

**规则**: 场景内几何体的径向分段数 max/min 比 > 3 时视觉不协调。

**算法**:
1. 遍历所有 mesh，收集 `CylinderGeometry`、`SphereGeometry`、`ConeGeometry` 的 `radialSegments`
2. 计算 max、min、ratio
3. 若 ratio > 3 → warning，列出极端值 mesh 的来源 part

**预期检出**:
- 鸡冠 ConeGeometry(4) vs 木柱 CylinderGeometry(16) — ratio = 4

## 实现顺序

| 阶段 | 规则 | 复杂度 | 依赖 |
|------|------|--------|------|
| 1 | extractor + R5 dep-topology | 低 | 纯数据，不涉及 Three.js 计算 |
| 2 | R3 column-placement | 低 | 简单几何计算 |
| 3 | R4 room-height | 低 | 直接从 config 读数 |
| 4 | R2 clearance | 中 | 需要 AABB 计算 |
| 5 | R1 overlap | 中 | 需要 AABB + 碰撞检测 |
| 6 | R6 z-fighting | 中 | 需要 mesh 级别位置比较 |
| 7 | R7 poly-consistency | 低 | 遍历 geometry 参数 |

## 文件清单（实现后）

```
public/games/house-dismantle/
├── validate/
│   ├── index.js              # NEW
│   ├── extractor.js          # NEW
│   ├── rules/
│   │   ├── overlap.js        # NEW
│   │   ├── clearance.js      # NEW
│   │   ├── column-placement.js # NEW
│   │   ├── room-height.js    # NEW
│   │   ├── dep-topology.js   # NEW
│   │   ├── z-fighting.js     # NEW
│   │   └── poly-consistency.js # NEW
│   └── types.d.ts            # NEW
├── app.js                     # MODIFIED: import + call validateHouse
└── config.js                  # (unchanged, read by R4/R5)
```
