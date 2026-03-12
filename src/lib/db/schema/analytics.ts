import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  timestamp,
  date,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

// ============================================================
// trending_content
// ============================================================
// External content fetched from X API, GitHub, Hacker News, etc.

export const trendingContent = pgTable(
  "trending_content",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // 'x_api' | 'github' | 'hacker_news' | 'reddit'
    source: text("source").notNull(),

    // Source-specific ID (tweet ID, HN item ID, etc.)
    externalId: text("external_id").notNull(),

    url: text("url").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),

    authorHandle: text("author_handle"),
    authorName: text("author_name"),

    // Raw platform metrics { likes, retweets, views, score }
    rawMetrics: jsonb("raw_metrics").notNull().default(sql`'{}'`),

    // Normalized relevance score 0–1 (computed on ingest)
    relevanceScore: real("relevance_score").notNull().default(0),

    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    publishedAt: timestamp("published_at", { withTimezone: true }),

    // TTL for automatic cache eviction (cron job)
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    // Manually promoted by a moderator; ignores expiresAt
    isCurated: boolean("is_curated").notNull().default(false),

    curatedBy: uuid("curated_by").references(() => users.id),
  },
  (t) => [
    uniqueIndex("trending_content_source_uk").on(t.source, t.externalId),
    index("trending_score_idx").on(t.relevanceScore),
    index("trending_expires_idx").on(t.expiresAt),
  ],
);

// ============================================================
// content_scores
// ============================================================
// Denormalized engagement counters for trending score computation.
// Updated incrementally by database triggers + refreshed by cron.

export const contentScores = pgTable(
  "content_scores",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    contentType: text("content_type").notNull(),
    contentId: uuid("content_id").notNull(),

    votesScore: integer("votes_score").notNull().default(0),
    views24h: integer("views_24h").notNull().default(0),
    views7d: integer("views_7d").notNull().default(0),
    viewsTotal: integer("views_total").notNull().default(0),
    commentsCount: integer("comments_count").notNull().default(0),
    bookmarksCount: integer("bookmarks_count").notNull().default(0),
    // Skills only — tracks actual installations
    installsCount: integer("installs_count").notNull().default(0),

    // Computed trending score (formula in docs/architecture/05-search-discovery.md)
    trendingScore: real("trending_score").notNull().default(0),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("content_scores_uk").on(t.contentType, t.contentId),
    index("scores_trending_idx").on(t.contentType, t.trendingScore),
  ],
);

// ============================================================
// analytics_events
// ============================================================
// Append-only raw event log.
// PARTITIONED BY RANGE (created_at) — monthly partitions.
// Drizzle does not manage partitions; they are created in raw SQL migrations.

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // 'page_view' | 'content_view' | 'search' | 'vote' | 'comment'
    // | 'skill_install' | 'skill_download' | 'copy_code' | 'share'
    // | 'bookmark' | 'learning_path_start' | 'learning_path_complete'
    eventType: text("event_type").notNull(),

    // NULL = anonymous visitor
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),

    // Cookie-based session UUID
    sessionId: text("session_id").notNull(),

    contentType: text("content_type"),
    contentId: uuid("content_id"),

    // 'ko' | 'en' | 'ja'
    locale: text("locale").notNull().default("ko"),

    referrer: text("referrer"),
    searchQuery: text("search_query"),

    // Event-specific extra data (see analytics doc for shapes)
    properties: jsonb("properties").notNull().default(sql`'{}'`),

    // 2-letter ISO country code from edge geolocation header
    ipCountry: text("ip_country"),

    // Hashed — never store raw user agent
    userAgentHash: text("user_agent_hash"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("events_user_idx").on(t.userId, t.createdAt),
    index("events_content_idx").on(t.contentType, t.contentId),
    index("events_type_idx").on(t.eventType, t.createdAt),
    index("events_session_idx").on(t.sessionId),
  ],
);

// ============================================================
// analytics_daily_content
// ============================================================

export const analyticsDailyContent = pgTable(
  "analytics_daily_content",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    date: date("date").notNull(),
    contentType: text("content_type").notNull(),
    contentId: uuid("content_id").notNull(),
    locale: text("locale").notNull(),

    views: integer("views").notNull().default(0),
    uniqueVisitors: integer("unique_visitors").notNull().default(0),
    avgTimeSecs: integer("avg_time_secs").notNull().default(0),
    votesCast: integer("votes_cast").notNull().default(0),
    commentsPosted: integer("comments_posted").notNull().default(0),
    copies: integer("copies").notNull().default(0),
    shares: integer("shares").notNull().default(0),
    bookmarks: integer("bookmarks").notNull().default(0),
    installs: integer("installs").notNull().default(0),
    bounceRate: real("bounce_rate").notNull().default(0),
  },
  (t) => [
    uniqueIndex("analytics_daily_uk").on(
      t.date,
      t.contentType,
      t.contentId,
      t.locale,
    ),
    index("analytics_daily_date_idx").on(t.date),
    index("analytics_daily_type_idx").on(t.contentType, t.date),
  ],
);

// ============================================================
// analytics_contributions
// ============================================================

export const analyticsContributions = pgTable(
  "analytics_contributions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    // First day of the month
    month: date("month").notNull(),

    entriesCreated: integer("entries_created").notNull().default(0),
    entriesEdited: integer("entries_edited").notNull().default(0),
    skillsPublished: integer("skills_published").notNull().default(0),
    caseStudies: integer("case_studies").notNull().default(0),
    claudeConfigs: integer("claude_configs").notNull().default(0),
    editsAccepted: integer("edits_accepted").notNull().default(0),
    editsRejected: integer("edits_rejected").notNull().default(0),
    commentsPosted: integer("comments_posted").notNull().default(0),
    votesCast: integer("votes_cast").notNull().default(0),
    reputationEarned: integer("reputation_earned").notNull().default(0),
  },
  (t) => [uniqueIndex("analytics_contrib_uk").on(t.userId, t.month)],
);

// ============================================================
// teams + team_members
// ============================================================

export const teams = pgTable(
  "teams",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    slug: text("slug").notNull(),
    name: text("name").notNull(),

    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),

    description: text("description"),
    isPublic: boolean("is_public").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("teams_slug_uk").on(t.slug),
    index("teams_owner_idx").on(t.ownerId),
  ],
);

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // 'owner' | 'admin' | 'member'
    role: text("role").notNull().default("member"),

    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("team_members_uk").on(t.teamId, t.userId),
    index("team_members_user_idx").on(t.userId),
  ],
);

// ============================================================
// team_skill_snapshots
// ============================================================

export const teamSkillSnapshots = pgTable(
  "team_skill_snapshots",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),

    // ISO date string — Monday of the snapshot week
    weekStart: date("week_start").notNull(),

    totalMembers: integer("total_members").notNull(),

    // { skill_slug: { count: 5, versions: ["1.0.0", "1.1.0"] } }
    skillsInstalled: jsonb("skills_installed").notNull(),

    // % of recommended skills covered (0–100)
    coverageScore: real("coverage_score").notNull().default(0),

    // { category_slug: member_count }
    categories: jsonb("categories").notNull().default(sql`'{}'`),
  },
  (t) => [uniqueIndex("team_snapshots_uk").on(t.teamId, t.weekStart)],
);

// ============================================================
// analytics_skill_adoption
// ============================================================

export const analyticsSkillAdoption = pgTable(
  "analytics_skill_adoption",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    skillId: uuid("skill_id")
      .notNull()
      .references(() => users.id),

    weekStart: date("week_start").notNull(),

    newInstalls: integer("new_installs").notNull().default(0),
    totalInstalls: integer("total_installs").notNull().default(0),
    activeUsers: integer("active_users").notNull().default(0),
    uninstalls: integer("uninstalls").notNull().default(0),

    // % of users still active 4 weeks after install
    retentionRate: real("retention_rate").notNull().default(0),

    // { "1.0.0": 45, "1.1.0": 120 }
    versionBreakdown: jsonb("version_breakdown").notNull().default(sql`'{}'`),
  },
  (t) => [
    uniqueIndex("skill_adoption_uk").on(t.skillId, t.weekStart),
    index("skill_adoption_week_idx").on(t.weekStart),
  ],
);

export type TrendingContent = typeof trendingContent.$inferSelect;
export type NewTrendingContent = typeof trendingContent.$inferInsert;
export type ContentScore = typeof contentScores.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
