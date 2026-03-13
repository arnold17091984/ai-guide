# Terminal Native Redesign — Design Spec

**Date:** 2026-03-13
**Approach:** Terminal Native (Vercel / Raycast-inspired)
**Goal:** Transform the "2023 SaaS template" aesthetic into a sharp, developer-focused dark UI that matches Claude Code's terminal identity.

---

## 1. Design Principles

1. **Terminal-first identity** — The UI should feel like a developer tool, not a marketing site
2. **Monochrome + 1 accent** — Grayscale base with emerald green as the sole accent color
3. **Dark-default, light-available** — Dark mode is the primary design surface; light mode is maintained but secondary
4. **Sharp, not cute** — Reduced border-radius, no gradient overuse, no colored shadows
5. **Glass with restraint** — Glassmorphism is kept but tuned for dark backgrounds (lower opacity)
6. **Motion with purpose** — Remove decorative animations, add terminal-themed ones

---

## 2. Color System

### Token Migration Map

Old tokens are replaced globally. Use find-and-replace in this order:

| Old Token | New Token |
|-----------|-----------|
| `--bg` | `--bg-base` |
| `--surface` | `--bg-surface` |
| `--surface-hover` | `--bg-elevated` |
| `--primary` | `--accent` |
| `--secondary` | `--accent` (merge into single accent) |
| `--accent` | `--accent` (keep name, change value) |
| `--text-1` | `--text-1` (keep name, change value) |
| `--text-2` | `--text-2` (keep name, change value) |
| `--border` | `--border` (keep name, change value) |

New tokens added: `--bg-elevated`, `--bg-overlay`, `--border-hover`, `--text-3`, `--accent-hover`, `--accent-muted`, `--danger`, `--warning`, `--info`.

### Dark Mode (Default)

Mechanism: **class-based** (`<html class="dark">`). Default to `dark` class on `<html>` in layout.tsx. Theme toggle adds/removes the class and persists to `localStorage`. System preference is read on first visit only.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#0A0A0A` | Page background |
| `--bg-surface` | `#141414` | Cards, sections |
| `--bg-elevated` | `#1C1C1C` | Hover states, active items |
| `--bg-overlay` | `rgba(10,10,10,0.8)` | Modals, drawers |
| `--border` | `#262626` | Default borders |
| `--border-hover` | `#404040` | Hover borders |
| `--text-1` | `#FAFAFA` | Headings, emphasis |
| `--text-2` | `#A1A1AA` | Body text (zinc-400) |
| `--text-3` | `#52525B` | Muted text (zinc-600) |
| `--accent` | `#10B981` | Links, active state, success |
| `--accent-hover` | `#34D399` | Hover on accent elements |
| `--accent-muted` | `rgba(16,185,129,0.12)` | Badge backgrounds, subtle highlights |
| `--danger` | `#EF4444` | Error, delete |
| `--warning` | `#F59E0B` | Warning |
| `--info` | `#3B82F6` | Informational |

### Light Mode

| Token | Value |
|-------|-------|
| `--bg-base` | `#FAFAFA` |
| `--bg-surface` | `#FFFFFF` |
| `--bg-elevated` | `#F4F4F5` |
| `--bg-overlay` | `rgba(250,250,250,0.8)` |
| `--border` | `#E4E4E7` |
| `--border-hover` | `#D4D4D8` |
| `--text-1` | `#09090B` |
| `--text-2` | `#52525B` |
| `--text-3` | `#A1A1AA` |
| `--accent` | `#059669` |
| `--accent-hover` | `#10B981` |
| `--accent-muted` | `rgba(5,150,105,0.10)` |
| `--danger` | `#DC2626` |
| `--warning` | `#D97706` |
| `--info` | `#2563EB` |

---

## 3. Typography

| Element | Font | Size | Weight | Tracking | Color |
|---------|------|------|--------|----------|-------|
| h1 | Geist | text-4xl (36px) | bold | tight | --text-1 |
| h2 | Geist | text-2xl (24px) | semibold | tight | --text-1 |
| h3 | Geist | text-lg (18px) | semibold | normal | --text-1 |
| body | Geist | text-sm (14px) | normal | normal | --text-2 |
| caption | Geist | text-xs (12px) | normal | normal | --text-3 |
| code | Geist Mono | text-sm (14px) | normal | normal | --text-1 |
| mono-label | Geist Mono | text-xs (12px) | medium | wider | --text-3 |

**Font loading:** Add `Geist_Mono` from `next/font/google` alongside existing `Geist`. Expose as `--font-mono` CSS variable.

---

## 4. Spacing & Radius

### Border Radius

| Element | Before | After |
|---------|--------|-------|
| Card | rounded-2xl (16px) | rounded-lg (8px) |
| Button | rounded-2xl | rounded-md (6px) |
| Input | rounded-xl | rounded-md (6px) |
| Badge | rounded-full | rounded (4px) |
| Modal | rounded-2xl | rounded-lg (8px) |
| Avatar | rounded-full | rounded-full (keep) |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| shadow-sm | `0 1px 2px rgba(0,0,0,0.3)` | Subtle elevation |
| shadow-md | `0 4px 12px rgba(0,0,0,0.4)` | Cards on hover |
| shadow-lg | `0 8px 24px rgba(0,0,0,0.5)` | Modals, dropdowns |
| shadow-glow | `0 0 20px rgba(16,185,129,0.15)` | Accent glow — ONLY on: GlassCard hover, unlocked AchievementCard, active sidebar item |

All existing colored shadows (`shadow-blue-500/15`, `shadow-cyan-500/10`) are replaced with neutral or accent glow.

---

## 5. Layout

### Header

- Height: `h-14` fixed (no dynamic padding on scroll)
- Background: `bg-[--bg-base]/80 backdrop-blur-xl`
- Border: `border-b border-[--border]` (solid, no gradient)
- Logo: `font-mono` text — "ai" in `--text-3`, "-guide" in `--accent`
- Right side: Theme toggle, user avatar (logged in) or sign-in button
- Top nav links (Home, Knowledge, Skills, CLAUDE.md): **removed** — all navigation lives in sidebar and mobile drawer
- Search: Existing `SearchBar.tsx` component moves into header, restyled with `bg-[--bg-surface] border border-[--border] rounded-md` and ⌘K keyboard hint badge. Opens as modal/popover on click (existing behavior maintained).
- Theme toggle: Sun/moon icon button. `Ghost` button style. Toggles `dark` class on `<html>` and saves to `localStorage`.
- Scroll behavior: no dynamic changes (static header)

### Sidebar

- Width: `w-60`
- Background: `bg-[--bg-base]`
- Border: `border-r border-[--border]`
- Padding: `py-4 px-3`

**Section headers:**
- `text-xs font-mono uppercase tracking-wider text-[--text-3]`
- Clickable with chevron `▸`/`▾` for expand/collapse
- Default: all sections expanded

**Nav items:**
- `h-8 px-2 rounded-md text-sm text-[--text-2]`
- Hover: `bg-[--bg-elevated] text-[--text-1]`
- Active: `bg-[--accent-muted] text-[--accent] font-medium` + 2px left accent bar

**Progress indicators:**
- Visited: `✓` checkmark in `--accent`
- Unvisited: `○` circle in `--text-3`
- Progress bar: solid `bg-[--accent]` (no gradient)
- State: continues using existing `useProgressLine` hook — no changes to progress logic

**Groups:** Platform, Getting Started, Core Skills, Advanced (unchanged structure)

### Mobile Drawer

- Trigger: hamburger icon with open/close animation (hamburger → X morph)
- Overlay: `bg-black/60 backdrop-blur-sm`
- Drawer: same styling as sidebar, slides from left
- Contains all navigation (same as sidebar) — mobile users access everything through drawer
- Animation: 0.3s ease maintained

### Main Content

- `flex-1 max-w-5xl mx-auto px-6 py-8`
- No changes to content width strategy

---

## 6. Components

### GlassCard

```
Before: bg-white/70 backdrop-blur-xl rounded-2xl
        hover: y:-6, gradient overlay, colored shadow

After:  bg-white/[0.03] backdrop-blur-xl rounded-lg
        border border-[--border]
        hover: border-[--border-hover] bg-white/[0.05]
               translateY(-2px)
               shadow-glow (accent, subtle)
        No gradient overlay. No colored shadow.
```

### Buttons

| Variant | Style |
|---------|-------|
| Primary | `bg-[--accent] text-black font-medium rounded-md h-9 px-4` hover: `bg-[--accent-hover]` |
| Secondary | `bg-transparent border border-[--border] text-[--text-1] rounded-md` hover: `bg-[--bg-elevated]` |
| Ghost | `bg-transparent text-[--text-2]` hover: `text-[--text-1] bg-[--bg-elevated]` |
| Danger | `bg-transparent border border-red-500/30 text-red-400` hover: `bg-red-500/10` |

### Badges

All badges use: `rounded px-2 py-0.5 text-xs font-mono`

| Type | Colors |
|------|--------|
| Category | `bg-[--accent-muted] text-[--accent]` |
| Difficulty | `bg-amber-500/10 text-amber-400` |
| Status | `bg-blue-500/10 text-blue-400` |
| Priority Critical | `bg-red-500/10 text-red-400` + ping animation |
| Priority High | `bg-orange-500/10 text-orange-400` |
| Priority Medium | `bg-amber-500/10 text-amber-400` |
| Priority Low | `bg-zinc-500/10 text-zinc-400` |

### PageHeader

```
Before: Full-width gradient background + white text + frosted icon badge + heroBlurIn

After:  No background color (inherits --bg-base)
        Icon + title (text-[--text-1] font-bold)
        Subtitle (text-[--text-2])
        border-b border-[--border] separator
        Animation: fadeUp only (no blur)
```

### Forms

| Element | Style |
|---------|-------|
| Input/Textarea | `bg-[--bg-surface] border border-[--border] rounded-md text-[--text-1]` focus: `border-[--accent] ring-1 ring-[--accent]/20` |
| Select | Same as input + custom chevron |
| Label | `text-sm font-medium text-[--text-1]` |
| Helper text | `text-xs text-[--text-3]` |

### Code Blocks

```
Container: bg-[--bg-surface] border border-[--border] rounded-lg overflow-hidden
Header:    bg-[--bg-elevated] border-b border-[--border] px-4 py-2
           filename in text-xs font-mono text-[--text-3]
Body:      px-4 py-3 font-mono text-sm
Syntax:    keyword → text-[--accent]
           string → text-amber-400
           comment → text-[--text-3] italic
           number → text-blue-400
```

### Tables / Lists

```
Header:  text-xs uppercase tracking-wider text-[--text-3] font-mono
Row:     border-b border-[--border]
         hover: bg-[--bg-elevated]
         text-sm, numeric data in font-mono
```

### Achievement Cards

```
Before: Colored gradient backgrounds + glow shadows per tier

After:  bg-[--bg-surface] border border-[--border] rounded-lg
        Tier indicator: left border accent (2px)
          bronze: border-l-amber-700
          silver: border-l-zinc-400
          gold: border-l-amber-400
          platinum: border-l-emerald-400
        Locked: opacity-50 grayscale
        Unlocked: normal opacity + shadow-glow
        Progress bar: bg-[--accent] (solid)
```

### Loading States

- Spinner: Keep SVG-based, change gradient to `--accent`
- Skeleton: `bg-[--bg-elevated] animate-pulse rounded-md`

### Error / Not Found / Loading Pages

- `error.tsx`: `bg-[--bg-base]`, danger accent for error icon, retry button in `Secondary` style
- `not-found.tsx`: `bg-[--bg-base]`, `--text-2` for message, link in `--accent`
- `loading.tsx`: centered `LoadingSpinner` on `bg-[--bg-base]`

---

## 7. Hero Section (Top Page)

### Unauthenticated View

Hero text uses existing i18n keys (`hero.title`, `hero.subtitle`, `hero.cta`, `hero.exploreCta`). Update the values in all 3 locale files.

Terminal command examples (hardcoded, not i18n):
1. `claude "プロジェクトのREADMEを書いて"` → ✓ README.md を生成しました / ✓ プロジェクト構造を分析 / ✓ 3つのセクションを作成
2. `claude "このバグを修正して"` → ✓ エラーログを分析 / ✓ 根本原因を特定 / ✓ パッチを適用
3. `claude "/review-pr 42"` → ✓ PR #42 を取得 / ✓ 変更差分を分析 / ✓ レビューコメントを作成

```
Structure:
  1. Headline: text-4xl font-bold tracking-tight text-[--text-1]
     {t("hero.title")}

  2. Subtitle: text-lg text-[--text-2] mt-4
     {t("hero.subtitle")}

  3. Terminal Window: mt-8
     - Title bar: bg-[--bg-elevated] rounded-t-lg border border-[--border]
       Three dots (red/yellow/green) + "claude" filename in text-xs font-mono
     - Body: bg-[--bg-surface] rounded-b-lg border-x border-b border-[--border]
       font-mono text-sm p-4
     - Content: Typing animation showing Claude Code command + results
       - Prompt "⟩" in --accent
       - Command types out at 40ms/char
       - Results fade in line-by-line with ✓ prefix in --accent
       - Blinking cursor █ at end (0.8s interval)
     - Cycles through 3 command examples every 8 seconds

  4. CTA buttons: mt-6 flex gap-3
     [始める →] Primary
     [スキルを探す] Secondary

  5. Stats bar: mt-8 border-t border-[--border] pt-4
     "127 スキル • 1.2K ユーザー • 340 記事"
     text-sm text-[--text-3] font-mono
```

### Authenticated View

```
Replace hero with:
  "{t('hero.welcomeBack', { name: username })}" text-2xl font-semibold
  3 mini stat cards (inline): 投稿数 / レピュテーション / 通知
  Then DashboardWidgets below
```

Note: `hero.welcomeBack` is a new i18n key needed in all 3 locales.

---

## 8. Animation Policy

### Keep (restyle)
- `fadeUp`: opacity 0→1 + translateY 20→0. Change to `DURATION.normal` (0.3s), currently `DURATION.medium` (0.5s)
- `staggerContainer`: change `staggerChildren` from 0.1 to 0.08
- `whileHover`: translateY(-2px) on cards (reduced from -6px)
- `whileTap`: scale(0.98)
- `ScrollFadeIn`: whileInView with once:true

### Remove
- `heroBlurIn` (blur(10px) effect)
- Animated mesh gradient orbs (3 floating blobs)
- Colored shadow animations
- Gradient overlay fade on card hover
- Dynamic header height/shadow on scroll

### Add
- Terminal typing animation (hero): 40ms per character, line-by-line result reveal
- Cursor blink: `█` opacity toggle at 0.8s
- Sidebar section expand/collapse: height animation with framer-motion `AnimatePresence`
- Hamburger → X morph animation on mobile

---

## 9. Files to Modify

### Phase 1: Foundation (CSS variables + fonts + layout)

| # | File | Changes |
|---|------|---------|
| 1 | `src/app/globals.css` | Replace all CSS custom properties (see token migration map). Dark mode via `.dark` selector. Tailwind v4 CSS-based config (`@theme` block) — no tailwind.config.ts needed. |
| 2 | `src/app/[locale]/layout.tsx` | Add Geist Mono font, `<html class="dark">` default, expose `--font-mono` |
| 3 | `src/components/Header.tsx` | Remove top nav links, add search bar + theme toggle, simplify styling |
| 4 | `src/components/Sidebar.tsx` | VS Code-style collapsible sections, new active states, progress indicator restyle |
| 5 | `src/components/MobileDrawer.tsx` | Match new sidebar styling, hamburger→X animation |
| 6 | `src/lib/motion.ts` | Remove heroBlurIn, update fadeUp to 0.3s, stagger to 0.08s, add terminal animations |

### Phase 2: Shared Components (all 60 components)

| # | File | Changes |
|---|------|---------|
| 7 | `src/components/GlassCard.tsx` | New dark glass style, reduced hover |
| 8 | `src/components/PageHeader.tsx` | Remove gradient background, simplify |
| 9 | `src/components/ScrollFadeIn.tsx` | Remove blur from animation |
| 10 | `src/components/ReputationBadge.tsx` | Monochrome + accent colors |
| 11 | `src/components/PriorityBadge.tsx` | New badge pattern |
| 12 | `src/components/AchievementCard.tsx` | Left-border tier indicator, remove glow |
| 13 | `src/components/DebtStatsBar.tsx` | Update colors |
| 14 | `src/components/DebtItemCard.tsx` | Update card style |
| 15 | `src/components/PackageCard.tsx` | Update card style |
| 16 | `src/components/PackageSkillList.tsx` | Update list style |
| 17 | `src/components/PackageInstallBlock.tsx` | Update code block style |
| 18 | `src/components/TeamCard.tsx` | Update card style |
| 19 | `src/components/TeamMemberRow.tsx` | Update row style |
| 20 | `src/components/InviteModal.tsx` | Update modal style |
| 21 | `src/components/CommentSection.tsx` | Update form/button styles |
| 22 | `src/components/KnowledgeEntryForm.tsx` | Update form styles |
| 23 | `src/components/ProfileEditForm.tsx` | Update form styles |
| 24 | `src/components/SkillUploadForm.tsx` | Update form styles |
| 25 | `src/components/ValidateOnlyForm.tsx` | Update form styles |
| 26 | `src/components/NotificationBell.tsx` | Update dropdown style |
| 27 | `src/components/HeroStats.tsx` | Rewrite to stats bar |
| 28 | `src/components/HeroStatsClient.tsx` | Merge into HeroStats or delete if redundant |
| 29 | `src/components/HomeDashboard.tsx` | Update widget styles |
| 30 | `src/components/DashboardWidget.tsx` | Update card/skeleton style |
| 31 | `src/components/LoadingSpinner.tsx` | Change colors to accent |
| 32 | `src/components/KnowledgeCard.tsx` | Update card style |
| 33 | `src/components/SkillCard.tsx` | Update card style |
| 34 | `src/components/CaseStudyCard.tsx` | Update card style |
| 35 | `src/components/TrendingCard.tsx` | Update card style |
| 36 | `src/components/DigestCard.tsx` | Update card style |
| 37 | `src/components/UserCard.tsx` | Update card style |
| 38 | `src/components/StatCard.tsx` | Update card style |
| 39 | `src/components/ActivityItem.tsx` | Update item style |
| 40 | `src/components/LeaderboardRow.tsx` | Update row style |
| 41 | `src/components/SourceBadge.tsx` | Update badge style |
| 42 | `src/components/SearchBar.tsx` | Restyle for header placement |
| 43 | `src/components/SearchResult.tsx` | Update result card style |
| 44 | `src/components/VoteButton.tsx` | Update button style |
| 45 | `src/components/StarButton.tsx` | Update button style |
| 46 | `src/components/ScoreGauge.tsx` | Update colors |
| 47 | `src/components/ProgressRing.tsx` | Update colors |
| 48 | `src/components/StepCard.tsx` | Update card style |
| 49 | `src/components/CodeBlock.tsx` | Update to new code block spec |
| 50 | `src/components/TipBox.tsx` | Update accent colors |
| 51 | `src/components/CompareBox.tsx` | Update border/bg |
| 52 | `src/components/FlowChart.tsx` | Update colors |
| 53 | `src/components/MarkdownEditor.tsx` | Update form style |
| 54 | `src/components/SuggestedEditCard.tsx` | Update card style |
| 55 | `src/components/ClaudeMdResults.tsx` | Update results style |
| 56 | `src/components/ValidationResults.tsx` | Update results style |
| 57 | `src/components/AuthButton.tsx` | Update button style |
| 58 | `src/components/LanguageSwitcher.tsx` | Update dropdown style |
| 59 | `src/components/ProfileEditToggle.tsx` | Update toggle style |
| 60 | `src/components/SkipToContent.tsx` | Update focus ring to accent |
| 61 | `src/components/OsSelector.tsx` | Update selector style |
| 62 | `src/components/GuideImage.tsx` | Update border/shadow |
| 63 | `src/components/ContentRenderer.tsx` | Update prose styles |

### Phase 3: Hero & Home

| # | File | Changes |
|---|------|---------|
| 64 | `src/components/HeroSection.tsx` | Full rewrite: terminal window + typing animation |
| 65 | `src/app/[locale]/page.tsx` | Compose new hero + dashboard |
| 66 | `src/messages/en.json` | Update hero i18n values, add `hero.welcomeBack` |
| 67 | `src/messages/ko.json` | Same |
| 68 | `src/messages/ja.json` | Same |

### Phase 4: Page-level Polish (all pages)

| # | File |
|---|------|
| 69 | `src/app/[locale]/knowledge/page.tsx` |
| 70 | `src/app/[locale]/knowledge/new/page.tsx` |
| 71 | `src/app/[locale]/knowledge/[slug]/page.tsx` |
| 72 | `src/app/[locale]/knowledge/[slug]/edit/page.tsx` |
| 73 | `src/app/[locale]/knowledge/[slug]/history/page.tsx` |
| 74 | `src/app/[locale]/knowledge/debt/page.tsx` |
| 75 | `src/app/[locale]/knowledge/debt/[id]/page.tsx` |
| 76 | `src/app/[locale]/knowledge/debt/new/page.tsx` |
| 77 | `src/app/[locale]/skills/page.tsx` |
| 78 | `src/app/[locale]/skills/[id]/page.tsx` |
| 79 | `src/app/[locale]/skills/upload/page.tsx` |
| 80 | `src/app/[locale]/skills/validate/page.tsx` |
| 81 | `src/app/[locale]/skills/packages/page.tsx` |
| 82 | `src/app/[locale]/skills/packages/[slug]/page.tsx` |
| 83 | `src/app/[locale]/skills/packages/new/page.tsx` |
| 84 | `src/app/[locale]/teams/page.tsx` |
| 85 | `src/app/[locale]/teams/new/page.tsx` |
| 86 | `src/app/[locale]/teams/[slug]/page.tsx` |
| 87 | `src/app/[locale]/teams/[slug]/settings/page.tsx` + `settings-client.tsx` |
| 88 | `src/app/[locale]/teams/invite/[token]/page.tsx` + `InviteActions.tsx` |
| 89 | `src/app/[locale]/case-studies/page.tsx` |
| 90 | `src/app/[locale]/case-studies/new/page.tsx` |
| 91 | `src/app/[locale]/case-studies/[slug]/page.tsx` |
| 92 | `src/app/[locale]/trending/page.tsx` + `TrendingFeedClient.tsx` |
| 93 | `src/app/[locale]/trending/bookmarks/page.tsx` |
| 94 | `src/app/[locale]/community/page.tsx` |
| 95 | `src/app/[locale]/community/achievements/page.tsx` |
| 96 | `src/app/[locale]/community/activity/page.tsx` + `ActivityFeedClient.tsx` |
| 97 | `src/app/[locale]/community/layout.tsx` |
| 98 | `src/app/[locale]/digest/page.tsx` |
| 99 | `src/app/[locale]/profile/page.tsx` |
| 100 | `src/app/[locale]/notifications/page.tsx` + `NotificationsClient.tsx` |
| 101 | `src/app/[locale]/search/page.tsx` + `SearchResultsClient.tsx` |
| 102 | `src/app/[locale]/claude-md/page.tsx` |
| 103 | `src/app/[locale]/users/[username]/page.tsx` + sub-components |
| 104-114 | `src/app/[locale]/setup/*.tsx` (11 setup pages) |
| 115 | `src/app/[locale]/error.tsx` |
| 116 | `src/app/[locale]/not-found.tsx` |
| 117 | `src/app/[locale]/loading.tsx` |

---

## 10. Migration Strategy

### Phase 1: Foundation (Files 1-6)
Change the design tokens, fonts, header, sidebar, motion presets. This immediately transforms the feel. ~80% of the visual change comes from this phase via CSS variable cascade.

### Phase 2: Shared Components (Files 7-63)
Update all shared components to use new tokens/patterns. Many will be simple class replacements (rounded-2xl → rounded-lg, gradient → solid). Parallelizable — components are independent.

### Phase 3: Hero & Home (Files 64-68)
Build the new terminal hero section. Update i18n values.

### Phase 4: Page-level Polish (Files 69-117)
Update individual pages. Most changes are minor (removing inline color overrides that clash with new tokens). Highly parallelizable.

### Phase 5: Verification
- `npx tsc --noEmit` — zero errors
- `npx next build` — successful build
- Visual check: all pages render correctly in dark and light mode

---

## 11. Out of Scope

- No structural changes to routing or data fetching
- No new features or pages
- No database changes
- No changes to auth flow or API routes
- i18n changes are limited to hero text values and `hero.welcomeBack` key only
