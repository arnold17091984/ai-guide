# Database Selection & Justification

## Deployment Context

- **Framework**: Next.js 16 (App Router, RSC, Server Actions)
- **Runtime**: Vercel (serverless functions, edge runtime optional)
- **Scale**: Collaborative knowledge platform, read-heavy, multilingual (ko/en/ja)
- **Team size**: Small team to mid-scale community

---

## Candidate Comparison

### PostgreSQL (Neon / Supabase-hosted)

| Dimension | Assessment |
|-----------|-----------|
| Full-text search | Native `tsvector` / `tsquery`, GIN indexes — excellent |
| Graph queries | Recursive CTEs for knowledge graph traversal |
| JSON support | `jsonb` for flexible metadata (frontmatter, metrics) |
| Schema flexibility | Full DDL control, migrations via Drizzle |
| Vercel integration | Neon serverless driver zero-cold-start via HTTP |
| Cost at low scale | Neon free tier: 0.5 GB storage, 191.9 compute hours/mo |
| Branching (dev/staging) | Neon database branching — instant, zero-copy |
| Connection pooling | PgBouncer built into Neon; Supabase has Supavisor |
| Real-time | Supabase Realtime (Postgres logical replication) |

### SQLite + Turso/LibSQL

| Dimension | Assessment |
|-----------|-----------|
| Full-text search | FTS5 extension — good but weaker than pg |
| Graph queries | Limited recursive CTE support |
| JSON support | JSON1 extension — adequate |
| Vercel integration | HTTP client works, but edge replication adds latency |
| Cost at low scale | Very cheap — Turso free tier is generous |
| Branching | Not available |
| Multi-region reads | Turso edge replicas — strong read latency win |
| Write scalability | Single-writer bottleneck at scale |

### Supabase (hosted PostgreSQL)

| Dimension | Assessment |
|-----------|-----------|
| Auth | Built-in: email, OAuth, magic link — saves weeks |
| Storage | Built-in object storage for avatars, assets |
| Full-text search | Postgres-native, plus pgvector for semantic search |
| Real-time | Broadcast + presence channels built in |
| Row-level security | Declarative, policy-based — matches multi-tenant needs |
| Vercel integration | Official Supabase + Vercel integration, env injection |
| Cost at low scale | Free tier: 500 MB DB, 1 GB storage, 50k MAU auth |
| ORM compatibility | Works with Drizzle, Prisma, or raw SQL |
| Migrations | Supabase CLI migrations OR Drizzle migrations |

### PlanetScale (MySQL-compatible)

| Dimension | Assessment |
|-----------|-----------|
| Full-text search | Basic FULLTEXT index — significantly weaker than pg |
| Schema changes | Non-blocking DDL via branching — strong DevEx |
| JSON support | JSON column type — adequate |
| Vitess sharding | Overkill for this scale; adds complexity |
| Free tier | Discontinued free tier in 2024 — cost concern |
| pgvector | Not available (MySQL) |
| Verdict | Eliminated: no free tier, weaker FTS, no vector search |

---

## Recommendation: Supabase (PostgreSQL)

**Primary reasons:**

1. **Auth is pre-built.** User profiles, OAuth (GitHub/Google), JWT sessions, and row-level security are production-ready out of the box. Building this on raw Neon adds 2–4 weeks.

2. **Full-text + vector search.** `tsvector` handles keyword search today. `pgvector` (available as Supabase extension) handles semantic similarity for the recommendation engine without adding a separate vector store.

3. **Real-time for collaboration.** Edit suggestions, live vote counts, and trending content benefit from Supabase Realtime (Postgres logical replication → client WebSocket).

4. **Row-level security maps to content governance.** Contribution visibility (draft/pending/published), moderator access, and private team configs are expressible as RLS policies — enforced at the DB layer, not application layer.

5. **Storage for assets.** Case study attachments, user avatars, and skill package bundles can go into Supabase Storage (S3-compatible) without a separate CDN service.

6. **Vercel integration is first-class.** One-click env injection, preview branches hit the same Supabase project.

**ORM choice: Drizzle ORM**

Drizzle is chosen over Prisma for three reasons:
- Schema-as-TypeScript (no separate `.prisma` file to parse)
- Serverless-native: no connection pool daemon, works with Supabase's `postgres.js` or `@supabase/supabase-js`
- First-class support for Postgres-specific features: `tsvector`, `jsonb`, generated columns, CTEs

**Migration path from Supabase → Neon (if needed):**
Both are hosted PostgreSQL. The Drizzle schema, RLS policies, and all SQL are portable. Migration = `pg_dump | pg_restore`.

---

## Dependency Stack

```
supabase               — client SDK (auth, realtime, storage)
drizzle-orm            — ORM + query builder
drizzle-kit            — migrations CLI
postgres               — low-level PG driver (used by Drizzle)
@supabase/ssr          — server-side auth helpers for Next.js App Router
```

Install command:
```bash
npm install drizzle-orm postgres @supabase/supabase-js @supabase/ssr
npm install -D drizzle-kit
```
