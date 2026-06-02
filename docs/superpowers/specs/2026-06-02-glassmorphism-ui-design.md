# Glassmorphism UI Redesign — Design

**Date:** 2026-06-02
**Status:** Approved
**Scope:** Subsystem A visual layer only. No content, routing, or build changes.

## Goal

Make the bilingual blog's UI more beautiful by adopting a **glassmorphism** visual style: frosted-glass surfaces floating over a static gradient background, in both light and dark themes, using **CSS only** (Zero-JS preserved).

## Approach

**Approach A — token-driven.** Add a small set of `--glass-*` design tokens plus a `--gradient-bg` token to the existing token system (`tokens.css` for light, `dark.css` for dark). Then change the surface declarations in `base.css` (and the mobile-popup rules in `responsive.css`, and the `.article-card` in `Home.astro`) to consume those tokens.

Rejected alternatives:
- **Approach B (override layer):** a separate glass stylesheet layered on top — creates two sources of truth and fights the existing token system.
- **Approach C (full rewrite):** discards working CSS, high regression risk for no benefit.

Changes stay localized to token definitions + surface declarations. Light/dark stays a single source of truth (surfaces read tokens; `dark.css` overrides the token values inside its media query).

## Glass tokens

Add to `src/styles/tokens.css` `:root` (light):

```css
--gradient-bg: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 40%, #ecfeff 100%);
--glass-bg: rgba(255, 255, 255, 0.55);
--glass-bg-strong: rgba(255, 255, 255, 0.7);   /* header, content, popups */
--glass-border: rgba(255, 255, 255, 0.6);
--glass-blur: 16px;
--glass-shadow: 0 8px 32px rgba(31, 38, 135, 0.12);
```

Add to `src/styles/dark.css` `:root` override (dark):

```css
--gradient-bg: linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #0c1a2b 100%);
--glass-bg: rgba(30, 41, 59, 0.5);
--glass-bg-strong: rgba(30, 41, 59, 0.7);
--glass-border: rgba(148, 163, 184, 0.18);
--glass-blur: 16px;
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
```

## Surfaces

The gradient lives on `body` and shows through every glass surface:

```css
body {
  background: var(--gradient-bg);
  background-attachment: fixed;
  min-height: 100vh;
}
```

Surface conversions (background → glass token, add blur + glass border + glass shadow):

| Surface | Token | Notes |
| --- | --- | --- |
| `.site-header` | `--glass-bg-strong` | already has `blur(8px)`; bump to `var(--glass-blur)` |
| `.sidebar-content` | `--glass-bg` | + `--glass-shadow` |
| `.minimap-content` | `--glass-bg` | + `--glass-shadow` |
| `.content-wrapper` | `--glass-bg-strong` | main reading surface — higher opacity for long-form legibility |
| `.article-card` (Home.astro) | `--glass-bg` | hover keeps `translateY(-2px)`, shadow deepens to `--glass-shadow` |
| `.bottom-btn` | `--glass-bg-strong` | already glassy on mobile; unify via token |
| `.sidebar-container.mobile-visible` / `.minimap-container.mobile-visible` (responsive.css) | `--glass-bg-strong` | popup panels |

Each converted surface uses the pattern:

```css
background: var(--glass-bg);                 /* or --glass-bg-strong */
border: 1px solid var(--glass-border);
backdrop-filter: blur(var(--glass-blur));
-webkit-backdrop-filter: blur(var(--glass-blur));
box-shadow: var(--glass-shadow);
```

## Micro-interactions (CSS only)

- Hover lift on cards/buttons: `transform: translateY(-2px)` + shadow deepen, via existing `--transition-*`.
- `:focus-visible` ring on interactive elements for keyboard accessibility.
- No client JS added. The three existing interaction scripts are untouched.

## Robustness

**Dark mode:** no new code paths. Surfaces read `--glass-*` / `--gradient-bg`; `dark.css` overrides those token values inside `@media (prefers-color-scheme: dark)`. Same declarations, two themes.

**Print:** `print.css` already forces `background: white !important` / `color: black !important` and hides chrome. Glass is screen-only. No change needed.

**Backdrop-filter fallback:**

```css
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .site-header, .content-wrapper { background: var(--color-bg-primary); }
  .sidebar-content, .minimap-content, .bottom-btn { background: var(--color-bg-accent); }
}
```

Falls back to existing solid token colors — legible, just without blur.

**Reduced motion:**

```css
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; }
  .article-card:hover, .bottom-btn:hover { transform: none; }
}
```

## Cleanup

Delete 3 dead component files (confirmed unreferenced — only self-references in their own comments):
- `src/components/ArticleCard.astro`
- `src/components/PostList.astro`
- `src/components/utils.ts`

Folded into this work since we're touching the component/style layer.

## Out of scope

- The small game HTML page (subsystem B) — separate brainstorm/build cycle after this ships.
- Content, routing, i18n, build pipeline — untouched.

## Verification

- `bun run build` — clean build, same page count (13).
- Browser check: three-column layout, dark mode toggle (OS preference), markdown reading legibility against gradient, language switcher, mobile popups.
- Tech-debt scan stays CLEAN (3 dead files removed).
