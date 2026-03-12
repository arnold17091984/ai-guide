# Backend Architecture: ai-guide Collaborative Platform

## 1. Architecture Overview

### Current State
- Static Next.js 16 site with React 19, Tailwind v4, next-intl (ko/en/ja)
- No database, no API routes, no authentication
- Content hardcoded in page components and i18n JSON files
- Deployed as static pages under `src/app/[locale]/setup/*`

### Target State
- Full-stack Next.js 16 application with App Router API routes
- PostgreSQL database via Drizzle ORM (type-safe, zero-runtime overhead)
- GitHub OAuth via NextAuth.js v5
- Redis for caching (X API, session data, hot content)
- S3-compatible object storage for skill file uploads
- Server Components for reads, Server Actions for mutations

### Why PostgreSQL (not SQLite)

SQLite is tempting for simplicity, but this platform needs:
- **Concurrent writes**: Multiple users editing, voting, commenting simultaneously
- **Full-text search**: PostgreSQL `tsvector`/`tsquery` is production-grade out of the box
- **JSON columns**: Skill metadata, flexible schema fields
- **Row-level security**: Future multi-tenant considerations
- **Scaling path**: Read replicas, connection pooling via PgBouncer, managed hosting (Neon, Supabase, RDS)

**Recommendation**: Use Neon (serverless PostgreSQL) for development and production. Zero cold-start penalty with their serverless driver, generous free tier, branching for preview deployments.

---

## 2. Database Schema

### Entity Relationship Summary

```
users ─────────────────┬─── knowledge_entries ──── knowledge_versions
  │                    │         │
  │                    │         ├── entry_votes
  │                    │         ├── comments
  │                    │         └── suggested_edits
  │                    │
  │                    ├─── skills ──── skill_versions
  │                    │
  │                    ├─── notifications
  │                    └─── user_reputation_events
  │
  └─── sessions / accounts (NextAuth managed)
```

### Complete SQL Schema

```sql
-- ============================================================
-- USERS & AUTH (NextAuth v5 compatible tables)
-- ============================================================

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255),
    email         VARCHAR(255) UNIQUE,
    email_verified TIMESTAMPTZ,
    image         TEXT,
    -- Extended profile fields
    github_username VARCHAR(100) UNIQUE,
    bio           TEXT,
    locale        VARCHAR(5) DEFAULT 'ko',  -- ko, en, ja
    reputation    INTEGER DEFAULT 0 CHECK (reputation >= 0),
    level         SMALLINT DEFAULT 1 CHECK (level >= 1),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                VARCHAR(50) NOT NULL,
    provider            VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token       TEXT,
    access_token        TEXT,
    expires_at          INTEGER,
    token_type          VARCHAR(50),
    scope               TEXT,
    id_token            TEXT,
    session_state       TEXT,
    UNIQUE(provider, provider_account_id)
);

CREATE TABLE sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires       TIMESTAMPTZ NOT NULL
);

CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token      VARCHAR(255) NOT NULL,
    expires    TIMESTAMPTZ NOT NULL,
    UNIQUE(identifier, token)
);

-- ============================================================
-- KNOWLEDGE BASE
-- ============================================================

CREATE TYPE knowledge_category AS ENUM (
    'skills',
    'workflows',
    'memory_configs',
    'best_practices',
    'case_studies'
);

CREATE TYPE content_status AS ENUM (
    'draft',
    'published',
    'archived'
);

CREATE TABLE knowledge_entries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug          VARCHAR(300) UNIQUE NOT NULL,
    author_id     UUID NOT NULL REFERENCES users(id),
    category      knowledge_category NOT NULL,
    status        content_status DEFAULT 'draft',
    locale        VARCHAR(5) NOT NULL DEFAULT 'ko',  -- Original language
    title         VARCHAR(500) NOT NULL,
    summary       VARCHAR(1000),
    content       TEXT NOT NULL,                      -- Markdown
    tags          TEXT[] DEFAULT '{}',
    vote_score    INTEGER DEFAULT 0,
    view_count    INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    current_version INTEGER DEFAULT 1,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    published_at  TIMESTAMPTZ
);

-- Partial indexes for common query patterns
CREATE INDEX idx_entries_published
    ON knowledge_entries(category, vote_score DESC, published_at DESC)
    WHERE status = 'published';

CREATE INDEX idx_entries_author
    ON knowledge_entries(author_id, created_at DESC);

CREATE INDEX idx_entries_tags
    ON knowledge_entries USING gin(tags);

-- Full-text search index (supports Korean via pg_bigm or textsearch_ko extension)
CREATE INDEX idx_entries_search
    ON knowledge_entries
    USING gin(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '')));

-- Wiki-style version history
CREATE TABLE knowledge_versions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id      UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
    version       INTEGER NOT NULL,
    title         VARCHAR(500) NOT NULL,
    content       TEXT NOT NULL,
    edit_summary  VARCHAR(500),
    editor_id     UUID NOT NULL REFERENCES users(id),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entry_id, version)
);

CREATE INDEX idx_versions_entry
    ON knowledge_versions(entry_id, version DESC);

-- Voting
CREATE TABLE entry_votes (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_id   UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
    value      SMALLINT NOT NULL CHECK (value IN (-1, 1)),  -- downvote / upvote
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, entry_id)
);

-- ============================================================
-- SKILL REGISTRY
-- ============================================================

CREATE TABLE skills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(300) UNIQUE NOT NULL,
    author_id       UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    trigger_patterns TEXT[] NOT NULL DEFAULT '{}',    -- e.g. {"/deploy", "/test"}
    category        knowledge_category DEFAULT 'skills',
    -- The actual skill content (YAML/JSON stored as text)
    content         TEXT NOT NULL,
    content_format  VARCHAR(10) DEFAULT 'yaml' CHECK (content_format IN ('yaml', 'json', 'toml')),
    -- Validation status
    is_validated    BOOLEAN DEFAULT FALSE,
    validation_errors JSONB,
    -- Metadata
    download_count  INTEGER DEFAULT 0,
    vote_score      INTEGER DEFAULT 0,
    current_version INTEGER DEFAULT 1,
    status          content_status DEFAULT 'draft',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skills_published
    ON skills(vote_score DESC, download_count DESC)
    WHERE status = 'published';

CREATE INDEX idx_skills_triggers
    ON skills USING gin(trigger_patterns);

CREATE TABLE skill_versions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id    UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    version     INTEGER NOT NULL,
    content     TEXT NOT NULL,
    changelog   VARCHAR(500),
    editor_id   UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(skill_id, version)
);

-- ============================================================
-- COMMENTS
-- ============================================================

CREATE TABLE comments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id     UUID NOT NULL REFERENCES users(id),
    -- Polymorphic: can attach to entries or skills
    entry_id      UUID REFERENCES knowledge_entries(id) ON DELETE CASCADE,
    skill_id      UUID REFERENCES skills(id) ON DELETE CASCADE,
    parent_id     UUID REFERENCES comments(id) ON DELETE CASCADE,  -- Threaded replies
    content       TEXT NOT NULL,
    is_deleted    BOOLEAN DEFAULT FALSE,  -- Soft delete for threads
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    -- Exactly one target must be set
    CONSTRAINT comment_target CHECK (
        (entry_id IS NOT NULL AND skill_id IS NULL) OR
        (entry_id IS NULL AND skill_id IS NOT NULL)
    )
);

CREATE INDEX idx_comments_entry ON comments(entry_id, created_at) WHERE entry_id IS NOT NULL;
CREATE INDEX idx_comments_skill ON comments(skill_id, created_at) WHERE skill_id IS NOT NULL;

-- ============================================================
-- SUGGESTED EDITS (PR-style content contributions)
-- ============================================================

CREATE TYPE edit_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');

CREATE TABLE suggested_edits (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id      UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
    author_id     UUID NOT NULL REFERENCES users(id),
    reviewer_id   UUID REFERENCES users(id),
    status        edit_status DEFAULT 'pending',
    title         VARCHAR(500) NOT NULL,
    content       TEXT NOT NULL,           -- The proposed full content
    edit_summary  VARCHAR(500) NOT NULL,   -- Why this change
    review_note   VARCHAR(500),            -- Reviewer's feedback
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at   TIMESTAMPTZ
);

CREATE INDEX idx_edits_pending
    ON suggested_edits(entry_id, created_at DESC)
    WHERE status = 'pending';

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TYPE notification_type AS ENUM (
    'comment_reply',
    'entry_comment',
    'edit_approved',
    'edit_rejected',
    'edit_suggested',
    'vote_milestone',    -- e.g. "Your entry reached 10 upvotes"
    'level_up'
);

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        notification_type NOT NULL,
    title       VARCHAR(255) NOT NULL,
    body        TEXT,
    link        VARCHAR(500),           -- Relative URL to navigate to
    is_read     BOOLEAN DEFAULT FALSE,
    metadata    JSONB,                  -- Flexible payload
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user
    ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- REPUTATION SYSTEM
-- ============================================================

CREATE TYPE reputation_event_type AS ENUM (
    'entry_published',      -- +10
    'entry_upvoted',        -- +5
    'entry_downvoted',      -- -2
    'edit_approved',         -- +5
    'skill_published',       -- +10
    'skill_downloaded',      -- +1
    'comment_posted',        -- +1
    'edit_suggested'         -- +2
);

CREATE TABLE user_reputation_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type  reputation_event_type NOT NULL,
    points      INTEGER NOT NULL,
    reference_id UUID,                  -- The entry/skill/comment that triggered this
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reputation_user
    ON user_reputation_events(user_id, created_at DESC);

-- ============================================================
-- X (TWITTER) CACHE
-- ============================================================

CREATE TABLE twitter_cache (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query           VARCHAR(255) NOT NULL,
    tweet_id        VARCHAR(50) NOT NULL,
    author_handle   VARCHAR(100),
    content         TEXT,
    relevance_score FLOAT DEFAULT 0,
    engagement      JSONB,               -- {likes, retweets, replies}
    fetched_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL, -- Cache TTL
    UNIQUE(query, tweet_id)
);

CREATE INDEX idx_twitter_cache_query
    ON twitter_cache(query, relevance_score DESC)
    WHERE expires_at > NOW();
```

### Level Thresholds

```
Level 1: 0 reputation      (Newcomer)
Level 2: 50 reputation     (Contributor)
Level 3: 200 reputation    (Active Contributor)
Level 4: 500 reputation    (Trusted Contributor)
Level 5: 1000 reputation   (Expert)
Level 6: 2500 reputation   (Master)
Level 7: 5000 reputation   (Legend)
```

---

## 3. TypeScript Data Models

All models live in `src/lib/db/schema.ts` using Drizzle ORM.

```typescript
// src/lib/db/schema.ts

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  real,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---- Enums ----

export const knowledgeCategoryEnum = pgEnum("knowledge_category", [
  "skills",
  "workflows",
  "memory_configs",
  "best_practices",
  "case_studies",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "published",
  "archived",
]);

export const editStatusEnum = pgEnum("edit_status", [
  "pending",
  "approved",
  "rejected",
  "withdrawn",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "comment_reply",
  "entry_comment",
  "edit_approved",
  "edit_rejected",
  "edit_suggested",
  "vote_milestone",
  "level_up",
]);

export const reputationEventTypeEnum = pgEnum("reputation_event_type", [
  "entry_published",
  "entry_upvoted",
  "entry_downvoted",
  "edit_approved",
  "skill_published",
  "skill_downloaded",
  "comment_posted",
  "edit_suggested",
]);

// ---- Users & Auth ----

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  githubUsername: varchar("github_username", { length: 100 }).unique(),
  bio: text("bio"),
  locale: varchar("locale", { length: 5 }).default("ko"),
  reputation: integer("reputation").default(0),
  level: smallint("level").default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 50 }),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: varchar("session_token", { length: 255 }).unique().notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

// ---- Knowledge Entries ----

export const knowledgeEntries = pgTable("knowledge_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 300 }).unique().notNull(),
  authorId: uuid("author_id").notNull().references(() => users.id),
  category: knowledgeCategoryEnum("category").notNull(),
  status: contentStatusEnum("status").default("draft"),
  locale: varchar("locale", { length: 5 }).notNull().default("ko"),
  title: varchar("title", { length: 500 }).notNull(),
  summary: varchar("summary", { length: 1000 }),
  content: text("content").notNull(),
  tags: text("tags").array().default(sql`'{}'`),
  voteScore: integer("vote_score").default(0),
  viewCount: integer("view_count").default(0),
  commentCount: integer("comment_count").default(0),
  currentVersion: integer("current_version").default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export const knowledgeVersions = pgTable("knowledge_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id").notNull().references(() => knowledgeEntries.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  editSummary: varchar("edit_summary", { length: 500 }),
  editorId: uuid("editor_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const entryVotes = pgTable("entry_votes", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  entryId: uuid("entry_id").notNull().references(() => knowledgeEntries.id, { onDelete: "cascade" }),
  value: smallint("value").notNull(), // -1 or 1
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: { columns: [table.userId, table.entryId] },
}));

// ---- Skills ----

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 300 }).unique().notNull(),
  authorId: uuid("author_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  triggerPatterns: text("trigger_patterns").array().default(sql`'{}'`),
  category: knowledgeCategoryEnum("category").default("skills"),
  content: text("content").notNull(),
  contentFormat: varchar("content_format", { length: 10 }).default("yaml"),
  isValidated: boolean("is_validated").default(false),
  validationErrors: jsonb("validation_errors"),
  downloadCount: integer("download_count").default(0),
  voteScore: integer("vote_score").default(0),
  currentVersion: integer("current_version").default(1),
  status: contentStatusEnum("status").default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ---- Comments, Suggested Edits, Notifications, Reputation ----
// (Follow same pattern as above - omitted for brevity, full types below)
```

### Application-Layer TypeScript Interfaces

```typescript
// src/types/models.ts

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  githubUsername: string | null;
  bio: string | null;
  locale: "ko" | "en" | "ja";
  reputation: number;
  level: number;
  createdAt: Date;
}

export interface UserProfile extends User {
  entryCount: number;
  skillCount: number;
  commentCount: number;
  recentEntries: KnowledgeEntrySummary[];
  recentSkills: SkillSummary[];
}

export type KnowledgeCategory =
  | "skills"
  | "workflows"
  | "memory_configs"
  | "best_practices"
  | "case_studies";

export type ContentStatus = "draft" | "published" | "archived";

export interface KnowledgeEntry {
  id: string;
  slug: string;
  authorId: string;
  category: KnowledgeCategory;
  status: ContentStatus;
  locale: string;
  title: string;
  summary: string | null;
  content: string;       // Markdown
  tags: string[];
  voteScore: number;
  viewCount: number;
  commentCount: number;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface KnowledgeEntrySummary {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: KnowledgeCategory;
  tags: string[];
  voteScore: number;
  viewCount: number;
  commentCount: number;
  authorName: string;
  authorImage: string | null;
  publishedAt: Date | null;
}

export interface KnowledgeVersion {
  id: string;
  entryId: string;
  version: number;
  title: string;
  content: string;
  editSummary: string | null;
  editorId: string;
  editorName: string;
  createdAt: Date;
}

export interface Skill {
  id: string;
  slug: string;
  authorId: string;
  name: string;
  description: string | null;
  triggerPatterns: string[];
  content: string;
  contentFormat: "yaml" | "json" | "toml";
  isValidated: boolean;
  validationErrors: Record<string, string> | null;
  downloadCount: number;
  voteScore: number;
  currentVersion: number;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  triggerPatterns: string[];
  downloadCount: number;
  voteScore: number;
  authorName: string;
}

export interface SkillValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    severity: "error" | "warning";
  }>;
  parsedSkill: Partial<Skill> | null;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  entryId: string | null;
  skillId: string | null;
  parentId: string | null;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  replies?: Comment[];    // Populated client-side from flat list
}

export interface SuggestedEdit {
  id: string;
  entryId: string;
  authorId: string;
  authorName: string;
  reviewerId: string | null;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  title: string;
  content: string;
  editSummary: string;
  reviewNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// ---- API Response Wrappers ----

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;  // Field-level validation errors
}
```

---

## 4. API Route Design

All API routes live under `src/app/api/` and are locale-independent (API responses are data, not pages).

### Route Map

```
src/app/api/
  auth/
    [...nextauth]/route.ts          # NextAuth handler

  knowledge/
    route.ts                         # GET (list/search), POST (create)
    [slug]/
      route.ts                       # GET (single), PATCH (update), DELETE
      versions/
        route.ts                     # GET (version history)
        [version]/route.ts           # GET (specific version)
      vote/route.ts                  # POST (upvote/downvote)
      comments/route.ts             # GET, POST
      suggested-edits/
        route.ts                     # GET, POST
        [editId]/
          route.ts                   # PATCH (approve/reject)

  skills/
    route.ts                         # GET (list), POST (create)
    [slug]/
      route.ts                       # GET, PATCH, DELETE
      versions/route.ts             # GET
      download/route.ts             # GET (increments counter, returns file)
      vote/route.ts                 # POST
    validate/route.ts               # POST (validate skill content without saving)
    import/route.ts                 # POST (upload skill file)

  users/
    me/route.ts                     # GET (current user profile)
    me/notifications/
      route.ts                       # GET, PATCH (mark read)
    [username]/route.ts             # GET (public profile)
    [username]/entries/route.ts     # GET (user's entries)
    [username]/skills/route.ts      # GET (user's skills)

  twitter/
    trending/route.ts               # GET (cached trending content)

  upload/
    route.ts                         # POST (signed URL generation)
```

### Example Route Implementations

```typescript
// src/app/api/knowledge/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeEntries, users } from "@/lib/db/schema";
import { eq, desc, and, sql, ilike, arrayContains } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";

// ---- GET: List / Search knowledge entries ----
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const search = searchParams.get("q");
  const sort = searchParams.get("sort") ?? "recent"; // recent | top | trending
  const locale = searchParams.get("locale");

  const conditions = [eq(knowledgeEntries.status, "published")];

  if (category) {
    conditions.push(eq(knowledgeEntries.category, category as any));
  }
  if (locale) {
    conditions.push(eq(knowledgeEntries.locale, locale));
  }
  if (tag) {
    conditions.push(arrayContains(knowledgeEntries.tags, [tag]));
  }

  let query = db
    .select({
      id: knowledgeEntries.id,
      slug: knowledgeEntries.slug,
      title: knowledgeEntries.title,
      summary: knowledgeEntries.summary,
      category: knowledgeEntries.category,
      tags: knowledgeEntries.tags,
      voteScore: knowledgeEntries.voteScore,
      viewCount: knowledgeEntries.viewCount,
      commentCount: knowledgeEntries.commentCount,
      publishedAt: knowledgeEntries.publishedAt,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(knowledgeEntries)
    .innerJoin(users, eq(knowledgeEntries.authorId, users.id))
    .where(and(...conditions));

  // Full-text search
  if (search) {
    query = query.where(
      sql`to_tsvector('simple', coalesce(${knowledgeEntries.title}, '') || ' ' || coalesce(${knowledgeEntries.content}, '')) @@ plainto_tsquery('simple', ${search})`
    );
  }

  // Sorting
  const orderBy =
    sort === "top"
      ? desc(knowledgeEntries.voteScore)
      : sort === "trending"
        ? desc(sql`(${knowledgeEntries.voteScore} * 2 + ${knowledgeEntries.viewCount}) / EXTRACT(EPOCH FROM (NOW() - ${knowledgeEntries.publishedAt})) * 3600`)
        : desc(knowledgeEntries.publishedAt);

  const offset = (page - 1) * pageSize;

  const [results, countResult] = await Promise.all([
    query.orderBy(orderBy).limit(pageSize).offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(knowledgeEntries)
      .where(and(...conditions)),
  ]);

  const totalCount = Number(countResult[0].count);

  return NextResponse.json({
    data: results,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNext: page * pageSize < totalCount,
    },
  });
}

// ---- POST: Create a new knowledge entry ----
const createEntrySchema = z.object({
  title: z.string().min(5).max(500),
  content: z.string().min(50),
  summary: z.string().max(1000).optional(),
  category: z.enum(["skills", "workflows", "memory_configs", "best_practices", "case_studies"]),
  tags: z.array(z.string().max(50)).max(10).default([]),
  locale: z.enum(["ko", "en", "ja"]).default("ko"),
  status: z.enum(["draft", "published"]).default("draft"),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, content, summary, category, tags, locale, status } = parsed.data;

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 200)
    + "-" + Date.now().toString(36);

  const entry = await db.transaction(async (tx) => {
    const [newEntry] = await tx
      .insert(knowledgeEntries)
      .values({
        slug,
        authorId: session.user.id,
        title,
        content,
        summary: summary ?? null,
        category,
        tags,
        locale,
        status,
        publishedAt: status === "published" ? new Date() : null,
      })
      .returning();

    // Create initial version
    await tx.insert(knowledgeVersions).values({
      entryId: newEntry.id,
      version: 1,
      title,
      content,
      editSummary: "Initial version",
      editorId: session.user.id,
    });

    // Award reputation if published
    if (status === "published") {
      await tx.insert(userReputationEvents).values({
        userId: session.user.id,
        eventType: "entry_published",
        points: 10,
        referenceId: newEntry.id,
      });
      await tx
        .update(users)
        .set({ reputation: sql`${users.reputation} + 10` })
        .where(eq(users.id, session.user.id));
    }

    return newEntry;
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}
```

```typescript
// src/app/api/skills/validate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import yaml from "yaml";

// Claude Code skill file schema
const skillFileSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  trigger: z.union([
    z.string(),
    z.array(z.string()),
  ]),
  // The actual instructions/content
  instructions: z.string().min(1),
  // Optional fields
  arguments: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    required: z.boolean().default(false),
  })).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { content, format = "yaml" } = body;

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { valid: false, errors: [{ path: "content", message: "Content is required", severity: "error" }], parsedSkill: null },
      { status: 400 }
    );
  }

  const errors: Array<{ path: string; message: string; severity: "error" | "warning" }> = [];
  let parsed: unknown;

  // Step 1: Parse the format
  try {
    parsed = format === "json" ? JSON.parse(content) : yaml.parse(content);
  } catch (e) {
    return NextResponse.json({
      valid: false,
      errors: [{ path: "content", message: `Invalid ${format}: ${(e as Error).message}`, severity: "error" }],
      parsedSkill: null,
    });
  }

  // Step 2: Validate against schema
  const result = skillFileSchema.safeParse(parsed);

  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push({
        path: issue.path.join("."),
        message: issue.message,
        severity: "error",
      });
    }
    return NextResponse.json({ valid: false, errors, parsedSkill: null });
  }

  // Step 3: Warnings (non-blocking)
  const skill = result.data;
  if (skill.description.length < 20) {
    errors.push({ path: "description", message: "Description is very short. Consider adding more detail.", severity: "warning" });
  }

  const triggers = Array.isArray(skill.trigger) ? skill.trigger : [skill.trigger];
  for (const t of triggers) {
    if (!t.startsWith("/")) {
      errors.push({ path: "trigger", message: `Trigger "${t}" should start with /`, severity: "warning" });
    }
  }

  return NextResponse.json({
    valid: errors.every((e) => e.severity !== "error"),
    errors,
    parsedSkill: {
      name: skill.name,
      description: skill.description,
      triggerPatterns: triggers,
    },
  });
}
```

```typescript
// src/app/api/knowledge/[slug]/vote/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeEntries, entryVotes, users, userReputationEvents } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
  }

  const { slug } = await params;
  const { value } = await request.json();

  if (value !== 1 && value !== -1) {
    return NextResponse.json({ code: "INVALID_VOTE", message: "Value must be 1 or -1" }, { status: 400 });
  }

  const [entry] = await db
    .select({ id: knowledgeEntries.id, authorId: knowledgeEntries.authorId })
    .from(knowledgeEntries)
    .where(eq(knowledgeEntries.slug, slug));

  if (!entry) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Entry not found" }, { status: 404 });
  }

  // Cannot vote on own content
  if (entry.authorId === session.user.id) {
    return NextResponse.json({ code: "SELF_VOTE", message: "Cannot vote on your own content" }, { status: 403 });
  }

  await db.transaction(async (tx) => {
    // Upsert vote
    const [existing] = await tx
      .select()
      .from(entryVotes)
      .where(and(eq(entryVotes.userId, session.user.id), eq(entryVotes.entryId, entry.id)));

    const scoreDelta = existing ? value - existing.value : value;

    if (existing) {
      if (existing.value === value) {
        // Remove vote (toggle off)
        await tx.delete(entryVotes).where(
          and(eq(entryVotes.userId, session.user.id), eq(entryVotes.entryId, entry.id))
        );
        // Reverse the score
        await tx.update(knowledgeEntries)
          .set({ voteScore: sql`${knowledgeEntries.voteScore} - ${existing.value}` })
          .where(eq(knowledgeEntries.id, entry.id));
        return;
      }
      await tx.update(entryVotes)
        .set({ value })
        .where(and(eq(entryVotes.userId, session.user.id), eq(entryVotes.entryId, entry.id)));
    } else {
      await tx.insert(entryVotes).values({
        userId: session.user.id,
        entryId: entry.id,
        value,
      });
    }

    // Update denormalized score
    await tx.update(knowledgeEntries)
      .set({ voteScore: sql`${knowledgeEntries.voteScore} + ${scoreDelta}` })
      .where(eq(knowledgeEntries.id, entry.id));

    // Reputation for author
    const repPoints = value === 1 ? 5 : -2;
    await tx.insert(userReputationEvents).values({
      userId: entry.authorId,
      eventType: value === 1 ? "entry_upvoted" : "entry_downvoted",
      points: repPoints,
      referenceId: entry.id,
    });
    await tx.update(users)
      .set({ reputation: sql`GREATEST(0, ${users.reputation} + ${repPoints})` })
      .where(eq(users.id, entry.authorId));
  });

  // Return updated score
  const [updated] = await db
    .select({ voteScore: knowledgeEntries.voteScore })
    .from(knowledgeEntries)
    .where(eq(knowledgeEntries.id, entry.id));

  return NextResponse.json({ data: { voteScore: updated.voteScore } });
}
```

---

## 5. Authentication Flow

### Stack: NextAuth.js v5 + GitHub OAuth

```typescript
// src/lib/auth.ts

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          githubUsername: profile.login,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Attach user ID and custom fields to session
      session.user.id = user.id;
      session.user.githubUsername = (user as any).githubUsername;
      session.user.reputation = (user as any).reputation;
      session.user.level = (user as any).level;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",  // Custom sign-in page
  },
});
```

```typescript
// src/app/api/auth/[...nextauth]/route.ts

import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### Auth Flow Diagram

```
1. User clicks "Sign in with GitHub" button
2. Redirect to GitHub OAuth consent screen
3. GitHub redirects back with authorization code
4. NextAuth exchanges code for access token (server-side)
5. NextAuth fetches GitHub profile
6. DrizzleAdapter creates/updates user in PostgreSQL
7. Session cookie set (httpOnly, secure, sameSite: lax)
8. Subsequent requests: auth() reads session from cookie + DB
```

### Middleware Protection

```typescript
// src/middleware.ts (updated)

import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { auth } from "./lib/auth";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication
const protectedPatterns = [
  /\/knowledge\/new/,
  /\/skills\/new/,
  /\/profile\/edit/,
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes skip intl middleware
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check auth for protected routes
  const isProtected = protectedPatterns.some((p) => p.test(pathname));
  if (isProtected) {
    const session = await auth();
    if (!session) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(ko|en|ja)/:path*", "/api/:path*"],
};
```

---

## 6. Caching Strategy

### Three-Tier Cache Architecture

```
Client (SWR/React Query)  -->  Redis (hot data)  -->  PostgreSQL (source of truth)
```

### Redis Cache Configuration

```typescript
// src/lib/redis.ts

import { Redis } from "@upstash/redis";  // Serverless Redis, works on edge/serverless

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache helpers with type safety
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const existing = await redis.get<T>(key);
  if (existing !== null) return existing;

  const fresh = await fetcher();
  await redis.set(key, fresh, { ex: ttlSeconds });
  return fresh;
}

export async function invalidate(...patterns: string[]) {
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

### Cache Key Strategy and TTLs

```
Cache Key                                    TTL        Invalidation Trigger
─────────────────────────────────────────────────────────────────────────────
knowledge:list:{category}:{page}:{sort}      5min       On entry create/update/vote
knowledge:entry:{slug}                       10min      On entry update/vote
knowledge:entry:{slug}:versions              30min      On new version
knowledge:entry:{slug}:comments              2min       On new comment

skills:list:{page}:{sort}                    5min       On skill create/update
skills:entry:{slug}                          10min      On skill update

user:profile:{username}                      15min      On profile update/reputation change
user:notifications:{userId}:unread           30sec      On new notification / mark read

twitter:trending                             15min      On scheduled refresh
twitter:trending:{query}                     15min      On scheduled refresh
```

### X (Twitter) API Caching

```typescript
// src/lib/twitter.ts

import { redis, cached } from "@/lib/redis";
import { db } from "@/lib/db";
import { twitterCache } from "@/lib/db/schema";
import { gt, desc, eq } from "drizzle-orm";

const TWITTER_BEARER = process.env.TWITTER_BEARER_TOKEN!;
const CACHE_TTL = 15 * 60; // 15 minutes
const RATE_LIMIT_KEY = "twitter:rate_limit";

interface TweetData {
  id: string;
  text: string;
  authorHandle: string;
  engagement: { likes: number; retweets: number; replies: number };
  relevanceScore: number;
}

export async function getTrendingClaudeContent(): Promise<TweetData[]> {
  return cached("twitter:trending:claude_code", CACHE_TTL, async () => {
    // Check rate limit (X API v2 basic: 300 requests / 15 min)
    const remaining = await redis.get<number>(RATE_LIMIT_KEY);
    if (remaining !== null && remaining <= 5) {
      // Fall back to DB cache
      return getFromDbCache("claude code");
    }

    const queries = [
      '"claude code" -is:retweet lang:en',
      '"claude code" -is:retweet lang:ko',
      '"AI coding assistant" claude -is:retweet',
    ];

    const allTweets: TweetData[] = [];

    for (const query of queries) {
      try {
        const response = await fetch(
          `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=20&tweet.fields=public_metrics,author_id,created_at`,
          {
            headers: { Authorization: `Bearer ${TWITTER_BEARER}` },
            next: { revalidate: CACHE_TTL },
          }
        );

        if (response.status === 429) {
          const resetAt = response.headers.get("x-rate-limit-reset");
          const ttl = resetAt ? parseInt(resetAt) - Math.floor(Date.now() / 1000) : 900;
          await redis.set(RATE_LIMIT_KEY, 0, { ex: ttl });
          break;
        }

        const data = await response.json();
        if (!data.data) continue;

        for (const tweet of data.data) {
          const metrics = tweet.public_metrics;
          const relevance = scoreRelevance(tweet.text, metrics);

          allTweets.push({
            id: tweet.id,
            text: tweet.text,
            authorHandle: tweet.author_id, // Resolve separately if needed
            engagement: {
              likes: metrics.like_count,
              retweets: metrics.retweet_count,
              replies: metrics.reply_count,
            },
            relevanceScore: relevance,
          });
        }
      } catch (err) {
        console.error(`Twitter fetch failed for query: ${query}`, err);
      }
    }

    // Sort by relevance and deduplicate
    const sorted = allTweets
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 30);

    // Persist to DB for fallback
    await persistToDbCache("claude code", sorted);

    return sorted;
  });
}

function scoreRelevance(
  text: string,
  metrics: { like_count: number; retweet_count: number; reply_count: number }
): number {
  let score = 0;

  // Keyword relevance
  const keywords = ["claude code", "claude-code", "anthropic", "ai coding", "skill", "workflow", "mcp"];
  for (const kw of keywords) {
    if (text.toLowerCase().includes(kw)) score += 10;
  }

  // Engagement signals (log scale to avoid outlier dominance)
  score += Math.log2(1 + metrics.like_count) * 3;
  score += Math.log2(1 + metrics.retweet_count) * 5;
  score += Math.log2(1 + metrics.reply_count) * 2;

  // Penalize very short tweets (likely low-quality)
  if (text.length < 50) score *= 0.5;

  return Math.round(score * 100) / 100;
}

async function persistToDbCache(query: string, tweets: TweetData[]) {
  const expiresAt = new Date(Date.now() + CACHE_TTL * 1000);
  for (const tweet of tweets) {
    await db
      .insert(twitterCache)
      .values({
        query,
        tweetId: tweet.id,
        authorHandle: tweet.authorHandle,
        content: tweet.text,
        relevanceScore: tweet.relevanceScore,
        engagement: tweet.engagement,
        fetchedAt: new Date(),
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [twitterCache.query, twitterCache.tweetId],
        set: { relevanceScore: tweet.relevanceScore, engagement: tweet.engagement, expiresAt },
      });
  }
}

async function getFromDbCache(query: string): Promise<TweetData[]> {
  const rows = await db
    .select()
    .from(twitterCache)
    .where(gt(twitterCache.expiresAt, new Date()))
    .orderBy(desc(twitterCache.relevanceScore))
    .limit(30);

  return rows.map((r) => ({
    id: r.tweetId,
    text: r.content ?? "",
    authorHandle: r.authorHandle ?? "",
    engagement: r.engagement as any,
    relevanceScore: r.relevanceScore ?? 0,
  }));
}
```

---

## 7. File Storage for Skill Configs

### Strategy: S3-compatible storage with signed URLs

For a Next.js platform, use Cloudflare R2 (S3-compatible, zero egress fees) or AWS S3.

```typescript
// src/lib/storage.ts

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT!,        // e.g. Cloudflare R2 endpoint
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;

// Generate a presigned upload URL (client uploads directly to S3)
export async function getUploadUrl(
  key: string,
  contentType: string,
  maxSizeBytes: number = 512 * 1024  // 512KB max for skill files
): Promise<{ uploadUrl: string; key: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: maxSizeBytes,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
  return { uploadUrl, key };
}

// Generate a presigned download URL
export async function getDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
}

// Storage key conventions:
// skills/{userId}/{skillSlug}/v{version}.yaml
// skills/{userId}/{skillSlug}/v{version}.json
```

### Skill Import/Export Flow

```typescript
// src/app/api/skills/[slug]/download/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const [skill] = await db
    .select()
    .from(skills)
    .where(eq(skills.slug, slug));

  if (!skill || skill.status !== "published") {
    return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  }

  // Increment download counter (fire-and-forget)
  db.update(skills)
    .set({ downloadCount: sql`${skills.downloadCount} + 1` })
    .where(eq(skills.id, skill.id))
    .execute();

  // Return skill content as downloadable file
  const ext = skill.contentFormat === "json" ? "json" : "yaml";
  const filename = `${skill.slug}.${ext}`;

  return new NextResponse(skill.content, {
    headers: {
      "Content-Type": skill.contentFormat === "json" ? "application/json" : "text/yaml",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

---

## 8. Scalability Considerations

### Phase 1: Launch (0-1k users)

```
Infrastructure:
  - Vercel (Next.js hosting, serverless functions)
  - Neon PostgreSQL (serverless, free tier: 0.5 GB)
  - Upstash Redis (serverless, free tier: 10k commands/day)
  - Cloudflare R2 (free tier: 10 GB storage)

Estimated cost: $0-20/month
```

### Phase 2: Growth (1k-10k users)

```
Changes needed:
  - Neon Pro ($19/mo, autoscaling, read replicas)
  - Upstash Pro ($10/mo, 10M commands/day)
  - Add connection pooling (Neon has built-in PgBouncer)
  - Enable ISR (Incremental Static Regeneration) for popular entries
  - Add CDN caching headers for API responses

Estimated cost: $30-80/month
```

### Phase 3: Scale (10k+ users)

```
Changes needed:
  - Dedicated PostgreSQL or RDS (if query volume exceeds serverless limits)
  - Redis cluster for session + cache separation
  - Background job queue (Inngest or Trigger.dev) for:
    * Twitter API polling (cron every 15 min)
    * Notification delivery
    * Reputation recalculation
    * Search index updates
  - Consider full-text search migration to Meilisearch/Typesense if
    PostgreSQL FTS becomes a bottleneck
  - Rate limiting per-user (not just per-IP) via Redis sliding window

Estimated cost: $100-300/month
```

### Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Entry list page | < 100ms p95 | Redis cache + DB index on (status, category, vote_score) |
| Single entry load | < 80ms p95 | Redis cache + slug unique index |
| Full-text search | < 200ms p95 | GIN index on tsvector, limit results to 50 |
| Vote action | < 150ms p95 | Single transaction, denormalized score |
| Skill validation | < 500ms p95 | CPU-bound YAML parse + Zod validation, no DB |
| Auth check | < 20ms p95 | Session cookie + Redis session cache |

### Key Architecture Decisions

1. **Denormalized counters** (`vote_score`, `comment_count`, `view_count` on entries/skills) avoid expensive COUNT queries. Updated transactionally on write.

2. **Soft deletes for comments** preserve thread structure. Deleted comments show as "[deleted]" but replies remain visible.

3. **Version table separate from main table** keeps the hot path (reading current content) fast. Version history is a cold path accessed rarely.

4. **Polymorphic comments** (entry_id OR skill_id) with a CHECK constraint avoid two separate comment tables while maintaining referential integrity.

5. **Suggested edits store full content**, not diffs. This simplifies the review UI (just render the proposed version) and avoids diff-merge complexity. Diffs are computed client-side for the review view.

6. **Twitter data cached in both Redis and PostgreSQL**. Redis for speed, PostgreSQL as a fallback when rate-limited. The DB cache also enables historical analysis of trending topics.

---

## 9. Required Dependencies

```json
{
  "dependencies": {
    "next-auth": "^5.0.0",
    "@auth/drizzle-adapter": "^1.0.0",
    "drizzle-orm": "^0.40.0",
    "@neondatabase/serverless": "^1.0.0",
    "@upstash/redis": "^1.34.0",
    "@aws-sdk/client-s3": "^3.700.0",
    "@aws-sdk/s3-request-presigner": "^3.700.0",
    "zod": "^3.24.0",
    "yaml": "^2.7.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.0"
  }
}
```

### Environment Variables Required

```bash
# .env.local (NEVER commit this file)

# Database
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# Auth
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
NEXTAUTH_SECRET=xxx          # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Storage
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
S3_BUCKET=ai-guide-skills

# Twitter
TWITTER_BEARER_TOKEN=xxx
```

---

## 10. Migration Path from Current Static Site

### Phase 1: Foundation (Week 1-2)
1. Install Drizzle ORM + Neon, run initial migration
2. Set up NextAuth with GitHub OAuth
3. Create `src/lib/db/` with schema and connection
4. Add auth pages (`/auth/signin`)
5. Update middleware for auth + intl coexistence

### Phase 2: Knowledge Base (Week 3-4)
1. Build API routes for knowledge CRUD
2. Create form pages for entry creation/editing
3. Implement version history
4. Add voting system
5. Build listing pages with search and filters

### Phase 3: Skills + Community (Week 5-6)
1. Skill registry API routes
2. Skill validation endpoint
3. Import/export functionality
4. Comments system
5. Suggested edits workflow
6. Notifications

### Phase 4: Social + Polish (Week 7-8)
1. X API integration with caching
2. User profiles and reputation display
3. Trending content feed
4. Performance optimization and caching
5. Rate limiting and abuse prevention

### Directory Structure After Implementation

```
src/
  app/
    [locale]/
      layout.tsx                    # Existing (add SessionProvider)
      page.tsx                      # Existing homepage
      setup/                        # Existing static pages (keep as-is)
      knowledge/
        page.tsx                    # Knowledge listing
        new/page.tsx                # Create entry (protected)
        [slug]/
          page.tsx                  # View entry
          edit/page.tsx             # Edit entry (protected)
          history/page.tsx          # Version history
      skills/
        page.tsx                    # Skill registry listing
        new/page.tsx                # Create skill (protected)
        [slug]/page.tsx             # View skill
      profile/
        [username]/page.tsx         # Public profile
        edit/page.tsx               # Edit own profile (protected)
      auth/
        signin/page.tsx             # Custom sign-in page
    api/
      auth/[...nextauth]/route.ts
      knowledge/...                 # As specified above
      skills/...
      users/...
      twitter/...
  lib/
    auth.ts                         # NextAuth config
    db/
      index.ts                      # DB connection
      schema.ts                     # Drizzle schema
      migrations/                   # Generated by drizzle-kit
    redis.ts                        # Redis client + cache helpers
    storage.ts                      # S3 client
    twitter.ts                      # X API client
    validators/
      knowledge.ts                  # Zod schemas for knowledge entries
      skills.ts                     # Zod schemas for skills
  types/
    models.ts                       # Shared TypeScript interfaces
    next-auth.d.ts                  # NextAuth type augmentation
```
