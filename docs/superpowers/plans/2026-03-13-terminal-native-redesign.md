# Terminal Native Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the AI Guide UI from a "2023 SaaS template" look into a sharp, dark-first, terminal-native developer aesthetic (Vercel/Raycast-inspired).

**Architecture:** CSS-variable-driven redesign. Phase 1 rewrites globals.css tokens + layout components to cascade ~80% of the visual change. Phases 2-4 are mechanical class replacements in components and pages. No routing/data/API changes.

**Tech Stack:** Next.js 16, Tailwind CSS v4 (CSS-based config), Framer Motion 12, Geist + Geist Mono fonts, next-intl

**Spec:** `docs/superpowers/specs/2026-03-13-terminal-native-redesign.md`

---

## Chunk 1: Foundation (Phase 1)

This chunk delivers ~80% of the visual transformation. After completion, the entire app should look dramatically different via CSS variable cascade.

### Task 1: Rewrite CSS Design Tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css with new token system**

Replace the entire file. Switch from `@media (prefers-color-scheme)` to class-based `.dark` selector. Dark values are the `:root` defaults. Light mode is `.light` override.

```css
@import "tailwindcss";

/* ============================================================
   Terminal Native Design System
   Dark-first, class-based theming
   ============================================================ */

:root {
  /* Background */
  --bg-base: #0A0A0A;
  --bg-surface: #141414;
  --bg-elevated: #1C1C1C;
  --bg-overlay: rgba(10, 10, 10, 0.8);

  /* Border */
  --border: #262626;
  --border-hover: #404040;

  /* Text */
  --text-1: #FAFAFA;
  --text-2: #A1A1AA;
  --text-3: #52525B;

  /* Accent (emerald) */
  --accent: #10B981;
  --accent-hover: #34D399;
  --accent-muted: rgba(16, 185, 129, 0.12);

  /* Semantic */
  --danger: #EF4444;
  --warning: #F59E0B;
  --info: #3B82F6;

  /* Legacy aliases — keep temporarily for gradual migration */
  --bg: var(--bg-base);
  --surface: var(--bg-surface);
  --surface-hover: var(--bg-elevated);
  --primary: var(--accent);
  --secondary: var(--accent);
}

.light {
  --bg-base: #FAFAFA;
  --bg-surface: #FFFFFF;
  --bg-elevated: #F4F4F5;
  --bg-overlay: rgba(250, 250, 250, 0.8);
  --border: #E4E4E7;
  --border-hover: #D4D4D8;
  --text-1: #09090B;
  --text-2: #52525B;
  --text-3: #A1A1AA;
  --accent: #059669;
  --accent-hover: #10B981;
  --accent-muted: rgba(5, 150, 105, 0.10);
  --danger: #DC2626;
  --warning: #D97706;
  --info: #2563EB;

  /* Legacy aliases */
  --bg: var(--bg-base);
  --surface: var(--bg-surface);
  --surface-hover: var(--bg-elevated);
  --primary: var(--accent);
  --secondary: var(--accent);
}

body {
  background: var(--bg-base);
  color: var(--text-1);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Note: Legacy aliases (`--bg`, `--surface`, `--primary`, etc.) map to new tokens so existing components don't break immediately. They'll be cleaned up in Phase 2.

- [ ] **Step 2: Verify the CSS loads**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): rewrite CSS tokens for Terminal Native dark-first theme"
```

### Task 2: Add Geist Mono Font + Dark Default in Layout

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Add Geist_Mono font and dark class**

```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SkipToContent from "@/components/SkipToContent";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Guide - Claude Code Platform",
  description: "Collaborative AI knowledge platform for Claude Code",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased bg-(--bg-base) text-(--text-1)`}
      >
        <SkipToContent />
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col overflow-x-hidden">
            <Header />
            <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
              <Sidebar />
              <main id="main-content" className="min-w-0 flex-1">
                {children}
              </main>
            </div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

Key changes: Added `Geist_Mono` import, `className="dark"` on `<html>`, `suppressHydrationWarning` for theme toggle hydration, `--font-mono` variable.

- [ ] **Step 2: Commit**

```bash
git add "src/app/[locale]/layout.tsx"
git commit -m "feat(design): add Geist Mono font, dark mode default"
```

### Task 3: Redesign Header

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Rewrite Header component**

Remove: scroll detection, dynamic padding, top nav links, gradient border, blue gradient logo.
Add: static h-14, monospace logo, theme toggle, clean border.

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import AuthButton from "./AuthButton";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileDrawer from "./MobileDrawer";
import NotificationBell from "./NotificationBell";
import SearchBar from "./SearchBar";
import { useAuth } from "@/hooks/useAuth";

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") {
      setTheme("light");
      document.documentElement.classList.replace("dark", "light");
    }
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.replace(theme, next);
    localStorage.setItem("theme", next);
  };

  return (
    <button
      onClick={toggle}
      className="rounded-md p-2 text-(--text-2) hover:bg-(--bg-elevated) hover:text-(--text-1) transition-colors"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export default function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-(--border) bg-(--bg-base)/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-(--text-2) hover:bg-(--bg-elevated) lg:hidden"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 font-mono text-lg">
            <span className="text-(--text-3)">ai</span>
            <span className="text-(--accent)">-guide</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <SearchBar />
            <ThemeToggle />
            <LanguageSwitcher />
            {user && <NotificationBell userId={user.id} />}
            <AuthButton />
          </div>
        </div>
      </header>

      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat(design): redesign Header — monospace logo, theme toggle, remove nav links"
```

### Task 4: Redesign Sidebar (VS Code-style Collapsible)

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Read current Sidebar to understand structure**

Read `src/components/Sidebar.tsx` fully to understand the existing group/item structure and progress tracking logic.

- [ ] **Step 2: Rewrite Sidebar with collapsible sections**

Key changes:
- Replace colored dots (green/blue/gray) with `✓` / `○` characters
- Section headers: `text-xs font-mono uppercase tracking-wider text-(--text-3)` with clickable expand/collapse
- Nav items: `h-8 px-2 rounded-md text-sm` with 2px left accent bar on active
- Progress bar: solid emerald, no gradient
- Use framer-motion `AnimatePresence` + `motion.div` for section collapse animation
- Track collapsed state in `useState` with all sections expanded by default

Styling patterns for each element:
```
Section header: flex items-center justify-between px-2 py-1.5 cursor-pointer
  text: text-xs font-mono uppercase tracking-wider text-(--text-3)
  chevron: h-3 w-3 text-(--text-3) transition-transform (rotate-90 when expanded)

Nav item (default): flex items-center gap-2 h-8 px-2 rounded-md text-sm text-(--text-2) hover:bg-(--bg-elevated) hover:text-(--text-1)
Nav item (active): bg-(--accent-muted) text-(--accent) font-medium + border-l-2 border-(--accent)

Progress indicator: ✓ in text-(--accent) for visited, ○ in text-(--text-3) for unvisited

Progress bar wrapper: h-1 rounded-full bg-(--bg-elevated)
Progress bar fill: h-1 rounded-full bg-(--accent)
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat(design): VS Code-style collapsible Sidebar with accent indicators"
```

### Task 5: Update MobileDrawer

**Files:**
- Modify: `src/components/MobileDrawer.tsx`

- [ ] **Step 1: Update MobileDrawer styling to match new Sidebar**

Key changes:
- Overlay: `bg-black/60 backdrop-blur-sm`
- Drawer panel: `bg-(--bg-base) border-r border-(--border)`
- Reuse same nav item styling as Sidebar
- All navigation items must be present (same as sidebar)

- [ ] **Step 2: Commit**

```bash
git add src/components/MobileDrawer.tsx
git commit -m "feat(design): update MobileDrawer to match new Sidebar"
```

### Task 6: Update Motion Presets

**Files:**
- Modify: `src/lib/motion.ts`

- [ ] **Step 1: Rewrite motion.ts**

```typescript
// src/lib/motion.ts
export const EASE_APPLE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export const DURATION = {
  fast: 0.2,
  normal: 0.3,
  medium: 0.5,
  slow: 0.6,
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE_APPLE },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.normal, ease: EASE_APPLE },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

// Terminal typing animation helpers
export const terminalLine = {
  hidden: { opacity: 0, x: -4 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.fast, ease: EASE_APPLE },
  },
};
```

Removed: `heroBlurIn`. Changed: `fadeUp` duration 0.5→0.3, `staggerChildren` 0.1→0.08. Added: `terminalLine`.

- [ ] **Step 2: Find and update all imports of heroBlurIn**

Search for `heroBlurIn` across the codebase. Replace with `fadeUp` in all usages.

Run: `grep -r "heroBlurIn" src/ --include="*.tsx" --include="*.ts" -l`

For each file found, replace `heroBlurIn` import and usage with `fadeUp`.

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && echo "OK"`
Expected: OK

- [ ] **Step 4: Commit**

```bash
git add src/lib/motion.ts
git add -u  # any files that changed heroBlurIn imports
git commit -m "feat(design): update motion presets — faster fadeUp, remove heroBlurIn"
```

### Task 7: Build Terminal Hero Section

**Files:**
- Modify: `src/components/HeroSection.tsx`

- [ ] **Step 1: Rewrite HeroSection as terminal window**

Full rewrite. Remove: mesh gradient orbs, blur-in animation, gradient CTA button.
Add: Terminal window with typing animation, minimal CTA, stats bar.

The component should:
1. Accept props: `title`, `subtitle`, `ctaText`, `ctaHref`, `exploreCta`, `exploreHref`, `stats` (optional)
2. Render a terminal window with title bar (3 dots + "claude" label)
3. Cycle through 3 command examples with typing animation (40ms/char)
4. Show results line-by-line with `✓` prefix
5. Blinking cursor `█` at end

Terminal commands (hardcoded):
```
const COMMANDS = [
  {
    input: 'claude "プロジェクトのREADMEを書いて"',
    output: ["README.md を生成しました", "プロジェクト構造を分析", "3つのセクションを作成"],
  },
  {
    input: 'claude "このバグを修正して"',
    output: ["エラーログを分析", "根本原因を特定", "パッチを適用"],
  },
  {
    input: 'claude "/review-pr 42"',
    output: ["PR #42 を取得", "変更差分を分析", "レビューコメントを作成"],
  },
];
```

Styling:
- Terminal title bar: `bg-(--bg-elevated) rounded-t-lg border border-(--border) px-4 py-2 flex items-center gap-2`
- Three dots: `h-3 w-3 rounded-full` in `bg-red-500`, `bg-yellow-500`, `bg-green-500`
- Terminal body: `bg-(--bg-surface) rounded-b-lg border-x border-b border-(--border) p-4 font-mono text-sm min-h-[200px]`
- Prompt `⟩`: `text-(--accent)`
- Result `✓`: `text-(--accent)`
- Cursor `█`: `inline-block animate-pulse text-(--accent)`
- CTA Primary: `bg-(--accent) text-black font-medium rounded-md h-9 px-4`
- CTA Secondary: `border border-(--border) text-(--text-1) rounded-md h-9 px-4`

- [ ] **Step 2: Update home page to pass new props if needed**

Read `src/app/[locale]/page.tsx` and adjust HeroSection usage if the props changed.

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && echo "OK"`

- [ ] **Step 4: Commit**

```bash
git add src/components/HeroSection.tsx "src/app/[locale]/page.tsx"
git commit -m "feat(design): terminal-style hero with typing animation"
```

### Task 8: Foundation Verification

- [ ] **Step 1: Full build check**

Run: `npx next build 2>&1 | tail -10`
Expected: Build succeeds with all routes.

- [ ] **Step 2: Commit all remaining changes**

If any files were missed, stage and commit them.

---

## Chunk 2: Shared Components (Phase 2)

Mechanical updates to all 57 shared components. The pattern is consistent: replace old color references, reduce border-radius, remove gradients/colored shadows, use new tokens.

**Strategy:** These components are independent. Use parallel subagents — split into batches of ~15 components each.

### Task 9: Component Batch A — Core UI Primitives (15 components)

**Files:** GlassCard, PageHeader, ScrollFadeIn, ReputationBadge, PriorityBadge, AchievementCard, LoadingSpinner, DashboardWidget, StatCard, ProgressRing, ScoreGauge, SkipToContent, OsSelector, GuideImage, ContentRenderer

- [ ] **Step 1: Update each component following these patterns**

For EVERY component in this batch, apply these transformations:

| Find | Replace |
|------|---------|
| `rounded-2xl` | `rounded-lg` |
| `rounded-xl` (on cards) | `rounded-lg` |
| `rounded-full` (on badges, not avatars) | `rounded` |
| `bg-linear-to-*` (gradient backgrounds) | solid color from tokens |
| `shadow-*-500/*` (colored shadows) | remove, or replace with `shadow-[0_0_20px_rgba(16,185,129,0.15)]` on hover only |
| `from-blue-*` / `to-cyan-*` | `bg-(--accent)` or remove gradient |
| `text-blue-*` / `text-cyan-*` | `text-(--accent)` |
| `bg-blue-*` / `bg-cyan-*` | `bg-(--accent)` or `bg-(--accent-muted)` |
| `border-blue-*` / `border-cyan-*` | `border-(--border)` or `border-(--accent)` |
| `blur(10px)` in motion | remove (use fadeUp instead) |
| `y: -6` (hover lift) | `y: -2` |

**GlassCard specific:**
```
Before: bg-white/70 backdrop-blur-xl rounded-2xl
After:  bg-white/[0.03] backdrop-blur-xl rounded-lg border border-(--border)
Hover:  border-(--border-hover) bg-white/[0.05] translateY(-2px)
```

**PageHeader specific:**
Remove gradient background entirely. Just icon + title + subtitle + border-b separator.

**AchievementCard specific:**
Replace colored gradient backgrounds with left border tier indicators:
- bronze: `border-l-2 border-amber-700`
- silver: `border-l-2 border-zinc-400`
- gold: `border-l-2 border-amber-400`
- platinum: `border-l-2 border-emerald-400`

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/GlassCard.tsx src/components/PageHeader.tsx src/components/ScrollFadeIn.tsx src/components/ReputationBadge.tsx src/components/PriorityBadge.tsx src/components/AchievementCard.tsx src/components/LoadingSpinner.tsx src/components/DashboardWidget.tsx src/components/StatCard.tsx src/components/ProgressRing.tsx src/components/ScoreGauge.tsx src/components/SkipToContent.tsx src/components/OsSelector.tsx src/components/GuideImage.tsx src/components/ContentRenderer.tsx
git commit -m "feat(design): update core UI primitives to Terminal Native"
```

### Task 10: Component Batch B — Cards (12 components)

**Files:** KnowledgeCard, SkillCard, CaseStudyCard, TrendingCard, DigestCard, UserCard, TeamCard, PackageCard, DebtItemCard, StepCard, SuggestedEditCard, ActivityItem

- [ ] **Step 1: Apply card transformation pattern to each**

All cards follow same pattern:
- `rounded-2xl` → `rounded-lg`
- Remove gradient overlays/backgrounds
- Remove colored shadows
- Border: `border border-(--border)`
- Hover: `border-(--border-hover)` + subtle lift `translateY(-2px)`
- Text colors: headings in `--text-1`, body in `--text-2`, metadata in `--text-3`
- Badges inside cards: `rounded px-2 py-0.5 text-xs font-mono`

- [ ] **Step 2: Verify + Commit**

```bash
npx tsc --noEmit
git add src/components/KnowledgeCard.tsx src/components/SkillCard.tsx src/components/CaseStudyCard.tsx src/components/TrendingCard.tsx src/components/DigestCard.tsx src/components/UserCard.tsx src/components/TeamCard.tsx src/components/PackageCard.tsx src/components/DebtItemCard.tsx src/components/StepCard.tsx src/components/SuggestedEditCard.tsx src/components/ActivityItem.tsx
git commit -m "feat(design): update all card components to Terminal Native"
```

### Task 11: Component Batch C — Interactive Components (15 components)

**Files:** CommentSection, KnowledgeEntryForm, ProfileEditForm, SkillUploadForm, ValidateOnlyForm, MarkdownEditor, VoteButton, StarButton, SearchBar, SearchResult, NotificationBell, InviteModal, AuthButton, LanguageSwitcher, ProfileEditToggle

- [ ] **Step 1: Apply form/button transformation pattern**

Buttons:
- Primary: `bg-(--accent) text-black font-medium rounded-md h-9 px-4` hover: `bg-(--accent-hover)`
- Secondary: `bg-transparent border border-(--border) text-(--text-1) rounded-md` hover: `bg-(--bg-elevated)`
- Ghost: `bg-transparent text-(--text-2)` hover: `text-(--text-1) bg-(--bg-elevated)`
- Danger: `bg-transparent border border-red-500/30 text-red-400` hover: `bg-red-500/10`

Inputs:
- `bg-(--bg-surface) border border-(--border) rounded-md text-(--text-1)`
- Focus: `border-(--accent) ring-1 ring-(--accent)/20`

Modals/Dropdowns:
- `bg-(--bg-surface) border border-(--border) rounded-lg shadow-lg`

SearchBar: restyle with `bg-(--bg-surface) border border-(--border) rounded-md` and ⌘K hint badge.

- [ ] **Step 2: Verify + Commit**

```bash
npx tsc --noEmit
git add src/components/CommentSection.tsx src/components/KnowledgeEntryForm.tsx src/components/ProfileEditForm.tsx src/components/SkillUploadForm.tsx src/components/ValidateOnlyForm.tsx src/components/MarkdownEditor.tsx src/components/VoteButton.tsx src/components/StarButton.tsx src/components/SearchBar.tsx src/components/SearchResult.tsx src/components/NotificationBell.tsx src/components/InviteModal.tsx src/components/AuthButton.tsx src/components/LanguageSwitcher.tsx src/components/ProfileEditToggle.tsx
git commit -m "feat(design): update interactive components to Terminal Native"
```

### Task 12: Component Batch D — Remaining Components (15 components)

**Files:** HeroStats, HeroStatsClient, HomeDashboard, DebtStatsBar, PackageSkillList, PackageInstallBlock, TeamMemberRow, LeaderboardRow, SourceBadge, CodeBlock, TipBox, CompareBox, FlowChart, ClaudeMdResults, ValidationResults

- [ ] **Step 1: Apply standard token updates**

Same pattern as other batches. Special attention:
- **HeroStats + HeroStatsClient**: Rewrite to simple stats bar — `text-sm text-(--text-3) font-mono` with `•` separators. If HeroStatsClient is redundant after changes, delete it.
- **CodeBlock**: Apply new code block spec (bg-surface, border, mono font, syntax colors)
- **TipBox**: Replace colored backgrounds with `bg-(--accent-muted)` border-l accent bar
- **PackageInstallBlock**: Terminal-style code display

- [ ] **Step 2: Verify + Commit**

```bash
npx tsc --noEmit
git add src/components/HeroStats.tsx src/components/HeroStatsClient.tsx src/components/HomeDashboard.tsx src/components/DebtStatsBar.tsx src/components/PackageSkillList.tsx src/components/PackageInstallBlock.tsx src/components/TeamMemberRow.tsx src/components/LeaderboardRow.tsx src/components/SourceBadge.tsx src/components/CodeBlock.tsx src/components/TipBox.tsx src/components/CompareBox.tsx src/components/FlowChart.tsx src/components/ClaudeMdResults.tsx src/components/ValidationResults.tsx
git commit -m "feat(design): update remaining components to Terminal Native"
```

---

## Chunk 3: i18n + Pages (Phases 3-4)

### Task 13: Update i18n Hero Text

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ko.json`
- Modify: `src/messages/ja.json`

- [ ] **Step 1: Add/update hero keys in all 3 locales**

Add `hero.welcomeBack` key to all locales. Update existing hero title/subtitle to match terminal-native messaging.

English:
```json
"hero": {
  "title": "Master Claude Code with collective wisdom.",
  "subtitle": "An open platform for skill sharing, knowledge management, and team collaboration.",
  "cta": "Get Started",
  "exploreCta": "Explore Skills",
  "welcomeBack": "Welcome back, {name}"
}
```

Korean:
```json
"hero": {
  "title": "Claude Code를 함께 마스터하자.",
  "subtitle": "스킬 공유・지식 관리・팀 협업을 위한 오픈 플랫폼",
  "cta": "시작하기",
  "exploreCta": "스킬 탐색",
  "welcomeBack": "돌아오셨네요, {name}"
}
```

Japanese:
```json
"hero": {
  "title": "Claude Code を、みんなの知恵で使いこなす。",
  "subtitle": "スキル共有・ナレッジ管理・チーム連携のためのオープンプラットフォーム",
  "cta": "始める",
  "exploreCta": "スキルを探す",
  "welcomeBack": "おかえり、{name}"
}
```

- [ ] **Step 2: Commit**

```bash
git add src/messages/en.json src/messages/ko.json src/messages/ja.json
git commit -m "feat(i18n): update hero text and add welcomeBack key"
```

### Task 14: Page-level Polish — All Pages

**Files:** All 49 page files listed in spec Section 9, Phase 4 (files 69-117)

**Strategy:** Use parallel subagents — split pages into 4 batches.

- [ ] **Step 1: Batch A — Knowledge pages (8 files)**

Files 69-76: knowledge/page, knowledge/new, knowledge/[slug], knowledge/[slug]/edit, knowledge/[slug]/history, knowledge/debt/page, knowledge/debt/[id], knowledge/debt/new

Pattern: Replace inline color classes that override CSS variables. Remove gradient backgrounds from filter bars. Ensure all `rounded-2xl` → `rounded-lg` on page-level elements.

- [ ] **Step 2: Batch B — Skills + Teams + Case Studies pages (15 files)**

Files 77-91: skills/*, teams/*, case-studies/*

Same mechanical pattern as Batch A.

- [ ] **Step 3: Batch C — Community + Social pages (10 files)**

Files 92-101: trending/*, community/*, digest, profile, notifications, search

Same pattern. Special attention to `TrendingFeedClient.tsx`, `ActivityFeedClient.tsx`, `NotificationsClient.tsx` which are client components with their own inline styles.

- [ ] **Step 4: Batch D — Claude-md + Users + Setup + Error pages (16 files)**

Files 102-117: claude-md, users/[username], 11 setup pages, error/not-found/loading

Setup pages are educational content pages — mainly need token updates on their card/step components.
Error/not-found/loading: simple token updates.

- [ ] **Step 5: Verify full build**

Run: `npx tsc --noEmit && npx next build 2>&1 | tail -10`
Expected: Zero errors, successful build.

- [ ] **Step 6: Commit**

```bash
git add -u
git commit -m "feat(design): Terminal Native page-level polish across all 49 pages"
```

---

## Chunk 4: Verification & Ship

### Task 15: Final Verification

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 2: Full build**

Run: `npx next build`
Expected: All routes build successfully.

- [ ] **Step 3: Check for stale token references**

Search for old tokens that should no longer be directly used:
```bash
grep -r "from-blue-" src/ --include="*.tsx" -l
grep -r "to-cyan-" src/ --include="*.tsx" -l
grep -r "shadow-blue-" src/ --include="*.tsx" -l
grep -r "shadow-cyan-" src/ --include="*.tsx" -l
grep -r "bg-linear-to-" src/components/ --include="*.tsx" -l
```

If any files still reference old patterns, fix them.

- [ ] **Step 4: Remove legacy CSS aliases**

Once all components use new tokens, remove the legacy aliases from globals.css:
```css
/* Remove these lines */
--bg: var(--bg-base);
--surface: var(--bg-surface);
--surface-hover: var(--bg-elevated);
--primary: var(--accent);
--secondary: var(--accent);
```

Also search for and replace any remaining `--bg)`, `--surface)`, `--primary)`, `--secondary)` references in components.

- [ ] **Step 5: Final build + commit**

```bash
npx tsc --noEmit && npx next build
git add -u
git commit -m "feat(design): Terminal Native redesign complete — remove legacy tokens"
```

### Task 16: Push to GitHub

- [ ] **Step 1: Push**

```bash
git push origin main
```
