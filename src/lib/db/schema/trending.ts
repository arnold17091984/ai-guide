import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

// ============================================================
// trending_items
// ============================================================
// Cached external content from various AI ecosystem sources.
// Populated by periodic fetch jobs (cron/edge functions).

export const trendingItems = pgTable(
  "trending_items",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // 'github' | 'hackernews' | 'reddit' | 'twitter' | 'producthunt'
    source: varchar("source", { length: 32 }).notNull(),

    // Platform-specific ID (e.g. HN item ID, tweet ID)
    externalId: varchar("external_id", { length: 255 }).notNull(),

    title: text("title").notNull(),
    description: text("description"),
    url: text("url").notNull(),

    authorName: varchar("author_name", { length: 255 }),
    authorAvatarUrl: varchar("author_avatar_url", { length: 512 }),

    score: integer("score").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),

    tags: jsonb("tags").notNull().default(sql`'[]'`),
    imageUrl: varchar("image_url", { length: 512 }),

    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    // Source-specific extra data
    metadata: jsonb("metadata"),
  },
  (t) => [
    uniqueIndex("trending_items_source_external_uk").on(t.source, t.externalId),
    index("trending_items_source_idx").on(t.source),
    index("trending_items_score_idx").on(t.score),
    index("trending_items_published_idx").on(t.publishedAt),
  ],
);

// ============================================================
// trending_sources
// ============================================================
// Registry of external content sources and their fetch config.

export const trendingSources = pgTable(
  "trending_sources",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    name: varchar("name", { length: 32 }).notNull(),
    displayName: varchar("display_name", { length: 64 }).notNull(),
    iconName: varchar("icon_name", { length: 32 }).notNull(),
    baseUrl: varchar("base_url", { length: 255 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),

    lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
    fetchIntervalMinutes: integer("fetch_interval_minutes")
      .notNull()
      .default(30),
  },
  (t) => [uniqueIndex("trending_sources_name_uk").on(t.name)],
);

// ============================================================
// user_bookmarks
// ============================================================
// Tracks which trending items a user has bookmarked.

export const userBookmarks = pgTable(
  "user_bookmarks",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    trendingItemId: uuid("trending_item_id")
      .notNull()
      .references(() => trendingItems.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("user_bookmarks_uk").on(t.userId, t.trendingItemId),
    index("user_bookmarks_user_idx").on(t.userId),
    index("user_bookmarks_item_idx").on(t.trendingItemId),
  ],
);

// ============================================================
// Type exports
// ============================================================

export type TrendingItem = typeof trendingItems.$inferSelect;
export type NewTrendingItem = typeof trendingItems.$inferInsert;
export type TrendingSource = typeof trendingSources.$inferSelect;
export type NewTrendingSource = typeof trendingSources.$inferInsert;
export type UserBookmark = typeof userBookmarks.$inferSelect;
export type NewUserBookmark = typeof userBookmarks.$inferInsert;
