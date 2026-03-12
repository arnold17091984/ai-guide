import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { categories, tags } from "./taxonomy";

// ============================================================
// knowledge_entries
// ============================================================
// Covers articles, tips, workflow guides, and tutorials.
// Each row stores all three locales. Missing locale = null.
//
// Full-text search vectors are generated columns kept current
// by Postgres on every INSERT/UPDATE — no trigger required.

export const knowledgeEntries = pgTable(
  "knowledge_entries",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    slug: text("slug").notNull(),

    // 'article' | 'tip' | 'workflow' | 'tutorial'
    contentType: text("content_type").notNull(),

    // 'draft' | 'pending' | 'published' | 'archived'
    status: text("status").notNull().default("draft"),

    // 'beginner' | 'intermediate' | 'advanced'
    difficultyLevel: text("difficulty_level"),

    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),

    categoryId: uuid("category_id").references(() => categories.id),

    // --- Localized content ---
    titleKo: text("title_ko").notNull(),
    titleEn: text("title_en"),
    titleJa: text("title_ja"),

    summaryKo: text("summary_ko"),
    summaryEn: text("summary_en"),
    summaryJa: text("summary_ja"),

    // Latest body — history stored in content_versions
    bodyKo: text("body_ko"),
    bodyEn: text("body_en"),
    bodyJa: text("body_ja"),

    // --- Metadata ---
    readTimeMins: integer("read_time_mins"),
    featuredImage: text("featured_image"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isPinned: boolean("is_pinned").notNull().default(false),

    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    // --- Full-text search (generated columns) ---
    // These are declared here as regular columns; the actual
    // GENERATED ALWAYS AS expression is added in the raw SQL migration
    // since Drizzle does not yet support generated tsvector columns
    // with custom dictionaries natively.
    // They are read-only from the application layer.
    searchKo: text("search_ko"),
    searchEn: text("search_en"),
    searchJa: text("search_ja"),
  },
  (t) => [
    uniqueIndex("knowledge_entries_slug_uk").on(t.slug),
    index("knowledge_entries_status_idx").on(t.status),
    index("knowledge_entries_type_idx").on(t.contentType),
    index("knowledge_entries_author_idx").on(t.authorId),
    index("knowledge_entries_category_idx").on(t.categoryId),
    index("knowledge_entries_published_idx").on(t.publishedAt),
    // GIN indexes on search_* are applied in raw SQL migration (0012_indexes.sql)
  ],
);

// ============================================================
// knowledge_entry_tags (junction)
// ============================================================

export const knowledgeEntryTags = pgTable(
  "knowledge_entry_tags",
  {
    entryId: uuid("entry_id")
      .notNull()
      .references(() => knowledgeEntries.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.entryId, t.tagId] })],
);

export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type NewKnowledgeEntry = typeof knowledgeEntries.$inferInsert;
export type KnowledgeEntryTag = typeof knowledgeEntryTags.$inferSelect;
