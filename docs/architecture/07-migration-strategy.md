# Migration Strategy: Static Content to Database

## Current State

The platform currently stores all content as:
- React Server Component `.tsx` files with inline content
- Translation JSON files (`ko.json`, `en.json`, `ja.json`) with UI strings
- `src/lib/skill-registry/types.ts` defining skill shapes (types only, no data)
- No database, no persistent storage

## Target State

All content queryable from PostgreSQL (Supabase), served via Drizzle ORM through Next.js Server Actions and Route Handlers.

---

## Phase 0: Infrastructure Setup (Day 1)

```bash
# 1. Create Supabase project at supabase.com
#    Project name: ai-guide-prod
#    Region: ap-northeast-2 (Seoul — lowest latency for Korean users)
#    Postgres version: 16

# 2. Enable extensions
# Run in Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";       -- pgvector
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- trigram fuzzy search
CREATE EXTENSION IF NOT EXISTS "pg_cron";      -- scheduled jobs

# 3. Install dependencies
npm install drizzle-orm postgres @supabase/supabase-js @supabase/ssr
npm install -D drizzle-kit

# 4. Add environment variables to .env.local
# NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...   (server-only)
# DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
```

---

## Phase 1: Schema Deployment (Week 1)

Apply migrations in dependency order. Each migration is a standalone `.sql` file tracked by Drizzle Kit.

```
migrations/
  0001_extensions.sql       -- extensions (already done in Phase 0)
  0002_core_tables.sql      -- users, tags, categories
  0003_content_tables.sql   -- knowledge_entries, skills, case_studies, claude_configs
  0004_social_tables.sql    -- votes, comments, edit_suggestions
  0005_graph_tables.sql     -- content_relations, learning_paths, user_learning_progress
  0006_trending_tables.sql  -- trending_content
  0007_analytics_tables.sql -- analytics_events (partitioned), daily aggregates
  0008_versioning.sql       -- content_versions
  0009_scores.sql           -- content_scores
  0010_recommendation.sql   -- content_embeddings, recommendation_cache
  0011_rls_policies.sql     -- Row Level Security
  0012_indexes.sql          -- all GIN + trigram indexes
  0013_materialized_views.sql
  0014_seed_taxonomy.sql    -- categories, tags
```

Apply:
```bash
npx drizzle-kit migrate
```

---

## Phase 2: Taxonomy Seeding (Week 1)

Seed `categories` and `tags` from the existing content structure. Derived from the current setup page routes and translation files.

```sql
-- Categories (from existing route structure)
INSERT INTO categories (slug, label_ko, label_en, label_ja, icon, sort_order) VALUES
  ('setup',        '시작하기',      'Getting Started',  '始め方',    'rocket',     1),
  ('workflows',    '워크플로우',     'Workflows',        'ワークフロー', 'git-branch', 2),
  ('skills',       '스킬',         'Skills',           'スキル',    'zap',        3),
  ('case-studies', '사례 연구',     'Case Studies',     'ケーススタディ', 'bar-chart', 4),
  ('configs',      'CLAUDE.md 설정', 'CLAUDE.md Configs', 'CLAUDE.md設定', 'settings', 5),
  ('security',     '보안',         'Security',         'セキュリティ', 'shield',    6),
  ('costs',        '비용 관리',     'Cost Management',  'コスト管理', 'dollar-sign', 7),
  ('teams',        '팀 협업',       'Team Collaboration', 'チーム協力', 'users',    8);

-- Initial tags
INSERT INTO tags (slug, label_ko, label_en, label_ja, category) VALUES
  ('typescript',    '타입스크립트',  'TypeScript',    'TypeScript',    'language'),
  ('python',        '파이썬',       'Python',        'Python',        'language'),
  ('react',         '리액트',       'React',         'React',         'framework'),
  ('next-js',       'Next.js',      'Next.js',       'Next.js',       'framework'),
  ('claude-code',   'Claude Code',  'Claude Code',   'Claude Code',   'tool'),
  ('testing',       '테스트',       'Testing',       'テスト',         'concept'),
  ('refactoring',   '리팩토링',     'Refactoring',   'リファクタリング', 'concept'),
  ('debugging',     '디버깅',       'Debugging',     'デバッグ',       'concept'),
  ('devops',        'DevOps',       'DevOps',        'DevOps',        'concept'),
  ('beginner',      '초보',         'Beginner',      '初心者',         'level'),
  ('advanced',      '고급',         'Advanced',      '上級',           'level');
```

---

## Phase 3: Content Migration Script (Week 2)

A one-time Node.js migration script reads existing TSX page content and seeds the database.

```
scripts/
  migrate-content.ts    -- main orchestrator
  extract-tsx.ts        -- parse TSX files into structured data
  seed-knowledge.ts     -- insert knowledge_entries
  seed-skills.ts        -- insert skill records from types.ts examples
  generate-embeddings.ts -- call OpenAI API, populate content_embeddings
  generate-scores.ts    -- populate content_scores with initial zeros
```

### Extract Strategy for TSX Pages

Each `src/app/[locale]/setup/*/page.tsx` is a self-contained guide page. The migration script:

1. Reads the i18n translation JSON (`en.json`) for the page's title and summary
2. Renders the RSC component to static HTML (using `react-dom/server`)
3. Converts HTML to Markdown via `turndown`
4. Inserts as a `knowledge_entry` with `content_type = 'article'`

```typescript
// scripts/migrate-content.ts (sketch)
import { readFileSync, readdirSync } from 'fs'
import { db } from '../src/lib/db'
import { knowledgeEntries } from '../src/lib/db/schema'
import TurndownService from 'turndown'

const SETUP_PAGES = [
  { route: 'claude-code',       category: 'setup',     difficulty: 'beginner' },
  { route: 'vscode',            category: 'setup',     difficulty: 'beginner' },
  { route: 'memory',            category: 'setup',     difficulty: 'intermediate' },
  { route: 'workflow',          category: 'workflows', difficulty: 'intermediate' },
  { route: 'agent-teams',       category: 'workflows', difficulty: 'advanced' },
  { route: 'best-practices',    category: 'workflows', difficulty: 'intermediate' },
  { route: 'common-workflows',  category: 'workflows', difficulty: 'intermediate' },
  { route: 'security',          category: 'security',  difficulty: 'intermediate' },
  { route: 'costs',             category: 'costs',     difficulty: 'beginner' },
  { route: 'pixel-agents',      category: 'workflows', difficulty: 'advanced' },
  { route: 'claude-web',        category: 'setup',     difficulty: 'beginner' },
]

async function main() {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
  const enMessages = JSON.parse(readFileSync('src/messages/en.json', 'utf-8'))

  for (const page of SETUP_PAGES) {
    const pageKey = page.route.replace(/-/g, '_')
    const title_en = enMessages?.setup?.[pageKey]?.title ?? page.route
    const summary_en = enMessages?.setup?.[pageKey]?.description ?? ''

    // Read TSX source for ko/ja content extraction
    const tsxPath = `src/app/[locale]/setup/${page.route}/page.tsx`
    const tsxSource = readFileSync(tsxPath, 'utf-8')

    await db.insert(knowledgeEntries).values({
      slug: page.route,
      contentType: 'article',
      status: 'published',
      difficultyLevel: page.difficulty,
      titleEn: title_en,
      summaryEn: summary_en,
      // body_en extracted from TSX + rendered to markdown
      publishedAt: new Date(),
    }).onConflictDoNothing()

    console.log(`Migrated: ${page.route}`)
  }
}

main().catch(console.error)
```

---

## Phase 4: Incremental Adoption (Weeks 3–8)

Static TSX pages continue to work during migration. New pages are database-driven. A feature flag controls which rendering path is active per route.

```typescript
// src/lib/content-source.ts
export type ContentSource = 'static' | 'database'

export function getContentSource(slug: string): ContentSource {
  const DB_ENABLED_ROUTES = new Set([
    // Add routes here as they are migrated and validated
    'claude-code',
    'memory',
  ])
  return DB_ENABLED_ROUTES.has(slug) ? 'database' : 'static'
}
```

Migration checklist per route:
- [ ] Insert into `knowledge_entries` via migration script
- [ ] Validate rendered output matches static version
- [ ] Generate embedding for semantic search
- [ ] Switch feature flag to `'database'`
- [ ] Remove or archive the static TSX body content

---

## Phase 5: User-Generated Content (Month 2+)

Once the read path is database-driven, enable write paths:
- Contribution form → inserts draft `knowledge_entry`
- Edit suggestion form → inserts `edit_suggestion`
- Skill publish flow → inserts `skill` + `skill_version`
- Voting / commenting → inserts `vote`, `comment`

---

## Rollback Plan

If the database migration causes issues, the static RSC rendering path remains functional as a fallback. The feature flag in `content-source.ts` can revert all routes to `'static'` in a single deploy.

Database rollback: `npx drizzle-kit rollback` reverts the last applied migration file.
