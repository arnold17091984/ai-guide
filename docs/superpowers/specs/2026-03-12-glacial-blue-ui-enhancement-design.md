# Glacial Blue UI Enhancement Design

## Overview

Comprehensive UI/UX enhancement of the AI Guide educational platform. Apple-inspired minimalist aesthetic with rich animations powered by framer-motion, combined with UX improvements including mobile navigation, progress tracking, and scroll-driven interactions.

**Approach**: "Glacial Blue" — Apple Developer Docs aesthetic + Next.js Docs tech feel
**Priority**: Desktop-first, mobile-responsive (internal company use)
**Constraint**: No purple in color palette
**Dark mode**: `prefers-color-scheme` media query (existing, maintained — no manual toggle)
**New dependency**: `framer-motion`

---

## 0. Architectural Decisions

### Server/Client Component Boundary

Setup pages remain **React Server Components**. Animation wrappers (`ScrollFadeIn`, `PageHeader`, `HeroSection`) are thin `"use client"` components that accept `children` as props. Pattern:

```tsx
// Server Component (setup page)
<ScrollFadeIn>
  <StepCard>...server-rendered content...</StepCard>
</ScrollFadeIn>
```

This preserves RSC benefits (streaming, zero client JS for content) while enabling framer-motion animations at the wrapper level.

### Page Transitions

**No `AnimatePresence` for route changes.** Next.js App Router does not support clean exit animations via `AnimatePresence`. Instead, use CSS View Transitions API via `next.config.ts`:

```ts
experimental: { viewTransition: true }
```

This provides native fade transitions on route change without framer-motion overhead.

### CSS Variable Strategy

Replace existing `--background`/`--foreground` with the new token system (`--bg`, `--text-1`, etc.) via a single find-and-replace pass. No coexistence of old and new variables.

### Purple Color Migration

| Current Usage | Location | Replacement |
|---|---|---|
| `from-purple-500 to-indigo-600` | Claude Code card icon | `from-blue-500 to-cyan-600` |
| `from-violet-500 to-purple-500` | Agent Teams card icon | `from-cyan-500 to-blue-500` |
| `bg-purple-100 text-purple-700` | Advanced badge | `bg-teal-100 text-teal-700` (dark: `bg-teal-900/30 text-teal-400`) |
| `from-blue-500 to-purple-600` | Header logo gradient | `from-blue-500 to-cyan-500` |

**Blanket rule for remaining purple/violet usages:**
All `purple-*` and `violet-*` Tailwind classes across the entire codebase are replaced as follows:
- `purple-500` / `violet-500` → `blue-500`
- `purple-400` / `violet-400` → `cyan-400`
- `purple-600` / `indigo-600` → `cyan-600`
- `purple-100` / `purple-50` → `teal-100` / `teal-50`
- `purple-200` → `teal-200`
- `purple-700` → `teal-700`
- `purple-900/30` → `teal-900/30`
- `violet-500 to-purple-500` → `cyan-500 to-blue-500`
- `purple-500 to-violet-400` → `blue-500 to-cyan-400`
- `purple-500 to-indigo-500` → `blue-500 to-cyan-500`
- `bg-purple-600` (in translation JSON) → `bg-blue-600`
- `border-purple-200 bg-purple-50` (in translation JSON) → `border-teal-200 bg-teal-50`

This applies to all files: setup pages, components, and i18n message files (ko.json, en.json, ja.json).

### Mobile Navigation (Unified)

One mobile nav pattern: **hamburger icon in Header opens the MobileDrawer** (which contains sidebar navigation). No separate full-screen overlay menu. One trigger, one drawer.

### Progress Persistence

Visited pages stored in `localStorage` under key `ai-guide-visited`. Data shape: `string[]` of page paths (e.g., `["/setup/vscode", "/setup/claude-web"]`). Read on mount, written on each page visit.

---

## 1. Color System

### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#fafbff` | Page background |
| `--surface` | `#ffffff` | Cards, panels |
| `--surface-hover` | `#f0f4ff` | Card hover state |
| `--primary` | `#0071e3` | CTAs, links, active states |
| `--secondary` | `#06b6d4` | Accents, secondary actions |
| `--accent` | `#10b981` | Success, progress indicators |
| `--text-1` | `#1d1d1f` | Headings, primary text |
| `--text-2` | `#6e6e73` | Body, secondary text |
| `--border` | `#e5e7eb` | Dividers, card borders |

### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0a0f1e` | Page background (deep navy) |
| `--surface` | `#111827` | Cards, panels |
| `--surface-hover` | `#1a2236` | Card hover state |
| `--primary` | `#2997ff` | CTAs, links, active states |
| `--secondary` | `#22d3ee` | Accents |
| `--accent` | `#34d399` | Success, progress |
| `--text-1` | `#f5f5f7` | Headings |
| `--text-2` | `#a1a1a6` | Body text |
| `--border` | `#1f2937` | Dividers |

### Gradient Palette (per guide topic)

- Hero: `blue-600 -> cyan-500 -> emerald-400` (mesh gradient — implemented as 3 layered `radial-gradient` with offset positions, subtly animated via framer-motion `animate` cycling opacity)
- Card icons use: blue, cyan, teal, emerald, amber, rose families (no purple)

---

## 2. Typography

- **Font**: Geist (existing, maintained — clean like Apple SF Pro)
- **Hero heading**: `text-5xl font-bold tracking-tight` (48px)
- **Section heading**: `text-2xl font-semibold`
- **Body**: `text-base leading-relaxed` (16px)
- **Spacing**: Generous Apple-style. Section gaps `py-16` to `py-24`

---

## 3. Layout & Navigation

### Header

- Glassmorphism: `backdrop-blur-xl` + semi-transparent bg + gradient bottom border line
- Scroll response: height shrinks (`h-16` -> `h-14`), bg opacity increases
- Logo "AI" box: subtle animated glow effect
- Nav links: underline slide-in on hover
- Mobile: hamburger icon -> opens MobileDrawer (slide-in sidebar + overlay backdrop)

### Sidebar

- Progress indicator: vertical line on left side, visited pages glow
- Active state: left border slide-in + soft background glow
- Group headers: section subtitle fade-in
- Scroll tracking: `sticky` maintained, internal scroll for long menus
- Mobile: slide-in drawer from left + overlay backdrop

### Home Page

- **New Hero Section**:
  - Full-width mesh gradient background (blue -> cyan -> emerald)
  - Large heading + subtitle with stagger fade-in on load
  - Floating decorative dots/lines (framer-motion)
  - "Get Started" CTA button with hover glow
- **Card Grid**:
  - Hover: subtle 3D tilt + shadow expansion + border glow
  - Scroll: stagger fade-up (0.1s delay per card)
  - Icon: rotate/pulse animation on hover
  - Generous spacing between cards

### Guide Pages

- **Page Header**: gradient background banner + icon + title (hero-style)
- **StepCard**: timeline-style vertical line connecting steps
- **Scroll-driven**: each StepCard fades in + slides up when entering viewport

---

## 4. Motion & Animation System

### Principles (Apple HIG aligned)

- Duration: 0.3s - 0.6s
- Easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (natural Apple curve)
- Rule: meaningful motion only, no gratuitous decoration

### Shared Motion Token

```ts
const EASE_APPLE = [0.25, 0.46, 0.45, 0.94];
```

Defined once in `src/lib/motion.ts` and imported by all animated components.

### Animation Catalog

| Target | Trigger | Animation | Duration |
|--------|---------|-----------|----------|
| Hero heading | Page load | fade-up + blur dissolve (stagger 0.1s) | 0.6s |
| Hero decoration | Always | slow floating dots/gradient | 6s loop |
| Cards | Scroll | stagger fade-up (0.1s delay each) | 0.5s |
| Cards | Hover | translateY(-4px) + shadow expand + border glow | 0.3s |
| Cards | Tap (mobile) | scale(0.98) (replaces hover on touch devices) | 0.2s |
| Header | Scroll | height shrink + bg opacity change | 0.3s |
| Sidebar link | Hover/Active | left border slide-in (width 0->2px) | 0.2s |
| StepCard | Scroll | fade-in + slide-up | 0.5s |
| Step timeline | Scroll | line grows top-to-bottom | 0.4s |
| Page transition | Route change | CSS View Transitions (native fade) | 0.3s |
| CTA button | Hover | glow expand + scale(1.02) | 0.3s |
| Copy button | Click | morph to checkmark | 0.3s |
| Language switch | Click | active indicator slide | 0.2s |

### framer-motion Usage

- `motion.div` + `whileInView` — scroll-triggered fade-in
- `useScroll` + `useTransform` — header scroll response
- `staggerChildren` — card grid sequential reveal
- `whileTap` — mobile touch feedback (replaces hover on touch devices)
- Hero floating decoration animations

### Page Transitions (View Transitions API)

No framer-motion for route changes. Handled natively via `next.config.ts` `experimental.viewTransition`.

### Accessibility

- `prefers-reduced-motion`: all motion disabled for users who prefer it

---

## 5. Component Changes

### Existing Component Improvements

| Component | Changes |
|-----------|---------|
| **CodeBlock** | Dark bg (`#0a0f1e`), filename tab display, animated copy button |
| **TipBox** | Left icon + background gradient, fade-in on appear |
| **StepCard** | Timeline vertical line, gradient circle for step number, completion state |
| **OsSelector** | Sliding pill-shape active indicator, crossfade on switch |
| **FlowChart** | Animated connection lines, step pulse on hover |
| **CompareBox** | Card-lift style, Good/Bad icon animation |
| **GuideImage** | Click-to-zoom lightbox (overlay backdrop, close via click-outside/ESC/close-button, focus trap, `aria-modal`, body scroll lock, z-50 above header), skeleton -> fade-in on load |
| **ContentRenderer** | Adjust spacing between parsed blocks to match new design system, pass through ScrollFadeIn for code blocks |
| **Header** | Glassmorphism, scroll response, mobile hamburger menu |
| **Sidebar** | Progress line, animated active state, mobile drawer |
| **LanguageSwitcher** | Sliding active indicator |

### New Components

| Component | Purpose |
|-----------|---------|
| **ScrollFadeIn** | framer-motion `whileInView` wrapper for scroll-triggered fade-up |
| **GlassCard** | Glassmorphism card container (backdrop-blur + translucent + border glow) |
| **HeroSection** | Home page hero with mesh gradient + title + CTA |
| **PageHeader** | Guide page top gradient banner + icon + title |
| **MobileDrawer** | Mobile slide-in sidebar + overlay |
| **MotionTokens** (`src/lib/motion.ts`) | Shared easing curve, duration constants, reusable animation variants |
| **ProgressLine** | Sidebar vertical progress indicator |

---

## 6. Dependencies

- **Add**: `framer-motion` (only new package)
- **Keep**: All existing dependencies unchanged

---

## 7. Files Affected

### Modified
- `next.config.ts` — add `experimental.viewTransition`
- `src/app/globals.css` — CSS variables, base styles
- `src/app/[locale]/layout.tsx` — animation wrapper, mobile drawer integration
- `src/app/[locale]/page.tsx` — hero section, animated card grid
- `src/components/Header.tsx` — glassmorphism, scroll response, mobile menu
- `src/components/Sidebar.tsx` — progress line, animated states, mobile drawer
- `src/components/StepCard.tsx` — timeline design
- `src/components/CodeBlock.tsx` — dark theme, animated copy
- `src/components/TipBox.tsx` — gradient style
- `src/components/OsSelector.tsx` — pill indicator
- `src/components/FlowChart.tsx` — animated lines
- `src/components/CompareBox.tsx` — card lift
- `src/components/GuideImage.tsx` — zoom modal
- `src/components/LanguageSwitcher.tsx` — slide indicator
- All `src/app/[locale]/setup/*/page.tsx` — PageHeader + ScrollFadeIn integration

### New Files
- `src/lib/motion.ts` — shared motion tokens (easing, durations, variants)
- `src/components/ScrollFadeIn.tsx`
- `src/components/GlassCard.tsx`
- `src/components/HeroSection.tsx`
- `src/components/PageHeader.tsx`
- `src/components/MobileDrawer.tsx`
- `src/components/ProgressLine.tsx`

---

## 8. Badge i18n

Move hardcoded English badge labels (`"Beginner"`, `"Intermediate"`, etc.) to next-intl translation files under `common.badges.*` namespace. All three locales (ko/en/ja) to be updated.
