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
import { categories } from "./taxonomy";

// ============================================================
// skills
// ============================================================
// Represents a publishable Claude Code skill file (markdown + frontmatter).
// Mirrors the SkillRecord interface from src/lib/skill-registry/types.ts
// but as a persistent, versioned database entity.

export const skills = pgTable(
  "skills",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    slug: text("slug").notNull(),

    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),

    categoryId: uuid("category_id").references(() => categories.id),

    name: text("name").notNull(),
    description: text("description").notNull(),
    currentVersion: text("current_version").notNull(),

    // SPDX identifier e.g. 'MIT'
    license: text("license"),
    homepageUrl: text("homepage_url"),

    // 'draft' | 'published' | 'deprecated' | 'yanked'
    status: text("status").notNull().default("draft"),

    // ClaudeCodeVersion compatibility range
    compatibleMin: text("compatible_min"),
    compatibleMax: text("compatible_max"),

    // Trigger patterns (array of plain strings and /regex/ literals)
    triggers: text("triggers").array().notNull(),

    // Free-form tags (also mirrored to tags junction for faceted search)
    tags: text("tags").array().notNull().default(sql`'{}'`),

    // --- Aggregated metrics (refreshed by background job) ---
    downloads: integer("downloads").notNull().default(0),
    stars: integer("stars").notNull().default(0),
    forks: integer("forks").notNull().default(0),
    // Ring buffer of last 12 weekly download counts
    weeklyDownloads: integer("weekly_downloads")
      .array()
      .notNull()
      .default(sql`'{}'`),

    // --- Latest version body ---
    body: text("body").notNull(),
    contentHash: text("content_hash").notNull(),

    // --- Denormalized security scan summary ---
    securityScannedAt: timestamp("security_scanned_at", {
      withTimezone: true,
    }),
    securityPassed: boolean("security_passed"),
    securityRiskScore: integer("security_risk_score"),

    // search_vec generated column: applied via raw SQL migration
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
    uniqueIndex("skills_slug_uk").on(t.slug),
    index("skills_author_idx").on(t.authorId),
    index("skills_status_idx").on(t.status),
    index("skills_category_idx").on(t.categoryId),
    index("skills_status_downloads_idx").on(t.status, t.downloads),
    // GIN indexes on triggers, tags, and search_vec: applied in raw SQL migration
  ],
);

// ============================================================
// skill_versions
// ============================================================

export const skillVersions = pgTable(
  "skill_versions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),

    version: text("version").notNull(),
    body: text("body").notNull(),
    contentHash: text("content_hash").notNull(),
    changelog: text("changelog"),
    yanked: boolean("yanked").notNull().default(false),
    yankedReason: text("yanked_reason"),

    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    publishedBy: uuid("published_by").references(() => users.id),
  },
  (t) => [
    uniqueIndex("skill_versions_uk").on(t.skillId, t.version),
    index("skill_versions_skill_idx").on(t.skillId),
  ],
);

// ============================================================
// skill_dependencies (self-referential junction)
// ============================================================

export const skillDependencies = pgTable(
  "skill_dependencies",
  {
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),

    dependsOnId: uuid("depends_on_id")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),

    // Semver range string e.g. '^1.0.0'
    versionRange: text("version_range"),

    required: boolean("required").notNull().default(true),
  },
  (t) => [
    primaryKey({ columns: [t.skillId, t.dependsOnId] }),
    index("skill_deps_depends_on_idx").on(t.dependsOnId),
  ],
);

// ============================================================
// skill_security_findings
// ============================================================

export const skillSecurityFindings = pgTable(
  "skill_security_findings",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),

    versionId: uuid("version_id").references(() => skillVersions.id, {
      onDelete: "cascade",
    }),

    // 'critical' | 'high' | 'medium' | 'low' | 'info'
    level: text("level").notNull(),

    rule: text("rule").notNull(),
    message: text("message").notNull(),
    lines: integer("lines").array(),
    suggestion: text("suggestion"),

    scannedAt: timestamp("scanned_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("skill_findings_skill_idx").on(t.skillId),
    index("skill_findings_version_idx").on(t.versionId),
  ],
);

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type SkillVersion = typeof skillVersions.$inferSelect;
export type NewSkillVersion = typeof skillVersions.$inferInsert;
export type SkillDependency = typeof skillDependencies.$inferSelect;
export type SkillSecurityFinding = typeof skillSecurityFindings.$inferSelect;
