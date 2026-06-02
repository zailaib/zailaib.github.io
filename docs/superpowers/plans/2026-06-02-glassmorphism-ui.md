# Glassmorphism UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the bilingual blog's surfaces to frosted-glass over a static gradient (light + dark), CSS-only, via design tokens.

**Architecture:** Token-driven (Approach A). Add `--glass-*` + `--gradient-bg` tokens to `tokens.css` (light) and `dark.css` (dark), then point existing surface declarations at those tokens. Surfaces stay theme-agnostic; `dark.css` overrides the token values. Zero-JS preserved.

**Tech Stack:** Astro 5, plain CSS (custom properties, `backdrop-filter`), bun.

**Note on testing:** This is a visual CSS change with no unit-test harness. The verification for each task is: `bun run build` succeeds + the rule is present in the built output. Final visual acceptance happens in the browser in Task 8.

---

### Task 1: Add glass tokens (light + dark)

**Files:**
- Modify: `src/styles/tokens.css:20` (after `--color-accent-light`)
- Modify: `src/styles/dark.css:18` (after `--color-accent-light`, inside `:root`)

- [ ] **Step 1: Add light glass tokens to tokens.css**

In `src/styles/tokens.css`, insert immediately after the line `--color-accent-light: #dbeafe;` (line 20):

```css

  /* 玻璃拟态系统 - 渐变背景 + 磨砂玻璃表面 */
  --gradient-bg: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 40%, #ecfeff 100%);
  --glass-bg: rgba(255, 255, 255, 0.55);
  --glass-bg-strong: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.6);
  --glass-blur: 16px;
  --glass-shadow: 0 8px 32px rgba(31, 38, 135, 0.12);
```

- [ ] **Step 2: Add dark glass tokens to dark.css**

In `src/styles/dark.css`, insert immediately after the line `--color-accent-light: #1e3a8a;` (line 18, still inside the `:root` block):

```css

    --gradient-bg: linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #0c1a2b 100%);
    --glass-bg: rgba(30, 41, 59, 0.5);
    --glass-bg-strong: rgba(30, 41, 59, 0.7);
    --glass-border: rgba(148, 163, 184, 0.18);
    --glass-blur: 16px;
    --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
```

- [ ] **Step 3: Build to verify no syntax error**

Run: `bun run build`
Expected: build succeeds, 13 pages.

- [ ] **Step 4: Verify tokens present in output**

Run: `grep -rF -- '--glass-bg-strong' dist/ | head -1`
Expected: at least one match (token compiled into bundled CSS).

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/dark.css
git commit -m "feat(ui): add glassmorphism design tokens (light + dark)"
```

---

### Task 2: Apply gradient background to body

**Files:**
- Modify: `src/styles/base.css:13-24` (the `body` rule)

- [ ] **Step 1: Replace the body background**

In `src/styles/base.css`, replace this rule:

```css
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

with:

```css
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background: var(--gradient-bg);
  background-attachment: fixed;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 2: Build**

Run: `bun run build`
Expected: build succeeds, 13 pages.

- [ ] **Step 3: Commit**

```bash
git add src/styles/base.css
git commit -m "feat(ui): apply fixed gradient background to body"
```

---

### Task 3: Convert layout surfaces to glass (base.css)

**Files:**
- Modify: `src/styles/base.css` — `.site-header` (27-35), `.sidebar-content` (92-100), `.content-wrapper` (125-131), `.minimap-content` (153-161)

- [ ] **Step 1: Convert `.site-header`**

Replace:

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--color-bg-accent);
  border-bottom: 1px solid var(--color-border-light);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

with:

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--glass-bg-strong);
  border-bottom: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}
```

- [ ] **Step 2: Convert `.sidebar-content`**

Replace:

```css
.sidebar-content {
  background: var(--color-bg-accent);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-medium) transparent;
}
```

with:

```css
.sidebar-content {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  box-shadow: var(--glass-shadow);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-medium) transparent;
}
```

- [ ] **Step 3: Convert `.content-wrapper`**

Replace:

```css
.content-wrapper {
  background: var(--color-bg-accent);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3xl);
  box-shadow: var(--shadow-sm);
}
```

with:

```css
.content-wrapper {
  background: var(--glass-bg-strong);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3xl);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  box-shadow: var(--glass-shadow);
}
```

- [ ] **Step 4: Convert `.minimap-content`**

Replace:

```css
.minimap-content {
  background: var(--color-bg-accent);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-medium) transparent;
}
```

with:

```css
.minimap-content {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  box-shadow: var(--glass-shadow);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-medium) transparent;
}
```

- [ ] **Step 5: Build**

Run: `bun run build`
Expected: build succeeds, 13 pages.

- [ ] **Step 6: Commit**

```bash
git add src/styles/base.css
git commit -m "feat(ui): convert header/sidebar/minimap/content surfaces to glass"
```

---

### Task 4: Convert article cards to glass (Home.astro)

**Files:**
- Modify: `src/components/Home.astro` — `.article-card` (87-94) and `.article-card:hover` (96-100)

- [ ] **Step 1: Convert `.article-card`**

Replace:

```css
  .article-card {
    background: var(--color-bg-accent);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    transition: all var(--transition-normal);
    box-shadow: var(--shadow-sm);
  }
```

with:

```css
  .article-card {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    transition: all var(--transition-normal);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    box-shadow: var(--glass-shadow);
  }
```

- [ ] **Step 2: Update `.article-card:hover` shadow**

Replace:

```css
  .article-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-accent-primary);
  }
```

with:

```css
  .article-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-accent-primary);
  }
```

- [ ] **Step 3: Build**

Run: `bun run build`
Expected: build succeeds, 13 pages.

- [ ] **Step 4: Commit**

```bash
git add src/components/Home.astro
git commit -m "feat(ui): convert home article cards to glass"
```

---

### Task 5: Tokenize bottom buttons + mobile popups (responsive.css)

**Files:**
- Modify: `src/styles/responsive.css` — `.bottom-btn` (121), nested `.bottom-btn` (266), `.sidebar-container.mobile-visible, .minimap-container.mobile-visible` (293)

**Note:** `.bottom-btn` and the mobile popups currently hardcode `rgba(255,255,255,...)` / `var(--color-bg-accent)`. Swapping to `--glass-bg-strong` makes them theme-aware (dark glass in dark mode) without restructuring the existing media-query nesting. The `.home-btn` accent gradient stays as-is (it's the primary CTA).

- [ ] **Step 1: Tokenize the primary `.bottom-btn` background**

In `src/styles/responsive.css`, in the `.bottom-btn` rule near line 116-135, replace:

```css
    background: rgba(255, 255, 255, 0.9);
```

with:

```css
    background: var(--glass-bg-strong);
```

- [ ] **Step 2: Tokenize the nested mobile `.bottom-btn` background**

In the same file, inside the nested `@media (max-width: 768px)` block (near line 263-272), replace:

```css
      background: rgba(255, 255, 255, 0.95);
```

with:

```css
      background: var(--glass-bg-strong);
```

- [ ] **Step 3: Tokenize the `:active` reset background**

In the same nested block (near line 274-278), replace:

```css
      background: rgba(255, 255, 255, 0.9);
```

with:

```css
      background: var(--glass-bg);
```

- [ ] **Step 4: Convert mobile popup panels to glass**

Replace the background/border in `.sidebar-container.mobile-visible, .minimap-container.mobile-visible` (near line 281-300):

```css
    background: var(--color-bg-accent);
    border: 1px solid var(--color-border-light);
```

with:

```css
    background: var(--glass-bg-strong);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
```

- [ ] **Step 5: Build**

Run: `bun run build`
Expected: build succeeds, 13 pages.

- [ ] **Step 6: Commit**

```bash
git add src/styles/responsive.css
git commit -m "feat(ui): tokenize bottom buttons and mobile popups to glass"
```

---

### Task 6: Robustness — fallback, reduced-motion, focus ring

**Files:**
- Modify: `src/styles/base.css` (append at end of file)

- [ ] **Step 1: Append robustness rules to base.css**

At the end of `src/styles/base.css`, append:

```css

/* ===== 玻璃拟态降级：不支持 backdrop-filter 时回退为实色 ===== */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .site-header,
  .content-wrapper {
    background: var(--color-bg-primary);
  }

  .sidebar-content,
  .minimap-content {
    background: var(--color-bg-accent);
  }
}

/* ===== 键盘可达性：焦点环 ===== */
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

/* ===== 尊重「减少动态效果」偏好 ===== */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

- [ ] **Step 2: Build**

Run: `bun run build`
Expected: build succeeds, 13 pages.

- [ ] **Step 3: Verify fallback present in output**

Run: `grep -rF '@supports not' dist/ | head -1`
Expected: at least one match.

- [ ] **Step 4: Commit**

```bash
git add src/styles/base.css
git commit -m "feat(ui): add backdrop-filter fallback, focus ring, reduced-motion guard"
```

---

### Task 7: Delete dead component files

**Files:**
- Delete: `src/components/ArticleCard.astro`
- Delete: `src/components/PostList.astro`
- Delete: `src/components/utils.ts`

**Note:** Confirmed unreferenced — `grep -rn` finds only self-references in their own header comments. Folded into this work since we're in the component/style layer.

- [ ] **Step 1: Re-confirm no references**

Run: `grep -rn "ArticleCard\|PostList\|components/utils" src/`
Expected: only the files' own header-comment self-references (or nothing). If any real `import` appears, STOP and report.

- [ ] **Step 2: Delete the files**

```bash
git rm src/components/ArticleCard.astro src/components/PostList.astro src/components/utils.ts
```

- [ ] **Step 3: Build**

Run: `bun run build`
Expected: build succeeds, 13 pages (no import errors).

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove dead ArticleCard/PostList/utils files"
```

---

### Task 8: Final verification (build + browser)

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

Run: `bun run build`
Expected: build succeeds, 13 pages, no warnings about glass tokens.

- [ ] **Step 2: Start preview server**

Run: `bun run preview`
Expected: server on `localhost:4321`.

- [ ] **Step 3: Browser acceptance checklist**

Verify in the browser (golden path + edge cases):
- Home page: gradient background visible, article cards read as frosted glass.
- A post page: three-column layout — sidebar/minimap/content all glass; long-form Markdown stays legible against the gradient (content-wrapper uses the stronger opacity).
- Dark mode (toggle OS appearance): gradient + glass switch to dark variants; text legible.
- Language switcher: zh ↔ en still works.
- Bottom buttons: glassy, hover lift works.
- Mobile width (≤768px): bottom buttons row, popup sidebar/minimap render as glass panels.
- Keyboard tab: focus ring visible on links/buttons.

If anything looks broken, fix in the relevant task's file and rebuild before proceeding.

- [ ] **Step 4: Confirm no dead-file regressions**

Run: `grep -rn "ArticleCard\|PostList\|components/utils" src/`
Expected: no matches.

- [ ] **Step 5: Finish the branch**

REQUIRED SUB-SKILL: Use superpowers:finishing-a-development-branch to verify state and choose merge/push/keep/discard.
