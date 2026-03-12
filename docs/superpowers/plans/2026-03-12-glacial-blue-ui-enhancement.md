# Glacial Blue UI Enhancement Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the AI Guide educational platform from a basic Tailwind UI into an Apple-inspired, animation-rich learning experience using framer-motion.

**Architecture:** Thin `"use client"` animation wrappers around server-rendered content. Shared motion tokens in `src/lib/motion.ts`. CSS View Transitions for page navigation. All purple/violet colors replaced per the blanket migration rule.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, framer-motion, next-intl

**Spec:** `docs/superpowers/specs/2026-03-12-glacial-blue-ui-enhancement-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/lib/motion.ts` | Shared easing curves, duration constants, reusable animation variants |
| `src/components/ScrollFadeIn.tsx` | `"use client"` wrapper: `whileInView` fade-up animation |
| `src/components/GlassCard.tsx` | `"use client"` glassmorphism card with hover tilt + glow |
| `src/components/HeroSection.tsx` | `"use client"` home page hero with mesh gradient + stagger text |
| `src/components/PageHeader.tsx` | `"use client"` guide page gradient banner + icon + title |
| `src/components/MobileDrawer.tsx` | `"use client"` slide-in sidebar drawer for mobile |
| `src/hooks/useProgressLine.ts` | Custom hook: localStorage-based page visit tracking |

### Modified Files
| File | Changes |
|------|---------|
| `next.config.ts` | Add `experimental.viewTransition` |
| `src/app/globals.css` | Replace CSS variables, add new design tokens |
| `src/app/[locale]/layout.tsx` | Integrate MobileDrawer, update styles |
| `src/app/[locale]/page.tsx` | Add HeroSection, GlassCard grid, purple removal, badge i18n |
| `src/components/Header.tsx` | Glassmorphism, scroll response, mobile hamburger |
| `src/components/Sidebar.tsx` | useProgressLine integration, animated states |
| `src/components/StepCard.tsx` | Timeline design with vertical connecting line |
| `src/components/CodeBlock.tsx` | Dark theme, animated copy button |
| `src/components/TipBox.tsx` | Gradient style refresh |
| `src/components/OsSelector.tsx` | Sliding pill indicator |
| `src/components/FlowChart.tsx` | Animated connection lines |
| `src/components/CompareBox.tsx` | Card-lift style |
| `src/components/GuideImage.tsx` | Click-to-zoom lightbox |
| `src/components/ContentRenderer.tsx` | Spacing adjustments |
| `src/components/LanguageSwitcher.tsx` | Sliding active indicator |
| `src/messages/ko.json` | Badge i18n, purple class removal |
| `src/messages/en.json` | Badge i18n, purple class removal |
| `src/messages/ja.json` | Badge i18n, purple class removal |
| All 11 `src/app/[locale]/setup/*/page.tsx` | PageHeader + ScrollFadeIn + purple removal |

---

## Chunk 1: Foundation (Config, Tokens, CSS, Dependencies)

### Task 1: Install framer-motion and update config

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts` (8 lines)

- [ ] **Step 1: Install framer-motion**

```bash
cd /Users/arnold/Documents/ai-guide && npm install framer-motion
```

- [ ] **Step 2: Update next.config.ts to enable View Transitions**

Replace the contents of `next.config.ts` with:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 3: Verify dev server starts without errors**

```bash
npm run dev
```

Expected: Server starts on localhost:3000, no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json next.config.ts
git commit -m "feat: add framer-motion and enable View Transitions API"
```

---

### Task 2: Create shared motion tokens

**Files:**
- Create: `src/lib/motion.ts`

- [ ] **Step 1: Create src/lib directory and motion tokens file**

```bash
mkdir -p /Users/arnold/Documents/ai-guide/src/lib
```

```ts
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
    transition: { duration: DURATION.medium, ease: EASE_APPLE },
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
      staggerChildren: 0.1,
    },
  },
};

export const heroBlurIn = {
  hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: DURATION.slow, ease: EASE_APPLE },
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/motion.ts
git commit -m "feat: add shared motion tokens for Apple-style animations"
```

---

### Task 3: Update CSS design tokens and globals

**Files:**
- Modify: `src/app/globals.css` (19 lines)

- [ ] **Step 1: Replace globals.css with new design token system**

Replace the entire contents of `src/app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --bg: #fafbff;
  --surface: #ffffff;
  --surface-hover: #f0f4ff;
  --primary: #0071e3;
  --secondary: #06b6d4;
  --accent: #10b981;
  --text-1: #1d1d1f;
  --text-2: #6e6e73;
  --border: #e5e7eb;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0a0f1e;
    --surface: #111827;
    --surface-hover: #1a2236;
    --primary: #2997ff;
    --secondary: #22d3ee;
    --accent: #34d399;
    --text-1: #f5f5f7;
    --text-2: #a1a1a6;
    --border: #1f2937;
  }
}

body {
  background: var(--bg);
  color: var(--text-1);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Verify page renders with new variables**

Open http://localhost:3000 and confirm background color has changed to the slightly blue-tinted white (`#fafbff`).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: replace CSS tokens with Glacial Blue design system"
```

---

### Task 4: Purple color migration (all files)

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: All 11 setup pages
- Modify: `src/messages/ko.json`, `en.json`, `ja.json`

- [ ] **Step 1: Run purple/violet grep to identify all instances**

```bash
cd /Users/arnold/Documents/ai-guide && grep -rn "purple\|violet" --include="*.tsx" --include="*.json" src/
```

- [ ] **Step 2: Replace all purple/violet in TSX files**

Apply the blanket migration rule from the spec across all `.tsx` files:
- `purple-500` → `blue-500`
- `violet-500` → `blue-500`
- `purple-400` / `violet-400` → `cyan-400`
- `purple-600` → `cyan-600`
- `indigo-600` → `cyan-600`
- `purple-100` → `teal-100`
- `purple-700` → `teal-700`
- `purple-900/30` → `teal-900/30`
- `violet-500 to-purple-500` → `cyan-500 to-blue-500`
- `purple-500 to-violet-400` → `blue-500 to-cyan-400`
- `purple-500 to-indigo-500` → `blue-500 to-cyan-500`
- `purple-500 to-indigo-600` → `blue-500 to-cyan-600`

In `Header.tsx` line 16: `from-blue-500 to-purple-600` → `from-blue-500 to-cyan-500`

- [ ] **Step 3: Replace all purple/violet in JSON translation files**

In all three JSON files (`ko.json`, `en.json`, `ja.json`):
- `bg-purple-600` → `bg-blue-600`
- `border-purple-200` → `border-teal-200`
- `bg-purple-50` → `bg-teal-50`
- `text-purple-700` → `text-teal-700`
- `text-purple-800` → `text-teal-800`
- Any remaining `purple-*` → corresponding `blue-*` or `teal-*`

- [ ] **Step 4: Verify no purple/violet classes remain**

```bash
grep -rn "purple\|violet" --include="*.tsx" --include="*.json" src/
```

Expected: zero results.

- [ ] **Step 5: Verify page renders correctly with new colors**

Open http://localhost:3000 and check that all cards, badges, and icons use blue/cyan/teal colors.

- [ ] **Step 6: Commit**

```bash
git add src/app/ src/components/ src/messages/
git commit -m "feat: remove all purple/violet colors per Glacial Blue palette"
```

---

### Task 5: Badge i18n

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/messages/ko.json`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ja.json`

- [ ] **Step 1: Add badge translations to all three locale files**

Add to the `common` object in each JSON file:

**en.json:**
```json
"badges": {
  "beginner": "Beginner",
  "intermediate": "Intermediate",
  "advanced": "Advanced",
  "experimental": "Experimental"
}
```

**ko.json:**
```json
"badges": {
  "beginner": "초급",
  "intermediate": "중급",
  "advanced": "고급",
  "experimental": "실험적"
}
```

**ja.json:**
```json
"badges": {
  "beginner": "初級",
  "intermediate": "中級",
  "advanced": "上級",
  "experimental": "実験的"
}
```

- [ ] **Step 2: Update page.tsx to use translated badge labels**

In `src/app/[locale]/page.tsx`, remove the hardcoded `label` from `badgeStyles` and use `tc("badges.beginner")` etc. in the badge rendering:

Change the badge span from:
```tsx
{badgeStyles[card.badge].label}
```
to:
```tsx
{tc(`badges.${card.badge}`)}
```

Remove the `label` field from `badgeStyles` object entirely.

- [ ] **Step 3: Verify badges display in all three languages**

Switch between ko/en/ja and confirm badge text changes.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/page.tsx src/messages/
git commit -m "feat: internationalize badge labels for ko/en/ja"
```

---

## Chunk 2: Core Animation Components (ScrollFadeIn, GlassCard, HeroSection)

### Task 6: Create ScrollFadeIn component

**Files:**
- Create: `src/components/ScrollFadeIn.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { motion } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";

interface ScrollFadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function ScrollFadeIn({
  children,
  className,
  delay = 0,
}: ScrollFadeInProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: DURATION.medium,
            ease: EASE_APPLE,
            delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/arnold/Documents/ai-guide && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to ScrollFadeIn.

- [ ] **Step 3: Commit**

```bash
git add src/components/ScrollFadeIn.tsx
git commit -m "feat: add ScrollFadeIn animation wrapper component"
```

---

### Task 7: Create GlassCard component

**Files:**
- Create: `src/components/GlassCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { EASE_APPLE, DURATION } from "@/lib/motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
}

export default function GlassCard({
  children,
  className = "",
  href,
}: GlassCardProps) {
  const cardContent = (
    <motion.div
      whileHover={{
        y: -4,
        transition: { duration: DURATION.normal, ease: EASE_APPLE },
      }}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10 ${className}`}
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-br from-blue-500/5 to-cyan-500/5" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GlassCard.tsx
git commit -m "feat: add GlassCard component with hover tilt and glow"
```

---

### Task 8: Create HeroSection component

**Files:**
- Create: `src/components/HeroSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { heroBlurIn, staggerContainer } from "@/lib/motion";

interface HeroSectionProps {
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
}

export default function HeroSection({
  title,
  description,
  ctaText,
  ctaHref,
}: HeroSectionProps) {
  return (
    <section className="relative -mx-4 -mt-8 mb-16 overflow-hidden px-4 py-24 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {/* Mesh gradient background — 3 layered radial-gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/20 via-cyan-500/15 to-emerald-400/10 dark:from-blue-600/30 dark:via-cyan-500/20 dark:to-emerald-400/10" />
        <motion.div
          className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/20"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/20"
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/2 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/15"
          animate={{
            x: [0, 15, 0],
            y: [0, 15, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl text-center"
      >
        <motion.h1
          variants={heroBlurIn}
          className="text-5xl font-bold tracking-tight text-(--text-1) sm:text-6xl"
        >
          {title}
        </motion.h1>
        <motion.p
          variants={heroBlurIn}
          className="mt-6 text-lg leading-relaxed text-(--text-2)"
        >
          {description}
        </motion.p>
        <motion.div variants={heroBlurIn}>
          <Link
            href={ctaHref}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-(--primary) px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30"
          >
            {ctaText}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HeroSection.tsx
git commit -m "feat: add HeroSection with mesh gradient and blur-in animation"
```

---

### Task 9: Create PageHeader component

**Files:**
- Create: `src/components/PageHeader.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { motion } from "framer-motion";
import { heroBlurIn, staggerContainer } from "@/lib/motion";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  gradient: string;
  icon?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  gradient,
  icon,
}: PageHeaderProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={`relative -mx-4 -mt-8 mb-12 overflow-hidden rounded-b-3xl bg-linear-to-br ${gradient} px-8 py-16 sm:-mx-6 lg:-mx-8`}
    >
      <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
      <div className="relative">
        {icon && (
          <motion.div
            variants={heroBlurIn}
            className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm"
          >
            {icon}
          </motion.div>
        )}
        <motion.h1
          variants={heroBlurIn}
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          {title}
        </motion.h1>
        <motion.p
          variants={heroBlurIn}
          className="mt-3 max-w-2xl text-lg text-white/80"
        >
          {subtitle}
        </motion.p>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PageHeader.tsx
git commit -m "feat: add PageHeader gradient banner component"
```

---

## Chunk 3: Navigation Enhancement (Header, Sidebar, MobileDrawer)

### Task 10: Create MobileDrawer component

**Files:**
- Create: `src/components/MobileDrawer.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItem {
  key: string;
  href: string;
}

interface MenuGroup {
  labelKey: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    labelKey: "categoryGettingStarted",
    items: [
      { key: "vscode", href: "/setup/vscode" },
      { key: "claudeWeb", href: "/setup/claude-web" },
      { key: "claudeCode", href: "/setup/claude-code" },
    ],
  },
  {
    labelKey: "categoryCoreSkills",
    items: [
      { key: "workflow", href: "/setup/workflow" },
      { key: "bestPractices", href: "/setup/best-practices" },
      { key: "commonWorkflows", href: "/setup/common-workflows" },
    ],
  },
  {
    labelKey: "categoryAdvanced",
    items: [
      { key: "memory", href: "/setup/memory" },
      { key: "costs", href: "/setup/costs" },
      { key: "security", href: "/setup/security" },
      { key: "agentTeams", href: "/setup/agent-teams" },
      { key: "pixelAgents", href: "/setup/pixel-agents" },
    ],
  },
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const t = useTranslations("home.guides");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.normal }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
            className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-(--surface) p-6 shadow-2xl lg:hidden"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-bold text-(--text-1)">
                {tc("title")}
              </span>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-(--text-2) hover:bg-(--surface-hover)"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {menuGroups.map((group, groupIndex) => (
              <div key={group.labelKey} className={groupIndex > 0 ? "pt-6" : ""}>
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                  {tc(group.labelKey)}
                </p>
                {group.items.map((item) => {
                  const fullHref = `/${locale}${item.href}`;
                  const isActive = pathname === fullHref;
                  return (
                    <Link
                      key={item.key}
                      href={fullHref}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "text-(--text-2) hover:bg-(--surface-hover) hover:text-(--text-1)"
                      }`}
                    >
                      {t(`${item.key}.title`)}
                    </Link>
                  );
                })}
              </div>
            ))}
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MobileDrawer.tsx
git commit -m "feat: add MobileDrawer slide-in navigation component"
```

---

### Task 11: Redesign Header with glassmorphism and scroll response

**Files:**
- Modify: `src/components/Header.tsx` (61 lines)

- [ ] **Step 1: Rewrite Header.tsx**

Replace the entire contents of `src/components/Header.tsx` with:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileDrawer from "./MobileDrawer";

export default function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { scrollY } = useScroll();

  // Detect dark mode via media query
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Scroll-responsive background opacity
  const bgOpacity = useTransform(scrollY, [0, 100], [0.6, 0.85]);
  // Scroll-responsive height (padding-based: py-4 → py-3)
  const headerPy = useTransform(scrollY, [0, 100], [16, 12]);

  return (
    <>
      <motion.header
        style={{
          backgroundColor: isDark
            ? `rgba(10, 15, 30, ${bgOpacity.get()})`
            : `rgba(250, 251, 255, ${bgOpacity.get()})`,
          paddingTop: headerPy,
          paddingBottom: headerPy,
        }}
        className="sticky top-0 z-30 border-b border-(--border)/50 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-(--text-2) hover:bg-(--surface-hover) lg:hidden"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href={`/${locale}`} className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 text-lg font-bold text-white">
              <span className="relative z-10">AI</span>
              <div className="absolute inset-0 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 opacity-50 blur-md" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-(--text-1)">
                {t("title")}
              </h1>
              <p className="hidden text-xs text-(--text-2) sm:block">
                {t("subtitle")}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-1 md:flex">
              {[
                { label: t("home"), href: `/${locale}` },
                { label: "VS Code", href: `/${locale}/setup/vscode` },
                { label: "Claude Web", href: `/${locale}/setup/claude-web` },
                { label: "Claude Code", href: `/${locale}/setup/claude-code` },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative rounded-lg px-3 py-2 text-sm font-medium text-(--text-2) transition-colors hover:text-(--text-1) group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-(--primary) transition-all duration-200 group-hover:w-4/5" />
                </Link>
              ))}
            </nav>
            <div className="h-6 w-px bg-(--border)" />
            <LanguageSwitcher />
          </div>
        </div>
        {/* Gradient bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-(--primary)/20 to-transparent" />
      </motion.header>

      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
```

> **Note:** The `bgOpacity.get()` in the template literal requires wrapping the `style` prop in a `useMotionTemplate` or using `useMotionValueEvent` to update state. A simpler alternative during implementation: use two separate CSS classes with a `scrolled` state boolean toggled at `scrollY > 50`.

- [ ] **Step 2: Verify header renders with glassmorphism**

Open http://localhost:3000, scroll down, and confirm the header background changes opacity. Check that the gradient bottom line is visible.

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: redesign Header with glassmorphism and scroll response"
```

---

### Task 12: Create useProgressLine hook

**Files:**
- Create: `src/hooks/useProgressLine.ts`

- [ ] **Step 1: Create hooks directory and hook file**

```bash
mkdir -p /Users/arnold/Documents/ai-guide/src/hooks
```

```ts
// src/hooks/useProgressLine.ts
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "ai-guide-visited";

const ALL_PAGES = [
  "/setup/vscode",
  "/setup/claude-web",
  "/setup/claude-code",
  "/setup/workflow",
  "/setup/best-practices",
  "/setup/common-workflows",
  "/setup/memory",
  "/setup/costs",
  "/setup/security",
  "/setup/agent-teams",
  "/setup/pixel-agents",
];

export function useProgressLine() {
  const pathname = usePathname();
  const [visited, setVisited] = useState<string[]>([]);

  // Load visited pages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setVisited(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
  }, []);

  // Track current page visit
  useEffect(() => {
    const pathWithoutLocale = "/" + pathname.split("/").slice(2).join("/");
    if (ALL_PAGES.includes(pathWithoutLocale)) {
      setVisited((prev) => {
        if (prev.includes(pathWithoutLocale)) return prev;
        const updated = [...prev, pathWithoutLocale];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [pathname]);

  const isVisited = (href: string) => visited.includes(href);
  const progress = ALL_PAGES.length > 0 ? (visited.length / ALL_PAGES.length) * 100 : 0;

  return { isVisited, progress, visited };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useProgressLine.ts
git commit -m "feat: add useProgressLine hook for tracking visited pages"
```

---

### Task 13: Redesign Sidebar with progress tracking and animations

**Files:**
- Modify: `src/components/Sidebar.tsx` (181 lines)

- [ ] **Step 1: Rewrite Sidebar.tsx**

Replace the entire contents of `src/components/Sidebar.tsx`:

```tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgressLine } from "@/hooks/useProgressLine";

interface MenuItem {
  key: string;
  href: string;
}

interface MenuGroup {
  labelKey: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    labelKey: "categoryGettingStarted",
    items: [
      { key: "vscode", href: "/setup/vscode" },
      { key: "claudeWeb", href: "/setup/claude-web" },
      { key: "claudeCode", href: "/setup/claude-code" },
    ],
  },
  {
    labelKey: "categoryCoreSkills",
    items: [
      { key: "workflow", href: "/setup/workflow" },
      { key: "bestPractices", href: "/setup/best-practices" },
      { key: "commonWorkflows", href: "/setup/common-workflows" },
    ],
  },
  {
    labelKey: "categoryAdvanced",
    items: [
      { key: "memory", href: "/setup/memory" },
      { key: "costs", href: "/setup/costs" },
      { key: "security", href: "/setup/security" },
      { key: "agentTeams", href: "/setup/agent-teams" },
      { key: "pixelAgents", href: "/setup/pixel-agents" },
    ],
  },
];

export default function Sidebar() {
  const t = useTranslations("home.guides");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const { isVisited, progress } = useProgressLine();

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <nav className="sticky top-20 space-y-1">
        {/* Progress bar */}
        <div className="mb-4 px-3">
          <div className="flex items-center justify-between text-xs text-(--text-2)">
            <span>{tc("progress")}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-(--border)">
            <div
              className="h-full rounded-full bg-linear-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {menuGroups.map((group, groupIndex) => (
          <div key={group.labelKey} className={groupIndex > 0 ? "pt-4" : ""}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
              {tc(group.labelKey)}
            </p>
            <div className="relative ml-4 border-l border-(--border)">
              {group.items.map((item) => {
                const fullHref = `/${locale}${item.href}`;
                const isActive = pathname === fullHref;
                const visited = isVisited(item.href);

                return (
                  <Link
                    key={item.key}
                    href={fullHref}
                    className={`relative -ml-px flex items-center gap-3 border-l-2 py-2.5 pl-4 pr-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : visited
                          ? "border-transparent text-(--text-1) hover:border-(--border) hover:bg-(--surface-hover)"
                          : "border-transparent text-(--text-2) hover:border-(--border) hover:bg-(--surface-hover)"
                    }`}
                  >
                    {/* Progress dot */}
                    <span
                      className={`absolute -left-[5px] h-2 w-2 rounded-full transition-all duration-200 ${
                        isActive
                          ? "bg-blue-500 shadow-[0_0_6px_rgba(0,113,227,0.5)]"
                          : visited
                            ? "bg-(--accent)"
                            : "bg-(--border)"
                      }`}
                    />
                    {t(`${item.key}.title`)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Add "progress" translation key to all locale files**

Add `"progress": "Progress"` to `common` in en.json, `"progress": "進捗"` in ko.json, `"progress": "進捗"` in ja.json.

- [ ] **Step 3: Verify sidebar renders with progress indicators**

Visit a few different pages and confirm dots fill in and progress bar updates. Refresh the page and confirm visited state persists via localStorage.

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar.tsx src/hooks/useProgressLine.ts src/messages/
git commit -m "feat: redesign Sidebar with progress tracking and animations"
```

---

## Chunk 4: Home Page Redesign

### Task 14: Redesign home page with HeroSection and GlassCard grid

**Files:**
- Modify: `src/app/[locale]/page.tsx` (251 lines)

- [ ] **Step 1: Rewrite page.tsx**

Replace the entire contents. Key changes:
- Import `HeroSection`, `GlassCard`, `ScrollFadeIn`
- Keep existing `cardGroups` data (already updated in Tasks 4/5)
- Replace `<Link>` cards with `<GlassCard href={...}>`
- Wrap each card group in `<ScrollFadeIn>` with stagger delay
- Use `tc("badges.${card.badge}")` for i18n badge labels
- Use CSS variable tokens throughout

```tsx
import { useTranslations, useLocale } from "next-intl";
import HeroSection from "@/components/HeroSection";
import GlassCard from "@/components/GlassCard";
import ScrollFadeIn from "@/components/ScrollFadeIn";

// Keep the existing cardGroups and badgeStyles from Tasks 4/5
// (purple replaced, label field removed from badgeStyles)

export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale();

  return (
    <div>
      <HeroSection
        title={t("welcome")}
        description={t("description")}
        ctaText={t("getStarted")}
        ctaHref={`/${locale}/setup/vscode`}
      />

      {cardGroups.map((group, groupIndex) => (
        <ScrollFadeIn key={group.labelKey} className={groupIndex > 0 ? "mt-16" : ""}>
          <h2 className="mb-6 text-xl font-semibold text-(--text-1)">
            {tc(group.labelKey)}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.cards.map((card, cardIndex) => (
              <ScrollFadeIn key={card.key} delay={cardIndex * 0.1}>
                <GlassCard href={`/${locale}${card.href}`}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br ${card.gradient} text-white`}>
                      {card.icon}
                    </div>
                    {card.badge && (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeStyles[card.badge].bg} ${badgeStyles[card.badge].text}`}>
                        {tc(`badges.${card.badge}`)}
                      </span>
                    )}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-(--text-1) group-hover:text-(--primary)">
                    {t(`guides.${card.key}.title`)}
                  </h3>
                  <p className="text-sm text-(--text-2)">
                    {t(`guides.${card.key}.description`)}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium text-(--primary)">
                    {t("getStarted")}
                    <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </GlassCard>
              </ScrollFadeIn>
            ))}
          </div>
        </ScrollFadeIn>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify home page renders with hero and animated cards**

Open http://localhost:3000 and confirm:
- Hero section with mesh gradient and floating orbs
- Title fades in with blur effect
- Cards fade up on scroll with stagger delay
- Card hover shows lift + glow effect
- All badges display correctly in current language

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/page.tsx
git commit -m "feat: redesign home page with HeroSection and animated GlassCard grid"
```

---

## Chunk 5: Component Enhancements

### Task 15: Enhance StepCard with timeline design

**Files:**
- Modify: `src/components/StepCard.tsx` (32 lines)

- [ ] **Step 1: Rewrite StepCard with timeline**

Add:
- Vertical line connecting steps (before pseudo-element)
- Gradient circle for step number
- Wrap in ScrollFadeIn for scroll-triggered reveal
- Use `var(--*)` tokens

The step number should be a gradient circle (blue→cyan) positioned on the left, with a vertical line running from one step to the next.

- [ ] **Step 2: Verify on a setup page (e.g., /setup/vscode)**

Steps should appear connected by a timeline line.

- [ ] **Step 3: Commit**

```bash
git add src/components/StepCard.tsx
git commit -m "feat: enhance StepCard with timeline design and scroll animation"
```

---

### Task 16: Enhance CodeBlock with dark theme and animated copy

**Files:**
- Modify: `src/components/CodeBlock.tsx` (41 lines)

- [ ] **Step 1: Update CodeBlock**

Changes:
- Background: `bg-[#0a0f1e]` (deep navy from design tokens)
- Text: `text-gray-300`
- Copy button: animate from clipboard icon to checkmark with smooth morph
- Add subtle left border gradient (blue→cyan)
- Rounded corners `rounded-xl`

- [ ] **Step 2: Verify code blocks render with new dark theme**

Check any page with code blocks (e.g., /setup/claude-code).

- [ ] **Step 3: Commit**

```bash
git add src/components/CodeBlock.tsx
git commit -m "feat: enhance CodeBlock with dark navy theme and animated copy"
```

---

### Task 17: Enhance TipBox with gradient style

**Files:**
- Modify: `src/components/TipBox.tsx` (52 lines)

- [ ] **Step 1: Update TipBox**

Changes:
- Replace solid backgrounds with subtle gradients
- tip: `bg-gradient-to-r from-emerald-50 to-teal-50` (dark: `from-emerald-950/30 to-teal-950/30`)
- warning: `bg-gradient-to-r from-amber-50 to-yellow-50`
- info: `bg-gradient-to-r from-blue-50 to-cyan-50`
- Left border: 3px gradient line
- Wrap in ScrollFadeIn

- [ ] **Step 2: Commit**

```bash
git add src/components/TipBox.tsx
git commit -m "feat: enhance TipBox with gradient backgrounds"
```

---

### Task 18: Enhance OsSelector with sliding pill indicator

**Files:**
- Modify: `src/components/OsSelector.tsx` (54 lines)

- [ ] **Step 1: Update OsSelector**

Changes:
- Replace button background toggle with a sliding pill indicator
- The pill is an absolute-positioned div that slides left/right via `translateX`
- Use CSS transition (not framer-motion — simple enough)
- Add crossfade between OS content sections

- [ ] **Step 2: Commit**

```bash
git add src/components/OsSelector.tsx
git commit -m "feat: enhance OsSelector with sliding pill indicator"
```

---

### Task 19: Enhance remaining components (FlowChart, CompareBox, GuideImage, ContentRenderer, LanguageSwitcher)

**Files:**
- Modify: `src/components/FlowChart.tsx` (39 lines)
- Modify: `src/components/CompareBox.tsx` (36 lines)
- Modify: `src/components/GuideImage.tsx` (28 lines)
- Modify: `src/components/ContentRenderer.tsx` (75 lines)
- Modify: `src/components/LanguageSwitcher.tsx` (41 lines)

- [ ] **Step 1: Update FlowChart**

Add animated connection lines between steps using CSS transitions. Steps pulse on hover.

- [ ] **Step 2: Update CompareBox**

Add card-lift style with subtle shadow. Good/Bad icons get a scale animation on hover.

- [ ] **Step 3: Update GuideImage with lightbox and skeleton loading**

Add `"use client"` directive. Changes:
- **Skeleton**: Show a pulsing gray placeholder (`animate-pulse bg-(--border) rounded-xl`) while image loads, then fade-in the image with `opacity` transition on `onLoad`.
- **Lightbox**: Clicking the image opens a full-screen overlay (`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm`). Image centered and scaled. Close via click-outside, ESC key, or close button. Body scroll lock (`document.body.style.overflow = "hidden"`). Use framer-motion `AnimatePresence` for enter/exit animation. Add `aria-modal="true"` and `role="dialog"` for accessibility. Focus trap: auto-focus the close button on open.

- [ ] **Step 4: Update ContentRenderer**

Adjust spacing between parsed blocks (`space-y-4` → `space-y-6`). Wrap each `CodeBlock` output in `<ScrollFadeIn>` for scroll-triggered reveal. Import `ScrollFadeIn` at the top.

- [ ] **Step 5: Update LanguageSwitcher**

Add sliding active indicator (a small pill background) that transitions between language buttons.

- [ ] **Step 6: Verify all components on relevant pages**

Check:
- FlowChart: `/setup/workflow`
- CompareBox: `/setup/best-practices`
- GuideImage: `/setup/claude-code` (click an image to test lightbox)
- ContentRenderer: any page with text content
- LanguageSwitcher: click through languages

- [ ] **Step 7: Commit**

```bash
git add src/components/FlowChart.tsx src/components/CompareBox.tsx src/components/GuideImage.tsx src/components/ContentRenderer.tsx src/components/LanguageSwitcher.tsx
git commit -m "feat: enhance FlowChart, CompareBox, GuideImage lightbox, ContentRenderer, LanguageSwitcher"
```

---

## Chunk 6: Setup Page Integration

### Task 20: Add PageHeader and ScrollFadeIn to all 11 setup pages

**Files:**
- Modify: All 11 `src/app/[locale]/setup/*/page.tsx`

- [ ] **Step 1: Update each setup page**

For each of the 11 pages:
1. Import `PageHeader` and `ScrollFadeIn`
2. Add `PageHeader` at the top with appropriate gradient and title/subtitle from translations
3. Wrap each `StepCard` or section block in `<ScrollFadeIn>`
4. Assign a suitable gradient to each page (all blue/cyan/teal/emerald/amber/rose — no purple):

| Page | Gradient |
|------|----------|
| vscode | `from-blue-500 to-cyan-400` |
| claude-web | `from-rose-400 to-orange-400` |
| claude-code | `from-blue-500 to-cyan-600` |
| workflow | `from-emerald-500 to-teal-400` |
| best-practices | `from-green-500 to-emerald-400` |
| common-workflows | `from-blue-500 to-cyan-500` |
| memory | `from-teal-500 to-cyan-400` |
| costs | `from-amber-500 to-yellow-400` |
| security | `from-red-500 to-rose-400` |
| agent-teams | `from-cyan-500 to-blue-500` |
| pixel-agents | `from-pink-500 to-rose-400` |

- [ ] **Step 2: Verify each page has the gradient header and scroll animations**

Navigate to each of the 11 pages and confirm:
- Gradient banner with title appears at top
- StepCards fade in on scroll
- No purple colors remain

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/setup/
git commit -m "feat: add PageHeader and ScrollFadeIn to all 11 setup pages"
```

---

## Chunk 7: Layout Update and Final Polish

### Task 21: Update layout.tsx

**Files:**
- Modify: `src/app/[locale]/layout.tsx` (44 lines)

- [ ] **Step 1: Update layout**

Changes:
- Use `var(--bg)` for body background (already handled by globals.css)
- Ensure main content area has proper spacing for the new PageHeader negative margins
- Add `overflow-x-hidden` to prevent horizontal scroll from hero animations

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/layout.tsx
git commit -m "feat: update layout for Glacial Blue design system"
```

---

### Task 22: Final verification and cleanup

- [ ] **Step 1: Full site walkthrough**

Visit every page and check:
- Hero section on home page
- All 11 setup pages with PageHeader
- Mobile drawer (resize browser to mobile width)
- Dark mode (toggle system preference)
- Language switching (ko/en/ja)
- Code blocks with dark theme
- Image lightbox (click an image)
- No purple/violet colors anywhere

- [ ] **Step 2: Run build to check for errors**

```bash
cd /Users/arnold/Documents/ai-guide && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: No errors (warnings OK).

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: final polish and cleanup for Glacial Blue UI enhancement"
```
