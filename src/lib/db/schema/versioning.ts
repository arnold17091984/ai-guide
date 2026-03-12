import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

// ============================================================
// content_versions
// ============================================================
// Full-snapshot version history for all mutable content types.
// Strategy: full snapshot per version (not delta-only), with an
// optional diff_patch column for display.
//
// See docs/architecture/04-versioning.md for full rationale.

export const contentVersions = pgTable(
  "content_versions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // 'knowledge_entry' | 'skill' | 'case_study' | 'claude_config'
    contentType: text("content_type").notNull(),

    contentId: uuid("content_id").notNull(),

    // Monotonically incrementing per (contentType, contentId)
    versionNumber: integer("version_number").notNull(),

    authorId: uuid("author_id").references(() => users.id),

    editSuggestionId: uuid("edit_suggestion_id"),
    // References edit_suggestions(id) but no FK to avoid circular dep.
    // NULL when the edit was made directly by author or moderator.

    // Full snapshot of all mutable fields at this version.
    // Example for knowledge_entry:
    // {
    //   "title_ko": "...", "title_en": "...",
    //   "body_ko": "...",  "body_en": "...",
    //   "summary_ko": "...", "category_id": "uuid",
    //   "difficulty_level": "intermediate"
    // }
    snapshot: jsonb("snapshot").notNull(),

    // GNU unified diff vs previous version (display only).
    // Stored per-field as a JSON object:
    // { "body_en": "--- a/body_en\n+++ b/body_en\n..." }
    // NULL for version_number = 1.
    diffPatch: jsonb("diff_patch"),

    // One-line description e.g. "Fixed typo in introduction"
    changeSummary: text("change_summary"),

    // 'create' | 'edit' | 'revert' | 'accept_suggestion'
    // | 'locale_add' | 'metadata_update'
    changeType: text("change_type").notNull().default("edit"),

    // Optimistic concurrency: the version this edit was based on.
    // Server rejects if current > base_version (conflict).
    baseVersion: integer("base_version"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("content_versions_uk").on(
      t.contentType,
      t.contentId,
      t.versionNumber,
    ),
    index("content_versions_content_idx").on(
      t.contentType,
      t.contentId,
      t.versionNumber,
    ),
    index("content_versions_author_idx").on(t.authorId),
    index("content_versions_date_idx").on(t.createdAt),
  ],
);

// ============================================================
// VersionSnapshot TypeScript type
// ============================================================
// Typed view of the jsonb `snapshot` column at the app layer.

export interface KnowledgeEntrySnapshot {
  titleKo?: string;
  titleEn?: string;
  titleJa?: string;
  summaryKo?: string;
  summaryEn?: string;
  summaryJa?: string;
  bodyKo?: string;
  bodyEn?: string;
  bodyJa?: string;
  categoryId?: string;
  difficultyLevel?: string;
  readTimeMins?: number;
  isFeatured?: boolean;
}

export interface SkillSnapshot {
  name?: string;
  description?: string;
  body?: string;
  triggers?: string[];
  tags?: string[];
  compatibleMin?: string;
  compatibleMax?: string;
  license?: string;
}

export type ContentSnapshot = KnowledgeEntrySnapshot | SkillSnapshot | Record<string, unknown>;

export type ContentVersion = typeof contentVersions.$inferSelect;
export type NewContentVersion = typeof contentVersions.$inferInsert;
