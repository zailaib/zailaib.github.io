# House Dismantle 3D — 设计审查报告

> 更新：2026-07-24 | 当前版本：大别山 4 开间 2 层 (16m×9m)

## 已修复

| # | 问题 | 修复 |
|---|------|------|
| 1.1 | 后窗与后门重叠 (bay4) | `house-openings.js`: bx=6 跳过一层后窗 |
| 1.1 | 神龛跨两开间 | 已移除 `shrine` 部件 |
| 1.2 | 隔墙门洞太窄 (~19cm) | 改为 0.9m 标准门洞 |
| 2.1 | 客厅正中立柱 | 木柱移至隔墙位置，天井区域无柱 |
| 2.3 | 山墙高度异常 | WALL_H2=2.5m，山墙正常填充 |
| 4.1 | 二楼过矮 (WALL_H2=1.5m) | WALL_H2=2.5m |
| 5.1 | 依赖关系反直觉 | 改为三层分类：屋顶/二层/一层，点击直接平移 |
| 3.2 | 通风窗 Z-fighting | 横竖梃 z 偏移 ±0.01 |

## 待处理

### P1 — 材质无纹理
所有材质为纯色 MeshStandardMaterial。木纹、瓦纹、石纹均缺失。

### P1 — 代码清理
- `config.js`: 删除 yard 相关材质 (chickenBody/Comb/Beak, wellStone/Roof, hayMat)
- `house-yard.js`: 文件已删除，功能已禁用
- 旧 3 开间文档引用需更新

### P2 — 视觉统一
- 多边形精度不统一 (柱子 16 段 vs 鸡 8 段 → 鸡已移除)
- 井壁 openEnded → 井已移除
- 桌椅比例: 凳子 1.6m 比桌子 1.5m 深 (凳子太长)

### P3 — 文档同步
- site-analyzer.js: 硬编码 "后窗×4" (实际 3 个)
- PART_DEFS labels: "木柱"→"水泥柱" 已更新，其他标签待检查

## 当前文件结构

```
house-dismantle/
├── app.js, config.js, index.html, style.css
├── roof/index.js           — 瓦片 + 屋架
├── floor2/                 — 二层
│   ├── walls.js, floor.js, rooms.js, openings.js
├── floor1/                 — 一层
│   ├── walls.js, floor.js, rooms.js, openings.js
├── base/index.js           — 地基 + 柱 + 排水
└── validate/               — 空间检测引擎
```

## 交互设计

- 3 个分类按钮：屋顶 ↗ (右 20m) / 二层 ↗ (左 20m) / 一层 ↗ (不动)
- 点击即平移，再点复位
- 点部件 → 按 1 拆解 (保留选中+级联依赖)
