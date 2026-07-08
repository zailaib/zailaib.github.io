# H5 游戏/应用开发规范

本规范适用于 `public/games/<name>/` 下的所有互动应用。
每个游戏必须在**保留原始教育/娱乐目标**的前提下，满足以下标准。

---

## 1. 性能 (Performance)

| 检查项 | 标准 |
|---|---|
| FPS | 桌面 ≥30fps，移动端 ≥20fps（可用 `stats.js` 或浏览器 devtools 验证） |
| 启动时间 | 首屏渲染 < 2s（不含 CDN 脚本加载） |
| 内存 | 无持续增长的内存泄漏（切换场景/重建模型时 dispose 旧资源） |
| 绘制调用 | 单场景 < 200 draw calls（合并不必要的独立 Mesh） |
| 粒子数量 | 移动端 ≤200，桌面端 ≤500（超出用 LOD） |

**Three.js 资源释放**：
```js
// 每次重建前必须 dispose
geometry.dispose();
material.dispose();
// 纹理
texture.dispose();
// 从场景移除
scene.remove(mesh);
```

---

## 2. 响应式 (Responsiveness)

| 检查项 | 标准 |
|---|---|
| 视口 | `renderer.setSize()` 和 `camera.aspect` 随 `resize` 事件更新 |
| 触摸 | `touch-action: none` + `pointerdown/pointermove`（不用 mouse 专用事件） |
| 最小可操作区域 | 按钮/热区 ≥ 44×44 CSS px (WCAG 2.1) |
| 横屏提示 | 若游戏仅支持横屏，需检测并提示旋转 |
| 字体缩放 | 使用 `rem` 或 `vw`，避免固定 `px` 导致移动端过小 |

**移动端 Meta 标签清单**：
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
```

---

## 3. OrbitControls 配置 (Three.js 专用)

```js
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.zoomSpeed = 0.5;        // 防止滚轮跳跃
controls.minDistance = 2;        // 最小缩放（防止穿透模型）
controls.maxDistance = 15;       // 最大缩放（防止迷失）
controls.autoRotate = true;      // 自动旋转（展示类应用建议开启）
controls.autoRotateSpeed = 0.3;  // 慢速自动旋转
controls.maxPolarAngle = Math.PI * 0.65; // 限制俯仰角，防止翻到底部
```

---

## 4. 错误处理 (Error Resilience)

| 检查项 | 标准 |
|---|---|
| NaN 防护 | 所有 `Math.acos/sqrt/asin` 参数需 clamp；除法检查分母 ≠0 |
| WebGL 不可用 | 检测并显示降级提示 |
| 资源加载失败 | CDN 脚本加载失败的 fallback 提示 |
| 空状态 | 无数据/无内容时显示占位提示而非空白 |
| try/catch | 用户交互回调（click, pointer 事件）需包裹 try/catch |

**NaN 防护模板**：
```js
const acosArg = Math.max(-1, Math.min(1, value));
if (Math.abs(denominator) < 1e-6) return;
if (isNaN(x) || !isFinite(x)) continue;
```

---

## 5. 用户引导 (Onboarding)

| 检查项 | 标准 |
|---|---|
| 操作提示 | 首次进入显示操作说明（3 秒后渐隐） |
| 空状态引导 | 未操作时给出引导文字（如"点击元素开始"） |
| 进度反馈 | 加载/计算时显示状态（非空白等待） |
| 操作反馈 | 点击/悬停有视觉响应（hover 高亮、active 缩放） |

---

## 6. 科学准确性 (Educational Integrity)

| 检查项 | 标准 |
|---|---|
| 数据来源 | 元素数据、历史年份、物理常数需可溯源 |
| 单位标注 | 所有物理量标注单位（km, nm, m/s 等） |
| 简化声明 | 有意简化的模型需在界面标注（如"示意图，非精确比例"） |
| 更新机制 | 随时间变化的数据（如"新中国 1949-2025"）需可更新 |

---

## 7. 文件结构 (File Organization)

```
public/games/<game-name>/
├── index.html   # HTML 结构（仅标签 + CDN 引用，不含内联样式和脚本）
├── style.css    # 所有 CSS
└── app.js       # 所有 JS 逻辑 (Three.js / Canvas)
```

**原则**：
- HTML、CSS、JS 严格分离
- 不使用内联 `<style>` 和 `<script>`（除非 `< 10 行）
- Three.js 通过 importmap CDN 引入，不打包
- 所有颜色/尺寸使用 CSS 变量或 JS 常量，避免魔法数字

---

## 8. 浏览器兼容 (Compatibility)

| 检查项 | 标准 |
|---|---|
| WebGL | 检测 `canvas.getContext('webgl2')` 或 `'webgl'` |
| ES Modules | importmap 仅在现代浏览器可用（Chrome 89+, Safari 16.4+, FF 108+） |
| 触摸事件 | 使用 Pointer Events API（统一鼠标/触摸） |
| 暗色模式 | 背景色不依赖 `prefers-color-scheme`（游戏应固定主题） |

---

## 9. 代码风格 (Code Style)

| 检查项 | 标准 |
|---|---|
| 命名 | camelCase 变量/函数，SCREAMING_CASE 常量 |
| 注释 | 每个 function 有 JSDoc 一行说明 |
| 常量 | 所有魔法数字提取为命名常量 |
| 缩进 | 2 空格 |
| 最大行宽 | 120 字符 |

---

## 10. 游戏审核清单 (Review Checklist)

每个游戏上线前需逐项确认：

- [ ] FPS 达标（桌面 ≥30，移动 ≥20）
- [ ] 响应式适配（resize 正确）
- [ ] OrbitControls 配置完整（zoomSpeed, minDistance, maxDistance）
- [ ] 资源正确 dispose（geometry, material, texture）
- [ ] NaN/Infinity 防护到位
- [ ] 操作提示可见（3 秒后渐隐）
- [ ] 触摸事件可用
- [ ] 科学数据标注单位
- [ ] HTML/CSS/JS 分离
- [ ] 无 console 报错

---

*版本: 1.0 · 最后更新: 2026-07-08*
