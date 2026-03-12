# AI Guide Platform Expansion - Comprehensive Plan

**Date:** 2026-03-12
**Status:** Planning Complete - Ready for Implementation
**Synthesized from:** 10 specialist agent analyses

---

## Executive Summary

Transform AI Guide from a static educational site into **the definitive collaborative platform for Claude Code knowledge sharing**. This plan synthesizes architecture, UX, security, tooling, and product strategy into a phased implementation roadmap.

---

## Architecture Overview

### Tech Stack Decision

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 16 (App Router) | Already in use; RSC + Server Actions |
| **Database** | PostgreSQL via Neon | Serverless, full-text search, pgvector, branching |
| **ORM** | Drizzle ORM | Type-safe, zero-runtime overhead |
| **Auth** | NextAuth v5 + GitHub OAuth | Community-standard, extensible |
| **Cache** | Redis (Upstash) | X API cache, session data, hot content |
| **Storage** | S3-compatible (Cloudflare R2) | Skill file uploads, avatars |
| **Search** | PostgreSQL tsvector + pgvector | Keyword + semantic, no external service needed |
| **i18n** | next-intl (ko/en/ja) | Already in use |
| **Animation** | framer-motion | Already in use |

### Database Schema (Key Entities)

```
users ──── knowledge_entries ──── content_versions
  │              │
  │              ├── entry_votes / comments
  │              └── suggested_edits
  │
  ├──── skills ──── skill_versions
  ├──── case_studies
  ├──── claude_configs (CLAUDE.md shares)
  ├──── user_reputation_events
  └──── team_packages
```

**Content Versioning:** Hybrid full-snapshot + computed delta. O(1) rollback, diff display via cached patches.

**Search:** Unified multi-table search across knowledge entries, skills, case studies. Multilingual (ko: simple tokenizer, en: stemming, ja: simple tokenizer). Autocomplete via pg_trgm.

**Knowledge Graph:** Polymorphic `content_relations` edge table with recursive CTE traversal. Skill dependency materialized closure for install planning.

---

## Core Features (7 Pillars)

### 1. Knowledge Base (Community Wiki)
- Versioned markdown entries with suggested edits (Wikipedia-style)
- Categories: Workflow, Prompt Engineering, Agent Config, Memory, Security, DevOps
- Voting, commenting, and reputation-weighted ranking
- Multilingual content with per-locale versioning

### 2. Skill Registry
- Upload, validate, and share Claude Code skill files (.md)
- **Validation pipeline:** Frontmatter parsing > Schema validation > Security scan > Compatibility check
- Star/download tracking, dependency resolution
- CLI tool: `npx tsx skill-validator validate ./my-skill.md`

### 3. CLAUDE.md Analyzer
- Upload and score CLAUDE.md files against best practices
- Conflict detection (contradictory rules)
- Improvement suggestions with severity levels
- Template library for common project types

### 4. Team Sync
- Export/import skill packages as JSON
- Diff comparison between team members' configs
- "Standard Kit" catalog for teams
- Knowledge debt metric: measures gap between team members

### 5. Trending AI Content Aggregation
- 4-source pipeline: X API v2, Hacker News, GitHub, Reddit
- Relevance scoring + quality filtering
- Stale-while-revalidate caching (Redis)
- Curated "editor's picks" by moderators

### 6. Case Studies
- Structured templates: Context > Challenge > Solution > Results > Lessons
- Real-world Claude Code usage stories
- Difficulty-tagged (beginner/intermediate/advanced)
- Code snippets with syntax highlighting

### 7. Gamification & Progression
- 6-level proficiency system (Novice > Apprentice > Practitioner > Expert > Master > Sage)
- XP from contributions, verified skills, community votes
- Badges for achievements (First Contribution, 10 Skills Shared, etc.)
- Team leaderboards and knowledge debt dashboards

---

## Security Architecture

### Authentication & Authorization
- **Auth:** NextAuth v5 with GitHub OAuth (primary), email magic link (secondary)
- **RBAC:** 4 roles (viewer / contributor / moderator / admin)
- **Session:** JWT with httpOnly secure cookies, 15-min access + 7-day refresh
- **CSRF:** Double-submit cookie pattern for Server Actions

### Content Security
- **Markdown sanitization:** DOMPurify with strict allowlist
- **Skill files:** Security scan for dangerous patterns (shell injection, env exfiltration)
- **Rate limiting:** Sliding window per endpoint type (100/min read, 20/min write)
- **Quarantine:** Skills flagged by security scan held for moderator review

---

## UX Architecture (30+ Components)

### New Pages
1. **Knowledge Base** — Browse/search/contribute entries
2. **Skill Registry** — Discover, validate, install skills
3. **CLAUDE.md Workshop** — Analyze and improve configs
4. **Trending** — Aggregated AI content feed
5. **Case Studies** — Real-world usage stories
6. **Profile** — User dashboard, contributions, reputation
7. **Team Dashboard** — Sync status, knowledge debt, packages

### Design System Extensions
- Surface hierarchy (--surface-2, --surface-3) for nested cards
- Status colors (verified/unverified/pending/rejected)
- Reputation tier colors (bronze/silver/gold/platinum)
- Diff display tokens (added/removed backgrounds)

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
**Goal:** Database, auth, and base infrastructure

- [ ] Set up Neon PostgreSQL + Drizzle ORM schema
- [ ] Implement NextAuth v5 with GitHub OAuth
- [ ] Create RBAC middleware and session management
- [ ] Set up Redis (Upstash) for caching
- [ ] Build user profile page with settings
- [ ] Deploy database migrations pipeline

### Phase 2: Knowledge Base (Weeks 4-6)
**Goal:** Core content creation and discovery

- [ ] Knowledge entry CRUD with markdown editor
- [ ] Content versioning system (full snapshot + diff)
- [ ] Suggested edits workflow (propose > review > merge)
- [ ] Voting and commenting system
- [ ] Full-text search with multilingual support
- [ ] Category and tag management

### Phase 3: Skill Registry (Weeks 7-9)
**Goal:** Share and validate Claude Code skills

- [ ] Skill upload with validation pipeline
- [ ] Registry browse/search UI
- [ ] Star and download tracking
- [ ] Dependency resolution and install guides
- [ ] CLI validator tool (standalone npx command)
- [ ] CLAUDE.md analyzer with template library

### Phase 4: Community & Gamification (Weeks 10-11)
**Goal:** Engagement and progression systems

- [ ] Reputation system with XP calculations
- [ ] Badge system with unlock criteria
- [ ] 6-level proficiency progression
- [ ] User contribution dashboard
- [ ] Notification system (in-app)

### Phase 5: Content Aggregation (Week 12)
**Goal:** Trending AI content feed

- [ ] X API v2 integration with rate-limit-aware polling
- [ ] Hacker News + GitHub + Reddit scrapers
- [ ] Relevance scoring and quality filtering
- [ ] Cached feed with stale-while-revalidate
- [ ] Moderator curation tools

### Phase 6: Team Features (Week 13)
**Goal:** Team knowledge synchronization

- [ ] Team creation and member management
- [ ] Skill package export/import
- [ ] Config diff comparison UI
- [ ] Knowledge debt metric and dashboard
- [ ] Standard kit catalog

### Phase 7: Case Studies & Polish (Weeks 14-15)
**Goal:** Case studies and launch readiness

- [ ] Case study templates and submission flow
- [ ] Featured content and editor's picks
- [ ] Performance optimization (ISR, streaming)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Launch checklist and monitoring setup

---

## MVP Scope (Phase 1-3)

The minimum viable product covers **Phases 1-3** (9 weeks):
- User auth + profiles
- Knowledge base with versioning
- Skill registry with validation
- Search and discovery
- Basic reputation (contribution counting)

This delivers the core value proposition: **share and discover verified Claude Code knowledge**.

---

## Deliverables Produced by Specialist Agents

| Agent | Output | Location |
|-------|--------|----------|
| Product Manager | Product strategy, personas, roadmap | [PRODUCT_STRATEGY.md](../PRODUCT_STRATEGY.md) |
| Backend Architect | DB schema, API routes, caching | [docs/backend-architecture.md](backend-architecture.md) |
| Data Engineer | Database selection | [docs/architecture/01-database-selection.md](architecture/01-database-selection.md) |
| Data Engineer | Entity relationships | [docs/architecture/02-erd.md](architecture/02-erd.md) |
| Data Engineer | Knowledge graph design | [docs/architecture/03-knowledge-graph.md](architecture/03-knowledge-graph.md) |
| Data Engineer | Content versioning | [docs/architecture/04-versioning.md](architecture/04-versioning.md) |
| Data Engineer | Search & discovery | [docs/architecture/05-search-discovery.md](architecture/05-search-discovery.md) |
| UX Architect | Component specs, pages, design system | [docs/architecture/ux-architecture.md](architecture/ux-architecture.md) |
| Tooling Engineer | Skill types, validator, analyzer, CLI | [src/lib/skill-registry/*](../src/lib/skill-registry/) |
| Security Engineer | Auth, RBAC, content security, rate limiting | Embedded in backend architecture |
| UX Researcher | Proficiency system, gamification | Embedded in UX architecture |
| X API Designer | Aggregation pipeline, scoring | Embedded in backend architecture |
| Research Analyst | Competitive analysis, market gaps, monetization | [docs/COMPETITIVE_ANALYSIS.md](COMPETITIVE_ANALYSIS.md) |

---

## Strategic Intelligence (from Competitive Analysis)

### Market Window

The competitive window is **open but narrowing**:
- **cursor.directory** is the strongest analogical precedent (searchable rules by tech stack)
- **SkillsMP / SkillHub / MCPMarket** have 7,000+ skills but zero quality signals
- **Agent Skills open standard** (Dec 2025) adopted by both Anthropic AND OpenAI — cross-platform opportunity
- **Enterprise demand accelerating**: 73% daily AI coding adoption (Developer Survey 2026)

### Three Most Defensible Positions

1. **Canonical CLAUDE.md pattern library** with community quality signals
2. **Team/enterprise onboarding packs** replacing ad-hoc documentation
3. **Multilingual platform** (ko/en/ja) — Japanese/Korean communities currently ignored

### Six Critical Market Gaps We Address

| Gap | Our Solution |
|-----|-------------|
| No searchable CLAUDE.md library | CLAUDE.md Workshop with templates, ratings, tech stack filters |
| No team onboarding standard | Team Sync with onboarding packs |
| No quality signal for skills | Community voting, verified tier, freshness dating |
| No multi-agent pattern repo | Knowledge Base with orchestration category |
| Non-English communities underserved | First-class ko/en/ja with CJK search optimization |
| No knowledge decay solution | Deprecation warnings, freshness signals, auto-update tracking |

### Monetization Path

| Tier | Price | Target |
|------|-------|--------|
| Free | $0 | Community growth (browse, contribute, basic profile) |
| Pro | ~$15-20/mo | Individual developers (private content, AI recommendations) |
| Team | ~$30-50/user/mo | Engineering teams (private KB, analytics, onboarding packs) |
| Enterprise | Custom | SSO, audit logging, private marketplace, SLA |

**Marketplace**: Premium CLAUDE.md packs ($50-200), team onboarding kits ($500-2,000), 15-20% platform fee.

### Community Design Principles (Avoiding Stack Overflow's Failures)

- Separate reputation tracks for content, curation, and moderation
- Value before contribution (instant utility like CLAUDE.md analyzer)
- Financial micro-rewards via GitHub Sponsors integration
- DAU/MAU target: 10-20% (healthy developer community benchmark)
