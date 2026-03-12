# AI Guide Platform -- UX Architecture Specification

**Author**: ArchitectUX
**Date**: 2026-03-12
**Scope**: Transform educational site into collaborative knowledge-sharing platform
**Design Language**: Glacial Blue, glassmorphism, Apple-like, framer-motion

---

## 1. Design System Extension

### 1.1 New CSS Custom Properties

The existing design system uses `--bg`, `--surface`, `--primary`, `--secondary`,
`--accent`, `--text-1`, `--text-2`, `--border`. The platform expansion requires
additional semantic tokens while preserving the established Glacial Blue palette.

```css
:root {
  /* --- Existing tokens (unchanged) --- */
  /* --bg, --surface, --surface-hover, --primary, --secondary, --accent,
     --text-1, --text-2, --border */

  /* --- New: Surface hierarchy for nested cards --- */
  --surface-2: rgba(255, 255, 255, 0.6);
  --surface-3: rgba(255, 255, 255, 0.4);

  /* --- New: Status colors --- */
  --status-verified: #059669;
  --status-unverified: #d97706;
  --status-pending: #6366f1;
  --status-rejected: #dc2626;

  /* --- New: Voting & engagement --- */
  --upvote: #3b82f6;
  --downvote: #94a3b8;

  /* --- New: Reputation tiers --- */
  --rep-bronze: #cd7f32;
  --rep-silver: #94a3b8;
  --rep-gold: #eab308;
  --rep-platinum: #06b6d4;

  /* --- New: Content-specific --- */
  --code-surface: #0a0f1e;
  --diff-added-bg: rgba(16, 185, 129, 0.1);
  --diff-removed-bg: rgba(239, 68, 68, 0.1);
  --diff-added-border: rgba(16, 185, 129, 0.3);
  --diff-removed-border: rgba(239, 68, 68, 0.3);

  /* --- New: Spacing extensions --- */
  --space-px: 1px;
  --space-0-5: 0.125rem;
  --space-1: 0.25rem;
  --space-1-5: 0.375rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;

  /* --- New: Typography extensions --- */
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* --- New: Transitions (matching motion.ts constants) --- */
  --ease-apple: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-medium: 500ms;
  --duration-slow: 600ms;
}

@media (prefers-color-scheme: dark) {
  :root {
    --surface-2: rgba(15, 23, 42, 0.6);
    --surface-3: rgba(15, 23, 42, 0.4);
    --diff-added-bg: rgba(16, 185, 129, 0.15);
    --diff-removed-bg: rgba(239, 68, 68, 0.15);
  }
}
```

### 1.2 New Motion Variants (extend src/lib/motion.ts)

```ts
// Slide-in from right (for sidebars, panels)
export const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1, x: 0,
    transition: { duration: DURATION.medium, ease: EASE_APPLE },
  },
};

// Scale-in (for modals, dialogs)
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95, filter: "blur(4px)" },
  visible: {
    opacity: 1, scale: 1, filter: "blur(0px)",
    transition: { duration: DURATION.normal, ease: EASE_APPLE },
  },
};

// Stagger grid (for card grids, search results)
export const staggerGrid = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

// Tab content crossfade
export const tabCrossfade = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: DURATION.fast, ease: EASE_APPLE },
  },
  exit: {
    opacity: 0, y: -8,
    transition: { duration: DURATION.fast, ease: EASE_APPLE },
  },
};
```

### 1.3 New Shared Component Primitives

These components extend the existing library (GlassCard, ScrollFadeIn, CodeBlock,
TipBox, StepCard, CompareBox) and share the same glassmorphism + Glacial Blue DNA.

| Component | Purpose | Base Pattern |
|-----------|---------|-------------|
| `GlassPill` | Category/tag chip with glass bg | Inherits GlassCard border + backdrop |
| `GlassPanel` | Larger content container with sections | GlassCard at panel scale |
| `SearchBar` | Unified search with filter dropdowns | Glass surface + primary accent |
| `VoteControls` | Upvote/downvote with count | --upvote color, motion scale |
| `BadgeCluster` | Status + level badges | Badge styles from page.tsx |
| `DiffViewer` | Side-by-side or unified diff | CodeBlock style + diff colors |
| `MarkdownRenderer` | Rich markdown with all code/tip blocks | Composes CodeBlock, TipBox |
| `AvatarStack` | Overlapping user avatars | Glass border ring |
| `StatCard` | Number + label in glass container | GlassCard variant |
| `TabBar` | Animated underline tab navigation | Primary gradient underline |
| `EmptyState` | Illustrated placeholder for empty lists | Glacial gradient illustration |

---

## 2. Navigation Architecture

### 2.1 Header Extension

The current Header has: logo, nav links (Home, VS Code, Claude Web, Claude Code),
language switcher, mobile hamburger. The platform needs additional primary navigation.

```
+------------------------------------------------------------------+
| [AI] AI Guide   |  Home  Knowledge  Skills  Case Studies  |  [EN] [avatar] |
|                  |  ~~~~~~~~~~~~                           |                 |
+------------------------------------------------------------------+
  gradient bottom border (existing)
```

**Changes to Header.tsx:**
- Add "Knowledge", "Skills", "Case Studies" to desktop nav links
- Move existing setup guide links into a "Guides" dropdown or keep in sidebar
- Add authenticated user avatar button (right side, after language switcher)
- Avatar triggers a dropdown: Profile, My Contributions, Bookmarks, Sign Out
- "Share Knowledge" CTA button (blue-to-cyan gradient pill, like hero CTA but smaller)

**Mobile:** Hamburger drawer gains two sections:
- "Explore" section: Knowledge Hub, Skills, Case Studies
- "Learn" section: existing setup guide links
- User section at bottom: Profile, Sign Out

### 2.2 Layout Variants

The current layout is: Header + Sidebar + Main content (max-w-7xl).
New pages require different layout configurations.

| Page | Layout | Sidebar | Max Width |
|------|--------|---------|-----------|
| Home (existing) | sidebar + main | Guide progress sidebar | 7xl |
| Setup guides (existing) | sidebar + main | Guide progress sidebar | 7xl |
| Knowledge Hub | full-width main | No sidebar | 7xl |
| Knowledge Entry | main + right aside | Related entries sidebar | 7xl |
| Skill Registry | full-width main | No sidebar | 7xl |
| User Profile | full-width main | No sidebar | 5xl |
| Contribution Flow | centered main | No sidebar | 4xl |
| Case Studies Gallery | full-width main | No sidebar | 7xl |

**Implementation:** Create a `PageLayout` wrapper component that accepts a `variant` prop
to control whether the sidebar renders and which max-width applies. The existing
`layout.tsx` conditionally renders `<Sidebar />` based on route prefix.

```
// Route-based layout logic in layout.tsx
const showGuideSidebar = pathname.startsWith(`/${locale}/setup`);
```

---

## 3. Page-by-Page UX Architecture

---

### 3.1 Knowledge Hub (`/[locale]/knowledge`)

**Purpose:** Primary discovery surface for browsing community-contributed knowledge.

#### Component Hierarchy

```
KnowledgeHubPage
  +-- KnowledgeHero (compact variant of HeroSection)
  |     +-- h1: "Knowledge Hub"
  |     +-- p: subtitle
  |     +-- SearchBar (prominent, centered)
  |           +-- input with glass surface
  |           +-- FilterDropdowns (level, category, sort)
  |
  +-- TrendingNewsBanner
  |     +-- GlassCard (full-width, horizontal scroll on mobile)
  |     +-- "Today's Trending AI News" label
  |     +-- NewsTickerRow
  |           +-- NewsItem[] (title, source icon, time ago)
  |           +-- auto-scroll with pause-on-hover
  |
  +-- CategoryTabBar
  |     +-- TabBar with tabs:
  |           All | Skills | Workflows | Memory | Best Practices | Case Studies
  |     +-- animated underline indicator (blue-to-cyan gradient)
  |
  +-- FeaturedSection (only on "All" tab)
  |     +-- h2: "Featured"
  |     +-- FeaturedGrid (2-column on desktop, 1-column on mobile)
  |           +-- FeaturedKnowledgeCard (large GlassCard variant)
  |                 +-- gradient accent bar (top edge)
  |                 +-- category GlassPill
  |                 +-- h3: title
  |                 +-- p: excerpt (2 lines, clamped)
  |                 +-- AuthorRow (avatar, name, date)
  |                 +-- StatRow (views, votes, comments)
  |
  +-- KnowledgeGrid
  |     +-- motion.div with staggerGrid variants
  |     +-- KnowledgeCard[] (standard GlassCard)
  |           +-- category GlassPill (top-left)
  |           +-- level BadgeCluster (top-right, reuse badgeStyles)
  |           +-- h3: title
  |           +-- p: excerpt (2 lines)
  |           +-- footer: AuthorRow + StatRow
  |
  +-- LoadMoreButton or InfiniteScrollTrigger
        +-- "Load more" glass-styled button
        +-- or intersection observer for infinite scroll
```

#### Layout Wireframe (Desktop, ~1280px)

```
+----------------------------------------------------------------------+
| HEADER (existing, with new nav links)                                |
+----------------------------------------------------------------------+
|                                                                      |
|                       Knowledge Hub                                  |
|                  Discover and share expertise                        |
|           +--------------------------------------------+             |
|           | [icon] Search knowledge...    [Filters v]  |             |
|           +--------------------------------------------+             |
|                                                                      |
| +------------------------------------------------------------------+|
| | Trending AI News    [title] - 2h  |  [title] - 4h  |  [title]   ||
| +------------------------------------------------------------------+|
|                                                                      |
|  All    Skills    Workflows    Memory    Best Practices    Cases     |
|  ~~~~                                                                |
|                                                                      |
|  Featured                                                            |
|  +------------------------------+  +------------------------------+  |
|  | [gradient bar]               |  | [gradient bar]               |  |
|  | [Skills]                     |  | [Workflows]                  |  |
|  | Advanced CLAUDE.md Patterns  |  | Multi-Agent Setup Guide      |  |
|  | Learn how to structure...    |  | Configure agent teams for... |  |
|  | [@author] [3d ago]           |  | [@author] [1w ago]           |  |
|  | [42 votes] [12 comments]     |  | [38 votes] [8 comments]      |  |
|  +------------------------------+  +------------------------------+  |
|                                                                      |
|  +---------------+  +---------------+  +---------------+             |
|  | [Memory]      |  | [Skills]      |  | [Workflow]    |             |
|  | Title here    |  | Title here    |  | Title here    |             |
|  | Excerpt...    |  | Excerpt...    |  | Excerpt...    |             |
|  | @user  12v    |  | @user  8v     |  | @user  24v    |             |
|  +---------------+  +---------------+  +---------------+             |
|  +---------------+  +---------------+  +---------------+             |
|  | ...           |  | ...           |  | ...           |             |
|  +---------------+  +---------------+  +---------------+             |
|                                                                      |
|              [ Load More ]                                           |
+----------------------------------------------------------------------+
```

#### Key Interactions and Animations

1. **Search**: Debounced input (300ms). Results fade in with `staggerGrid`. Search
   bar has a subtle glow ring on focus (`ring-2 ring-blue-500/30`).
2. **Category Tabs**: `AnimatePresence` crossfade between tab content using
   `tabCrossfade` variants. Underline indicator animates position with
   `layoutId="tab-indicator"` (framer-motion shared layout).
3. **Cards**: Inherit existing GlassCard hover (y: -6, shadow expansion). On tap
   (mobile), brief scale to 0.98.
4. **News Ticker**: CSS `@keyframes` horizontal scroll, pauses on hover. Each item
   fades in on load with stagger.
5. **Infinite Scroll**: Intersection observer triggers skeleton loading animation
   (pulsing glass cards) before content appears.

#### Responsive Considerations

| Breakpoint | Changes |
|-----------|---------|
| < 640px (mobile) | Search bar full-width, filters collapse into bottom sheet. Category tabs become horizontal scroll. Knowledge grid becomes single column. News ticker is swipeable. Featured section stacks to single column. |
| 640-1023px (tablet) | Knowledge grid 2 columns. Featured section 2 columns. Filters inline with search. |
| >= 1024px (desktop) | Knowledge grid 3 columns. Full filter bar. Sticky category tabs on scroll. |

#### Accessibility

- Search input: `role="search"`, `aria-label="Search knowledge entries"`
- Category tabs: `role="tablist"`, each tab `role="tab"` with `aria-selected`
- Tab panels: `role="tabpanel"` with `aria-labelledby`
- Cards: semantic `<article>` elements, `<h3>` for titles
- News ticker: `aria-live="polite"`, pause button for motion control
- Filter dropdowns: `role="listbox"` with keyboard arrow navigation
- Load more: `aria-label="Load more knowledge entries"`

---

### 3.2 Knowledge Entry Page (`/[locale]/knowledge/[slug]`)

**Purpose:** Full reading experience for a single knowledge entry with community interaction.

#### Component Hierarchy

```
KnowledgeEntryPage
  +-- Breadcrumb
  |     +-- Knowledge Hub > [Category] > [Title]
  |
  +-- EntryHeader
  |     +-- category GlassPill
  |     +-- level Badge
  |     +-- h1: title (text-4xl, font-bold)
  |     +-- AuthorBlock
  |     |     +-- avatar (48px, glass border ring)
  |     |     +-- name + reputation badge
  |     |     +-- "Published [date] -- Updated [date]"
  |     +-- ActionBar
  |           +-- VoteControls (upvote/downvote + count)
  |           +-- BookmarkButton (glass pill)
  |           +-- ShareButton (glass pill)
  |           +-- "Suggest Edit" button (outlined, primary color)
  |
  +-- ContentLayout (2-column: main + sidebar)
  |     +-- MainContent (flex-1, min-w-0)
  |     |     +-- MarkdownRenderer
  |     |     |     +-- prose styling (headings, paragraphs, lists)
  |     |     |     +-- CodeBlock (existing component, unchanged)
  |     |     |     +-- TipBox (existing component, for callouts)
  |     |     |     +-- inline images with glass border + shadow
  |     |     |     +-- table styling (glass surface rows)
  |     |     |
  |     |     +-- VersionHistorySection
  |     |     |     +-- GlassPanel
  |     |     |     +-- "Version History" heading
  |     |     |     +-- VersionTimeline
  |     |     |           +-- VersionItem[] (date, author, summary)
  |     |     |           +-- "View diff" button per version
  |     |     |           +-- DiffViewer (expandable, side-by-side or unified)
  |     |     |
  |     |     +-- CommentsSection
  |     |           +-- h2: "Discussion"
  |     |           +-- CommentComposer (glass textarea + submit)
  |     |           +-- CommentList
  |     |                 +-- CommentItem[]
  |     |                       +-- avatar + name + time
  |     |                       +-- comment body (markdown-lite)
  |     |                       +-- VoteControls (compact)
  |     |                       +-- ReplyButton
  |     |                       +-- nested replies (indented)
  |     |
  |     +-- EntrySidebar (w-80, sticky top-20, hidden on mobile)
  |           +-- ContributionStats (GlassPanel)
  |           |     +-- StatCard grid (2x2)
  |           |           +-- Views, Votes, Comments, Edits
  |           |
  |           +-- TableOfContents (GlassPanel)
  |           |     +-- auto-generated from h2/h3 headings
  |           |     +-- active heading highlight on scroll
  |           |     +-- click to smooth-scroll
  |           |
  |           +-- RelatedEntries (GlassPanel)
  |           |     +-- RelatedEntryCard[] (compact, 3-4 items)
  |           |           +-- title + category pill + vote count
  |           |
  |           +-- TagCloud (GlassPanel)
  |                 +-- GlassPill[] tags, clickable to filter
```

#### Layout Wireframe (Desktop)

```
+----------------------------------------------------------------------+
| HEADER                                                               |
+----------------------------------------------------------------------+
|                                                                      |
| Knowledge Hub > Workflows > Advanced CLAUDE.md Patterns              |
|                                                                      |
| [Workflows]  [Advanced]                                              |
| Advanced CLAUDE.md Patterns for                                      |
| Multi-Project Environments                                           |
|                                                                      |
| [avatar] John Doe  [gold badge]                                      |
| Published Mar 5, 2026 -- Updated Mar 10, 2026                        |
|                                                                      |
| [^ 42 v]  [Bookmark]  [Share]  [Suggest Edit]                       |
|                                                                      |
| +------------------------------------------+  +-------------------+ |
| |                                          |  | Stats             | |
| | ## Introduction                          |  | 1.2k views        | |
| |                                          |  | 42 votes          | |
| | When working with multiple projects...   |  | 12 comments       | |
| |                                          |  | 3 edits           | |
| | +--------------------------------------+ |  +-------------------+ |
| | | code block (existing CodeBlock)      | |  | Table of Contents | |
| | +--------------------------------------+ |  | > Introduction    | |
| |                                          |  | > Setup           | |
| | +--------------------------------------+ |  | > Configuration   | |
| | | TIP: Remember to...                  | |  | > Advanced Tips   | |
| | +--------------------------------------+ |  +-------------------+ |
| |                                          |  | Related           | |
| | ## Setup                                 |  | > Entry title (8) | |
| | ...                                      |  | > Entry title (5) | |
| |                                          |  | > Entry title (3) | |
| +------------------------------------------+  +-------------------+ |
|                                                                      |
| +------------------------------------------+                        |
| | Version History                          |                        |
| | v3 - Mar 10 - @john - "Added section.." |                        |
| | v2 - Mar 7  - @jane - "Fixed code..."   |                        |
| | v1 - Mar 5  - @john - "Initial publish" |                        |
| |                      [View diff]         |                        |
| +------------------------------------------+                        |
|                                                                      |
| +------------------------------------------+                        |
| | Discussion (12 comments)                 |                        |
| |                                          |                        |
| | +--------------------------------------+ |                        |
| | | Write a comment...              [>]  | |                        |
| | +--------------------------------------+ |                        |
| |                                          |                        |
| | [avatar] Jane - 2d ago                   |                        |
| | Great writeup! One thing I'd add...      |                        |
| | [^ 5 v] [Reply]                          |                        |
| |   +-- [avatar] John - 1d ago             |                        |
| |       Thanks! Good point about...        |                        |
| +------------------------------------------+                        |
+----------------------------------------------------------------------+
```

#### Key Interactions and Animations

1. **Vote controls**: Click triggers `scale: [1, 1.3, 1]` spring animation on the
   arrow icon. Count number animates with `AnimatePresence` (old number exits up,
   new number enters from below).
2. **Table of Contents**: Active heading tracked via `IntersectionObserver`.
   Active item has left border highlight (blue-500) with smooth transition.
3. **Suggest Edit**: Opens a modal (scaleIn animation) with a forked markdown editor.
   Submitting creates a "suggestion" that the author can review.
4. **Version diff**: Expand/collapse with `AnimatePresence` height animation.
   Diff viewer highlights added lines in `--diff-added-bg` and removed lines
   in `--diff-removed-bg`.
5. **Comments**: New comments animate in with `fadeUp`. Reply thread indentation
   uses left border line (like existing Sidebar progress line pattern).
6. **Bookmark**: Heart/bookmark icon fills with `--primary` color on click,
   with a brief particle burst animation (framer-motion keyframes).

#### Responsive Considerations

| Breakpoint | Changes |
|-----------|---------|
| < 768px | Sidebar collapses below main content. Table of Contents becomes a collapsible accordion at the top. Vote controls move into a sticky bottom bar. Action buttons become icon-only. |
| 768-1023px | Sidebar becomes a narrower column (w-64). Stats become horizontal row instead of 2x2 grid. |
| >= 1024px | Full 2-column layout. Sidebar sticky on scroll. |

#### Accessibility

- Article content: `<article>` with `role="article"`
- Headings: proper h1 > h2 > h3 hierarchy within content
- Vote controls: `aria-label="Upvote (current count: 42)"`, button role
- Table of Contents: `<nav aria-label="Table of contents">`
- Comments: `aria-label="Discussion"`, each comment in `<article>` with timestamp in `<time>`
- Diff viewer: `aria-label="Version differences"`, additions/removals announced to screen readers
- Bookmark: `aria-pressed` toggle state
- Suggest Edit modal: focus trap, `role="dialog"`, `aria-modal="true"`

---

### 3.3 Skill Registry (`/[locale]/skills`)

**Purpose:** Browse, discover, and validate shared Claude Code skills.

#### Component Hierarchy

```
SkillRegistryPage
  +-- SkillHero (compact hero)
  |     +-- h1: "Skill Registry"
  |     +-- p: subtitle
  |     +-- SearchBar (skills-specific)
  |     +-- QuickFilters: [All] [Verified] [Most Installed] [Newest]
  |
  +-- SkillValidatorCTA
  |     +-- GlassCard (accent gradient border, full-width)
  |     +-- icon: shield/check
  |     +-- h3: "Check My Skills"
  |     +-- p: "Paste your skill config to get a validation report"
  |     +-- [Open Validator] button
  |
  +-- SkillGrid
  |     +-- motion.div with staggerGrid
  |     +-- SkillCard[]
  |           +-- GlassCard
  |           +-- SkillCardHeader
  |           |     +-- skill icon (auto-generated from skill name, gradient bg)
  |           |     +-- VerificationBadge (verified/unverified/pending)
  |           +-- h3: skill name
  |           +-- p: description (2 lines clamped)
  |           +-- SkillMeta
  |           |     +-- author name
  |           |     +-- install count
  |           |     +-- compatibility version
  |           +-- SkillPreview
  |           |     +-- collapsible code preview (first 5 lines of skill)
  |           |     +-- "Show more" toggle
  |           +-- SkillActions
  |                 +-- [Copy Install Command] (primary, glass)
  |                 +-- [View Details] (secondary, outlined)
  |
  +-- SkillDetailModal (opens on "View Details")
  |     +-- Full skill source code (CodeBlock)
  |     +-- Installation instructions (StepCard pattern)
  |     +-- Compatibility matrix
  |     +-- Author info + related skills
  |     +-- VoteControls + comment count
  |
  +-- SkillValidatorModal (opens from CTA)
        +-- GlassPanel (centered, max-w-2xl)
        +-- h2: "Skill Validator"
        +-- textarea: paste skill config here
        +-- [Validate] button
        +-- ValidationReport
              +-- status: pass/fail/warnings
              +-- CheckItem[] (green check / red x / yellow warning per rule)
              +-- suggestions for improvement
```

#### Layout Wireframe (Desktop)

```
+----------------------------------------------------------------------+
| HEADER                                                               |
+----------------------------------------------------------------------+
|                                                                      |
|                       Skill Registry                                 |
|             Share and discover Claude Code skills                    |
|           +--------------------------------------------+             |
|           | [icon] Search skills...                     |             |
|           +--------------------------------------------+             |
|           [All] [Verified] [Most Installed] [Newest]                 |
|                                                                      |
| +------------------------------------------------------------------+|
| |  [shield] Check My Skills                                        ||
| |  Paste your skill configuration to get an instant validation     ||
| |  report with compatibility checks and best practice suggestions. ||
| |                                        [Open Validator]          ||
| +------------------------------------------------------------------+|
|                                                                      |
|  +------------------+  +------------------+  +------------------+    |
|  | [icon] [Verified]|  | [icon] [Pending] |  | [icon] [Verified]|   |
|  | git-workflow     |  | api-tester       |  | code-reviewer    |    |
|  | Automates git... |  | Tests API end... |  | Reviews code...  |    |
|  | @author  142x    |  | @author  38x     |  | @author  256x    |    |
|  | ```              |  | ```              |  | ```              |    |
|  | skill: git-wor.. |  | skill: api-te.. |  | skill: code-re.. |    |
|  | ...              |  | ...              |  | ...              |    |
|  | ```              |  | ```              |  | ```              |    |
|  | [Copy Install]   |  | [Copy Install]   |  | [Copy Install]   |    |
|  | [View Details]   |  | [View Details]   |  | [View Details]   |    |
|  +------------------+  +------------------+  +------------------+    |
+----------------------------------------------------------------------+
```

#### Key Interactions and Animations

1. **Verification badges**: Verified badge has a subtle shimmer animation
   (CSS `@keyframes` gradient sweep). Pending has a slow pulse.
2. **Copy Install**: Click triggers the existing CodeBlock copy pattern -- icon
   changes to checkmark, brief "Copied!" toast slides in from bottom-right.
3. **Skill Preview**: Code preview expand/collapse uses `AnimatePresence` with
   height auto-animation. Blurred gradient mask at bottom when collapsed.
4. **Validator**: Textarea has syntax-aware highlighting (optional). Validation
   runs with a progress indicator (spinning ring with gradient stroke).
   Results appear with staggered `fadeUp` per check item.
5. **Skill Detail Modal**: Enters with `scaleIn`. Background blurs (backdrop-blur-sm).
   Content sections stagger in.
6. **Filter pills**: Active filter has filled glass bg with primary color border.
   Switching filters triggers `AnimatePresence` on the grid.

#### Responsive Considerations

| Breakpoint | Changes |
|-----------|---------|
| < 640px | Single column grid. Validator CTA becomes more compact. Skill preview hidden by default. Quick filters become horizontal scroll. Modal becomes full-screen sheet (slides up from bottom). |
| 640-1023px | 2-column skill grid. Modal at 90% width. |
| >= 1024px | 3-column grid. Modal centered at max-w-4xl. |

#### Accessibility

- Search: `role="search"`, clear button with `aria-label`
- Filter pills: `role="radiogroup"` with `role="radio"` items
- Skill cards: `<article>` with skill name as heading
- Verification badge: `aria-label="Verified skill"` (not just visual)
- Copy button: `aria-live="polite"` region for "Copied" confirmation
- Code preview: `aria-expanded` toggle state
- Validator modal: focus trap, `aria-modal`, `role="dialog"`
- Validation results: `role="list"`, pass/fail announced via `aria-label`

---

### 3.4 User Profile (`/[locale]/profile/[username]`)

**Purpose:** Display user contributions, reputation, and activity.

#### Component Hierarchy

```
UserProfilePage
  +-- ProfileHeader
  |     +-- GlassPanel (full-width, mesh gradient background like HeroSection but subtler)
  |     +-- avatar (96px, glass border ring, gradient ring for reputation tier)
  |     +-- h1: display name
  |     +-- p: bio / tagline
  |     +-- ReputationBadge (bronze/silver/gold/platinum)
  |     +-- reputation score number
  |     +-- JoinDate
  |     +-- ProfileStats (horizontal row)
  |           +-- StatCard: Contributions
  |           +-- StatCard: Skills shared
  |           +-- StatCard: Helpful votes received
  |           +-- StatCard: Bookmarks
  |
  +-- ProfileTabBar
  |     +-- TabBar: Contributions | Skills | Bookmarks | Activity
  |
  +-- TabContent (AnimatePresence crossfade)
        +-- ContributionsTab
        |     +-- KnowledgeCard[] (same as Knowledge Hub cards)
        |     +-- sorted by recency, with edit/delete actions for own profile
        |
        +-- SkillsTab
        |     +-- SkillCard[] (same as Skill Registry cards)
        |     +-- "Share a Skill" CTA if empty
        |
        +-- BookmarksTab
        |     +-- KnowledgeCard[] (compact variant, no author since user is viewing own)
        |     +-- EmptyState if no bookmarks
        |
        +-- ActivityTab
              +-- ActivityTimeline
                    +-- ActivityItem[] (vertical timeline, like StepCard pattern)
                          +-- icon per type (publish, edit, comment, vote)
                          +-- description text
                          +-- relative timestamp
```

#### Layout Wireframe (Desktop)

```
+----------------------------------------------------------------------+
| HEADER                                                               |
+----------------------------------------------------------------------+
|                                                                      |
|  +----------------------------------------------------------------+  |
|  |  [mesh gradient bg, subtle]                                    |  |
|  |                                                                |  |
|  |  [====]   John Doe                                             |  |
|  |  [avatar] Claude Code power user                               |  |
|  |  [====]   [Gold Badge]  4,250 reputation                       |  |
|  |           Joined January 2026                                  |  |
|  |                                                                |  |
|  |  +----------+ +----------+ +----------+ +----------+           |  |
|  |  | 24       | | 6        | | 312      | | 18       |           |  |
|  |  | posts    | | skills   | | helpful  | | saved    |           |  |
|  |  +----------+ +----------+ +----------+ +----------+           |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  Contributions    Skills    Bookmarks    Activity                    |
|  ~~~~~~~~~~~~~                                                       |
|                                                                      |
|  +------------------+  +------------------+  +------------------+    |
|  | [Knowledge Card] |  | [Knowledge Card] |  | [Knowledge Card] |   |
|  +------------------+  +------------------+  +------------------+    |
|  +------------------+  +------------------+                          |
|  | [Knowledge Card] |  | [Knowledge Card] |                         |
|  +------------------+  +------------------+                          |
+----------------------------------------------------------------------+
```

#### Key Interactions and Animations

1. **Avatar**: On own profile, hover reveals a camera icon overlay for photo upload.
   Gradient ring color matches reputation tier (animated gradient rotation for platinum).
2. **Stats**: Numbers animate up from 0 on first viewport entry (CountUp animation
   using framer-motion `useSpring`).
3. **Tab switching**: Same `tabCrossfade` + `layoutId` underline as Knowledge Hub.
4. **Activity timeline**: Items stagger in with `fadeUp` on scroll, matching
   the existing StepCard timeline pattern.
5. **Own profile actions**: Edit/delete buttons appear on hover over own content cards
   with `fadeIn` animation.

#### Responsive Considerations

| Breakpoint | Changes |
|-----------|---------|
| < 640px | Profile header stacks vertically (avatar centered above name). Stats become 2x2 grid. Content grid single column. Tabs become horizontal scroll. |
| 640-1023px | Stats remain horizontal but smaller. Content grid 2 columns. |
| >= 1024px | Full horizontal layout. Content grid 3 columns. |

#### Accessibility

- Profile header: `<header>` with `<h1>` for name
- Reputation: `aria-label="Gold tier, 4250 reputation points"`
- Stats: `aria-label` on each stat (e.g., "24 contributions")
- Tabs: same `role="tablist"` pattern
- Activity timeline: `<ol>` ordered list with `<time>` elements
- Own profile actions: `aria-label="Edit this contribution"` / `"Delete this contribution"`

---

### 3.5 Contribution Flow (`/[locale]/contribute`)

**Purpose:** Guided form for sharing knowledge or skills with the community.

#### Component Hierarchy

```
ContributionFlowPage
  +-- ProgressStepper (top, horizontal steps with connecting line)
  |     +-- Step 1: Type
  |     +-- Step 2: Content
  |     +-- Step 3: Preview
  |     +-- Step 4: Publish
  |     (active step has blue gradient, completed steps have green check)
  |
  +-- StepContent (AnimatePresence between steps)
        +-- Step1_TypeSelection
        |     +-- h2: "What would you like to share?"
        |     +-- TypeCard grid (2x2)
        |           +-- GlassCard: Knowledge Article (icon, description)
        |           +-- GlassCard: Skill File (icon, description)
        |           +-- GlassCard: Case Study (icon, description)
        |           +-- GlassCard: Edit Suggestion (icon, description)
        |     each card selectable with radio behavior
        |
        +-- Step2_Content (varies by type)
        |     +-- FOR "Knowledge Article":
        |     |     +-- TitleInput (glass input, large text)
        |     |     +-- CategorySelect (GlassPill radio group)
        |     |     +-- LevelSelect (badge-styled radio group)
        |     |     +-- TagInput (type-ahead with glass pills)
        |     |     +-- MarkdownEditor
        |     |           +-- toolbar (bold, italic, heading, code, link, image)
        |     |           +-- split view: editor left, preview right
        |     |           +-- editor: monospace textarea with line numbers
        |     |           +-- preview: MarkdownRenderer (live, debounced)
        |     |
        |     +-- FOR "Skill File":
        |     |     +-- SkillNameInput
        |     |     +-- SkillDescriptionInput
        |     |     +-- SkillFileUploader
        |     |     |     +-- drag-and-drop zone (glass dashed border)
        |     |     |     +-- or paste textarea
        |     |     +-- auto-validation on upload (inline ValidationReport)
        |     |
        |     +-- FOR "Case Study":
        |     |     +-- TitleInput
        |     |     +-- IndustryTagSelect
        |     |     +-- BeforeAfterEditor (two markdown columns)
        |     |     +-- StepBreakdownEditor (ordered step list, add/remove)
        |     |
        |     +-- FOR "Edit Suggestion":
        |           +-- TargetEntrySearch (search for entry to edit)
        |           +-- DiffEditor (side-by-side, edit the right side)
        |           +-- EditSummaryInput
        |
        +-- Step3_Preview
        |     +-- full rendered preview of the submission
        |     +-- matches exact appearance of published entry
        |     +-- "This is how your contribution will appear"
        |     +-- [Back to Edit] [Continue to Publish]
        |
        +-- Step4_Publish
              +-- summary card (title, type, category)
              +-- licensing acknowledgment checkbox
              +-- [Publish] button (gradient, prominent)
              +-- success state: confetti/particle animation + link to published entry
```

#### Layout Wireframe (Desktop)

```
+----------------------------------------------------------------------+
| HEADER                                                               |
+----------------------------------------------------------------------+
|                                                                      |
|     [1 Type]----[2 Content]----[3 Preview]----[4 Publish]            |
|        *             o              o              o                 |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  |                                                                |  |
|  |   What would you like to share?                                |  |
|  |                                                                |  |
|  |   +---------------------------+  +---------------------------+ |  |
|  |   | [doc icon]                |  | [code icon]               | |  |
|  |   | Knowledge Article         |  | Skill File                | |  |
|  |   | Share guides, tutorials,  |  | Upload a validated skill  | |  |
|  |   | or best practices         |  | for others to install     | |  |
|  |   +---------------------------+  +---------------------------+ |  |
|  |   +---------------------------+  +---------------------------+ |  |
|  |   | [case icon]               |  | [edit icon]               | |  |
|  |   | Case Study                |  | Edit Suggestion           | |  |
|  |   | Before/after showcase     |  | Improve existing entry    | |  |
|  |   | with step breakdown       |  | with tracked changes      | |  |
|  |   +---------------------------+  +---------------------------+ |  |
|  |                                                                |  |
|  |                          [Next -->]                            |  |
|  +----------------------------------------------------------------+  |
+----------------------------------------------------------------------+
```

**Step 2 for Knowledge Article (split editor):**

```
|  +-------------------------------+-------------------------------+  |
|  | # My Article Title            | My Article Title              |  |
|  | [Category v] [Level v] [tags] |                               |  |
|  |                               |                               |  |
|  | [B] [I] [H] [</>] [link] [img] rendered preview             |  |
|  | -------------------------------- appears here with            |  |
|  | ## Introduction               | full styling matching         |  |
|  |                               | the published page            |  |
|  | When working with Claude...   |                               |  |
|  |                               | ## Introduction               |  |
|  | ```bash                       |                               |  |
|  | claude --config ...           | When working with Claude...   |  |
|  | ```                           |                               |  |
|  |                               | [styled code block]           |  |
|  | > TIP: Remember to...         |                               |  |
|  |                               | [styled TipBox]               |  |
|  +-------------------------------+-------------------------------+  |
```

#### Key Interactions and Animations

1. **Progress stepper**: Completed steps fill with green gradient. Current step
   pulses subtly. Connecting lines fill progressively (like Sidebar progress bar).
2. **Type selection**: Cards have radio behavior. Selected card gets a gradient
   border ring (blue-to-cyan) and subtle `scale: 1.02` with GlassCard hover effect.
3. **Markdown editor**: Live preview updates with 200ms debounce. Toolbar buttons
   have tooltip on hover. Split view has a draggable resizer bar.
4. **Skill upload**: Drag-and-drop zone pulses border on dragover. File validation
   runs automatically with check animation per validation rule.
5. **Step transitions**: `AnimatePresence` with `slideInRight` when advancing,
   reverse direction when going back.
6. **Publish success**: Particles emit from the publish button on success.
   Success card fades in with `heroBlurIn` variant.

#### Responsive Considerations

| Breakpoint | Changes |
|-----------|---------|
| < 640px | Progress stepper becomes vertical (left side) or collapses to "Step 2 of 4" label. Type cards stack to single column. Markdown editor switches from split view to tabbed view (Edit / Preview tabs). |
| 640-1023px | Type cards 2x2. Markdown split view with 50/50 or tabbed toggle. |
| >= 1024px | Full split view. All 4 progress steps visible. |

#### Accessibility

- Progress stepper: `role="navigation"`, `aria-label="Contribution progress"`,
  each step `aria-current="step"` for active, `aria-label="Step 1: Type, completed"`
- Type cards: `role="radiogroup"` with `role="radio"` + `aria-checked`
- Markdown editor: `<textarea>` with `aria-label="Markdown content editor"`
- Preview pane: `aria-live="polite"` for live updates
- Toolbar: each button with `aria-label` ("Bold", "Insert code block", etc.)
- File upload: `aria-label="Drop skill file here or click to browse"`
- Publish: `aria-busy` during submission

---

### 3.6 Case Studies Gallery (`/[locale]/case-studies`)

**Purpose:** Visual showcase of before/after transformations and implementation stories.

#### Component Hierarchy

```
CaseStudiesPage
  +-- CaseStudyHero (compact)
  |     +-- h1: "Case Studies"
  |     +-- p: "Real-world implementations and results"
  |     +-- FilterBar
  |           +-- IndustryFilter (GlassPill toggles)
  |           +-- UseCaseFilter (GlassPill toggles)
  |           +-- SortSelect
  |
  +-- FeaturedCaseStudy
  |     +-- GlassCard (full-width, tall)
  |     +-- split: image/visual left, content right
  |     +-- "Featured" GlassPill
  |     +-- h2: title
  |     +-- p: summary
  |     +-- tag pills (industry, use-case)
  |     +-- [Read Case Study] button
  |
  +-- CaseStudyGrid
        +-- motion.div with staggerGrid
        +-- CaseStudyCard[]
              +-- GlassCard
              +-- BeforeAfterPreview
              |     +-- split thumbnail (before | after)
              |     +-- or a slider handle for before/after reveal
              +-- h3: title
              +-- p: summary (2 lines)
              +-- TagRow (industry + use-case GlassPills)
              +-- MetaRow (author, date, read time)
```

**Case Study Detail Page** (`/[locale]/case-studies/[slug]`):

```
CaseStudyDetailPage
  +-- Breadcrumb
  +-- CaseStudyHeader
  |     +-- h1: title
  |     +-- tag pills
  |     +-- author + date
  |
  +-- BeforeAfterSection
  |     +-- h2: "Before & After"
  |     +-- BeforeAfterSlider
  |     |     +-- full-width interactive slider
  |     |     +-- drag handle to reveal before/after
  |     |     +-- or side-by-side CompareBox pattern (existing)
  |     +-- BeforeDescription + AfterDescription
  |
  +-- StepBreakdownSection
  |     +-- h2: "Step-by-Step Breakdown"
  |     +-- StepCard[] (existing component, reused)
  |           +-- each step: title, description, code/images
  |
  +-- ResultsSection
  |     +-- h2: "Results"
  |     +-- StatCard grid (metrics before/after)
  |     +-- testimonial quote (glass panel, large italic text)
  |
  +-- RelatedCaseStudies
        +-- h2: "More Case Studies"
        +-- CaseStudyCard[] (3 items)
```

#### Layout Wireframe (Gallery, Desktop)

```
+----------------------------------------------------------------------+
| HEADER                                                               |
+----------------------------------------------------------------------+
|                                                                      |
|                       Case Studies                                   |
|             Real-world implementations and results                   |
|                                                                      |
|  [All Industries] [SaaS] [E-commerce] [DevTools] [Education]        |
|  [All Use Cases] [Automation] [Code Review] [Testing] [Docs]        |
|                                                                      |
| +------------------------------------------------------------------+|
| |  [image/visual]       | FEATURED                                 ||
| |                       | How Acme Corp Automated Their             ||
| |                       | Code Review Pipeline                      ||
| |                       |                                           ||
| |                       | Reduced review time by 73% using...       ||
| |                       | [SaaS] [Code Review]                      ||
| |                       |             [Read Case Study -->]          ||
| +------------------------------------------------------------------+|
|                                                                      |
|  +------------------+  +------------------+  +------------------+    |
|  | [before | after] |  | [before | after] |  | [before | after] |   |
|  | Title            |  | Title            |  | Title            |    |
|  | Summary text...  |  | Summary text...  |  | Summary text...  |    |
|  | [DevTools] [Auto]|  | [SaaS] [Testing] |  | [Edu] [Docs]     |    |
|  | @author  5 min   |  | @author  8 min   |  | @author  4 min   |    |
|  +------------------+  +------------------+  +------------------+    |
+----------------------------------------------------------------------+
```

#### Key Interactions and Animations

1. **Before/After slider**: A draggable handle that reveals the "after" content
   as you slide right. CSS `clip-path` for the reveal effect. Handle has a glassmorphism
   pill shape with left/right arrows.
2. **Filter pills**: Toggle on/off with `scale: [1, 0.95, 1]` tap animation.
   Active filters have filled glass bg. Grid re-filters with `AnimatePresence`
   (exiting cards fade out, entering cards fade up with stagger).
3. **Featured card**: Parallax-lite on hover (image shifts slightly opposite to
   cursor direction). Content text has subtle slide-in on viewport entry.
4. **Case study cards**: Same GlassCard hover as Knowledge Hub. Before/after
   thumbnail has a subtle CSS animation cycling the slider position on hover.
5. **Step breakdown**: Reuses existing StepCard component entirely, maintaining
   the timeline visual pattern.

#### Responsive Considerations

| Breakpoint | Changes |
|-----------|---------|
| < 640px | Featured case study stacks (image on top). Filter pills horizontally scroll. Grid single column. Before/after slider touch-friendly (larger handle). |
| 640-1023px | Grid 2 columns. Featured keeps side-by-side. |
| >= 1024px | Grid 3 columns. Full featured layout. |

#### Accessibility

- Filter pills: `role="checkbox"` with `aria-checked` (multi-select)
- Before/After slider: `role="slider"`, `aria-label="Drag to compare before and after"`,
  `aria-valuemin="0"`, `aria-valuemax="100"`, keyboard arrow support
- Case study cards: `<article>` elements
- Step breakdown: `<ol>` ordered list (existing StepCard pattern)
- Images: meaningful `alt` text describing the before/after states

---

## 4. Global UX Patterns

### 4.1 Toast Notifications

```
Position: bottom-right (desktop), bottom-center (mobile)
Animation: slideUp + fadeIn from off-screen
Duration: 4 seconds, dismissible
Variants: success (green accent), error (red accent), info (blue accent)
Style: glass surface, border-left accent color (4px), max-w-sm
```

### 4.2 Empty States

All list views need empty states that match the Glacial Blue aesthetic:
- Subtle gradient illustration (SVG, blue-to-cyan gradient strokes)
- Clear heading explaining what goes here
- CTA button directing to the action that populates this view
- Animation: `heroBlurIn` on viewport entry

### 4.3 Loading States

```
Skeleton screens: glass surface cards with pulsing gradient shimmer
  - Shimmer: linear-gradient sweep animation (left to right, 1.5s loop)
  - Matches exact card layout dimensions
  - Colors: surface -> surface-hover -> surface (subtle pulse)

Inline spinners: gradient ring (blue-to-cyan stroke, rotating)
Full-page transitions: opacity crossfade (200ms)
```

### 4.4 Error States

```
Inline errors: red border-left accent on glass panel, error message text
Page-level: centered glass card with error illustration, retry button
Form validation: red ring on input, error text below with fadeIn animation
```

### 4.5 Theme Toggle (Light/Dark/System)

Add to Header, positioned between language switcher and user avatar:

```
ThemeToggle component:
  - Three-option segmented control (glass surface, compact)
  - Icons: sun / moon / monitor
  - Active option: filled bg with primary color
  - Stores preference in localStorage
  - System option follows prefers-color-scheme
  - Transition: 300ms ease on background-color and color changes
```

---

## 5. New Component File Structure

```
src/
  components/
    # Existing (unchanged)
    GlassCard.tsx
    HeroSection.tsx
    Header.tsx
    Sidebar.tsx
    ScrollFadeIn.tsx
    CodeBlock.tsx
    TipBox.tsx
    StepCard.tsx
    CompareBox.tsx
    FlowChart.tsx
    GuideImage.tsx
    ContentRenderer.tsx
    LanguageSwitcher.tsx
    MobileDrawer.tsx
    OsSelector.tsx
    PageHeader.tsx

    # New: Layout
    PageLayout.tsx              # Wrapper with layout variants
    ThemeToggle.tsx              # Light/dark/system toggle

    # New: Navigation
    TabBar.tsx                  # Animated underline tabs
    Breadcrumb.tsx              # Breadcrumb navigation

    # New: Knowledge
    KnowledgeCard.tsx           # Card for knowledge entries
    FeaturedKnowledgeCard.tsx   # Large featured variant
    MarkdownRenderer.tsx        # Rich markdown with component embedding
    DiffViewer.tsx              # Side-by-side or unified diff view
    VoteControls.tsx            # Upvote/downvote with animation
    CommentSection.tsx          # Comments with threading
    CommentItem.tsx             # Single comment
    VersionTimeline.tsx         # Version history display

    # New: Skills
    SkillCard.tsx               # Skill registry card
    SkillValidator.tsx          # Paste-and-validate tool
    VerificationBadge.tsx       # Verified/unverified/pending
    InstallCommand.tsx          # One-click copy install command

    # New: User
    AvatarStack.tsx             # Overlapping avatars
    ReputationBadge.tsx         # Tier badge (bronze/silver/gold/platinum)
    ActivityTimeline.tsx        # User activity feed
    ProfileHeader.tsx           # Profile hero section

    # New: Contribution
    ProgressStepper.tsx         # Multi-step form progress
    MarkdownEditor.tsx          # Split-view editor with toolbar
    SkillUploader.tsx           # Drag-and-drop skill file upload
    BeforeAfterEditor.tsx       # Dual-column case study editor
    TypeSelector.tsx            # Contribution type selection

    # New: Case Studies
    CaseStudyCard.tsx           # Gallery card
    BeforeAfterSlider.tsx       # Interactive comparison slider

    # New: Shared primitives
    GlassPill.tsx               # Category/tag chips
    GlassPanel.tsx              # Larger content containers
    SearchBar.tsx               # Unified search with filters
    StatCard.tsx                # Number + label stat display
    BadgeCluster.tsx            # Multiple badges in a row
    EmptyState.tsx              # Illustrated empty state
    Toast.tsx                   # Notification toast
    SkeletonCard.tsx            # Loading skeleton

  app/
    [locale]/
      layout.tsx                # Updated: conditional sidebar, theme support
      page.tsx                  # Existing home page (unchanged)
      setup/                    # Existing guide pages (unchanged)
      knowledge/
        page.tsx                # Knowledge Hub
        [slug]/
          page.tsx              # Knowledge Entry
      skills/
        page.tsx                # Skill Registry
      case-studies/
        page.tsx                # Case Studies Gallery
        [slug]/
          page.tsx              # Case Study Detail
      profile/
        [username]/
          page.tsx              # User Profile
      contribute/
        page.tsx                # Contribution Flow

  lib/
    motion.ts                   # Extended with new variants
```

---

## 6. Implementation Priority Order

### Phase 1: Foundation (implement first)
1. Extend `globals.css` with new custom properties
2. Extend `motion.ts` with new animation variants
3. Build `PageLayout.tsx` (layout variant system)
4. Build shared primitives: `GlassPill`, `GlassPanel`, `SearchBar`, `TabBar`, `StatCard`
5. Build `ThemeToggle.tsx` and integrate into Header
6. Update `Header.tsx` with new navigation links
7. Update `layout.tsx` with conditional sidebar logic

### Phase 2: Knowledge Hub
1. Build `KnowledgeCard`, `FeaturedKnowledgeCard`
2. Build Knowledge Hub page with search, tabs, grid
3. Build `MarkdownRenderer` (composes existing CodeBlock, TipBox)
4. Build `VoteControls`, `CommentSection`
5. Build Knowledge Entry page with full reading experience
6. Build `DiffViewer`, `VersionTimeline`
7. Trending news banner (X/Twitter API integration)

### Phase 3: Skill Registry
1. Build `SkillCard`, `VerificationBadge`, `InstallCommand`
2. Build Skill Registry page with search and grid
3. Build `SkillValidator` modal
4. Build skill detail modal

### Phase 4: User & Contribution
1. Build `ProfileHeader`, `ReputationBadge`, `ActivityTimeline`
2. Build User Profile page
3. Build `ProgressStepper`, `MarkdownEditor`, `SkillUploader`
4. Build Contribution Flow (all 4 steps)
5. Build edit suggestion workflow

### Phase 5: Case Studies
1. Build `CaseStudyCard`, `BeforeAfterSlider`
2. Build Case Studies Gallery
3. Build Case Study Detail page
4. Build `BeforeAfterEditor` for contribution flow

### Phase 6: Polish
1. Loading skeletons for all list views
2. Empty states for all list views
3. Toast notification system
4. Error boundaries and error states
5. Performance optimization (lazy loading, code splitting)
6. Full keyboard navigation audit
7. Screen reader testing pass

---

## 7. Integration Notes with Existing Design System

### What stays unchanged
- All existing components (GlassCard, HeroSection, CodeBlock, TipBox, StepCard,
  CompareBox, etc.) remain untouched
- Existing setup guide pages remain in their current layout
- The `--bg`, `--surface`, `--primary`, `--secondary`, `--accent`, `--text-1`,
  `--text-2`, `--border` token names stay the same
- Framer-motion patterns (EASE_APPLE, DURATION, heroBlurIn, fadeUp, staggerContainer)
  are extended, not replaced
- Geist font family, Tailwind v4, next-intl localization all stay

### What gets extended
- `globals.css` gains new tokens (surface-2, status colors, diff colors, etc.)
- `motion.ts` gains new variants (slideInRight, scaleIn, staggerGrid, tabCrossfade)
- `Header.tsx` gains new nav links, theme toggle, user avatar
- `layout.tsx` gains conditional sidebar rendering based on route

### Design DNA preservation
Every new component must:
1. Use `rounded-2xl` for cards, `rounded-xl` for inner elements, `rounded-full` for pills
2. Use `backdrop-blur-xl` and `bg-white/70 dark:bg-white/5` for glass surfaces
3. Use `border border-(--border)` with hover states transitioning to blue/cyan borders
4. Use `shadow-md` base with `hover:shadow-xl hover:shadow-blue-500/15` on interactive cards
5. Use the `group` + `group-hover:` pattern for coordinated hover effects
6. Use `bg-linear-to-br from-blue-500 to-cyan-500` for primary gradient accents
7. Animate with framer-motion using EASE_APPLE timing, never default browser easing
8. Support both light and dark modes via CSS custom properties, never hardcode colors
9. Include `prefers-reduced-motion` support (existing global rule handles this)
