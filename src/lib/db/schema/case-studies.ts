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
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { categories, tags } from "./taxonomy";

// ============================================================
// case_studies
// ============================================================
// Structured real-world examples with measurable outcome metrics.
// Supports three locales; outcome metrics stored as flexible jsonb.

export const caseStudies = pgTable(
  "case_studies",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    slug: text("slug").notNull(),

    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),

    categoryId: uuid("category_id").references(() => categories.id),

    // 'draft' | 'pending_review' | 'published' | 'archived'
    status: text("status").notNull().default("draft"),

    // --- Localized content ---
    titleKo: text("title_ko").notNull(),
    titleEn: text("title_en"),
    titleJa: text("title_ja"),

    summaryKo: text("summary_ko"),
    summaryEn: text("summary_en"),
    summaryJa: text("summary_ja"),

    bodyKo: text("body_ko"),
    bodyEn: text("body_en"),
    bodyJa: text("body_ja"),

    // --- Structured fields for filtering ---
    teamSize: integer("team_size"),
    projectDurationWeeks: integer("project_duration_weeks"),
    industry: text("industry"),
    techStack: text("tech_stack").array().notNull().default(sql`'{}'`),

    // --- Outcome metrics (flexible jsonb) ---
    // Example: { velocity_increase: 40, bugs_reduced_pct: 30, ... }
    metrics: jsonb("metrics").notNull().default(sql`'{}'`),

    featuredImage: text("featured_image"),
    isFeatured: boolean("is_featured").notNull().default(false),

    // search_en / search_ko: generated columns applied in raw SQL migration
    searchEn: text("search_en"),
    searchKo: text("search_ko"),

    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("case_studies_slug_uk").on(t.slug),
    index("case_studies_status_idx").on(t.status),
    index("case_studies_author_idx").on(t.authorId),
    index("case_studies_category_idx").on(t.categoryId),
    index("case_studies_published_idx").on(t.publishedAt),
    // GIN indexes on search_*, metrics, tech_stack: applied in raw SQL migration
  ],
);

// ============================================================
// case_study_tags (junction)
// ============================================================

export const caseStudyTags = pgTable(
  "case_study_tags",
  {
    caseStudyId: uuid("case_study_id")
      .notNull()
      .references(() => caseStudies.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.caseStudyId, t.tagId] })],
);

// ============================================================
// CaseStudyMetrics TypeScript interface
// ============================================================
// Used for typing the jsonb `metrics` column at the application layer.

export interface CaseStudyMetrics {
  velocityIncreasePct?: number;
  bugsReducedPct?: number;
  timeSavedHrsWeek?: number;
  costSavingsUsd?: number;
  deployFrequencyMultiplier?: number;
  codeReviewTimeReductionPct?: number;
  testCoverageIncreasePct?: number;
  developerSatisfactionScore?: number; // 1-10
  customMetrics?: Record<string, number | string>;
}

export type CaseStudy = typeof caseStudies.$inferSelect;
export type NewCaseStudy = typeof caseStudies.$inferInsert;
