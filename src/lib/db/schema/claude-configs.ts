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
import { tags } from "./taxonomy";

// ============================================================
// claude_configs
// ============================================================
// Community-shared CLAUDE.md configurations.
// Analyzed sections are stored separately for the conflict/quality UI.

export const claudeConfigs = pgTable(
  "claude_configs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    slug: text("slug").notNull(),

    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),

    title: text("title").notNull(),
    description: text("description"),

    // Target role e.g. 'backend' | 'frontend' | 'devops' | 'fullstack' | 'data' | 'mobile' | 'other'
    roleType: text("role_type"),

    // Full CLAUDE.md body text
    body: text("body").notNull(),

    // Analysis scores from ClaudeMdAnalysis (updated on save)
    completenessScore: integer("completeness_score").notNull().default(0),
    qualityScore: integer("quality_score").notNull().default(0),

    // 'draft' | 'published' | 'archived'
    status: text("status").notNull().default("draft"),

    // Official templates are marked and surfaced separately
    isTemplate: boolean("is_template").notNull().default(false),

    stars: integer("stars").notNull().default(0),
    forks: integer("forks").notNull().default(0),

    // search_vec: generated column applied in raw SQL migration
    searchVec: text("search_vec"),

    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("claude_configs_slug_uk").on(t.slug),
    index("claude_configs_author_idx").on(t.authorId),
    index("claude_configs_status_idx").on(t.status),
    index("claude_configs_template_idx").on(t.isTemplate),
    // GIN on search_vec: applied in raw SQL migration
  ],
);

// ============================================================
// claude_config_sections
// ============================================================
// Parsed section breakdown for the analysis UI and conflict detection.

export const claudeConfigSections = pgTable(
  "claude_config_sections",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    configId: uuid("config_id")
      .notNull()
      .references(() => claudeConfigs.id, { onDelete: "cascade" }),

    heading: text("heading").notNull(),
    // 1 = h1, 2 = h2, etc.
    level: integer("level").notNull(),
    content: text("content").notNull(),
    lineStart: integer("line_start"),
    lineEnd: integer("line_end"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("config_sections_config_idx").on(t.configId)],
);

// ============================================================
// claude_config_tags (junction)
// ============================================================

export const claudeConfigTags = pgTable(
  "claude_config_tags",
  {
    configId: uuid("config_id")
      .notNull()
      .references(() => claudeConfigs.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.configId, t.tagId] })],
);

export type ClaudeConfig = typeof claudeConfigs.$inferSelect;
export type NewClaudeConfig = typeof claudeConfigs.$inferInsert;
export type ClaudeConfigSection = typeof claudeConfigSections.$inferSelect;
