# 书房 (Study Room) — 空间约束文档

> 在 house-dismantle 主屋右侧增加一个 3m×3m 的书房扩展间。
> 约束 → 规则 → 3D 模型，三步流水线。

## 1. 空间定位

- **位置**: 中心 (x=7.5, z=2.8)，即主屋右墙外侧、前部区域（避开 crossWall z=1.0）
- **尺寸**: 宽 3.0m (X) × 深 3.0m (Z) × 高 2.8m (Y，与一层齐平)
- **朝向**: 门朝左 (-X) 连接主屋，窗朝右 (+X)
- **与已有部件的位置关系**:
  - 左墙紧贴 wallRight（共享墙体）
  - 前墙与 wallFront 的交叉墙段重叠
  - 地面与 floor 同高 (y = FLOOR_H = 0.2)
  - 天花板 = FLOOR_H + 2.8 = 3.0m（低于 BAND_Y=3.0m 但正好碰到）

```js
// 书房几何定义
const STUDY_X = HW2 + 1.5; // 6 + 1.5 = 7.5 (右墙外侧 + 半宽)
const STUDY_Z = 1.0;       // 前后居中靠前
const STUDY_W = 3.0;       // X 方向宽
const STUDY_D = 3.0;       // Z 方向深
const STUDY_H = WALL_H1;    // 2.8m (与一层同高)
const STUDY_WALL_T = 0.15;  // 扩展间墙稍薄
```

## 2. 结构约束

- **墙体**: 3 面（前/右/后），厚度 0.15m；左墙借用已有 wallRight
- **地面**: 厚度 0.06m，y = FLOOR_H + 0.03
- **天花板**: 厚度 0.06m，y = FLOOR_H + STUDY_H - 0.03 = 2.97m
- **净高**: 2.8 - 0.06 - 0.06 = 2.68m ≥ 1.8m ✓
- **屋顶穿透**: 书房天花板低于 EAVE_H=4.3m，无穿透风险
- **柱子**: 书房无独立柱子

## 3. 通道间隙

- **门洞**: 在 wallRight 上开 0.9m 宽 × 2.1m 高的门洞
- **书房内通道**: 书桌到书架 ≥ 0.6m
- **与已有开口**: 书房门洞不与已有门窗冲突（wallRight 无窗户）

## 4. 碰撞排除清单

白名单（自然重叠，不报 violation）：

| 新部件 mesh | 已有部件 | 原因 |
|------------|---------|------|
| studyFloor | floor | 地面承载 |
| studyWallFront | wallRight | 前墙与右墙交叉 |
| studyWallBack | wallRight | 后墙与右墙交叉 |
| studyFloor | base | 坐落在石基上 |
| studyDoor | wallRight | 门嵌入右墙 |

禁止重叠：

| 新部件 | 已有部件 | 冲突后果 |
|--------|---------|---------|
| studyWallRight | chickens | 鸡在院子，书房的右墙可能与鸡位置重叠（需检查 z 坐标） |
| studyDesk | studyWallRight | 书桌不应嵌入外墙 |
| studyBookshelf | studyWallBack | 书架靠墙但不应穿透 |

## 5. 依赖拓扑

```
新增 PART_DEFS entries:
  { name: 'studyWalls',  label: '书房屋墙', color: '#e8dcc8',
    deps: ['studyDoor','studyDesk','studyBookshelf'], cat: 'structure' },
  { name: 'studyFloor',  label: '书房地板', color: '#a09078',
    deps: ['studyWalls'], cat: 'base' },
  { name: 'studyDoor',   label: '书房门',   color: '#4a2818',
    deps: ['studyWalls'], cat: 'openings' },
  { name: 'studyDesk',   label: '书桌',     color: '#8b6914',
    deps: ['studyWalls'], cat: 'interior' },
  { name: 'studyBookshelf', label: '书架',  color: '#6b4a20',
    deps: ['studyWalls'], cat: 'interior' },
```

- **依赖谁**: 书房屋墙依赖书房门 + 书桌 + 书架（先清空内部再拆墙）
- **被谁依赖**: 无已有部件依赖书房
- **影响已有部件 deps**: wallRight 需新增依赖 studyWalls（拆除顺序：先书房后主屋墙），但为简化本次暂不改动已有 deps

## 6. 材质视觉

- **墙**: 复用 MATS.upperWall (0xc4b898) — 与二层墙色协调
- **地板**: 复用 MATS.floor (0x908878)
- **门**: 复用 MATS.door (0x4a2818) — 与主门同色
- **书桌**: 复用 MATS.woodLight (0xa07830) — 浅木色
- **书架**: 复用 MATS.woodDark (0x6b4a20) — 深木色
- **几何精度**: 书桌腿 CylinderGeometry(8)，与场景中位数一致

## 7. 开口通风

- **窗**: 右墙上 1 个，宽 1.0m × 高 1.2m，位置 (x=8.2, y=1.8, z=1.0)，朝向 +X
- **门**: 左墙上 1 个，宽 0.9m × 高 2.1m，位置 (x=6.0, y=1.2, z=1.0)，朝向 -X
- **通风**: 窗提供自然通风
