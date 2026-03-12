import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================================
// categories
// ============================================================
// Hierarchical via parent_id self-reference (max 2 levels in practice).

export const categories = pgTable(
  "categories",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    slug: text("slug").notNull(),
    labelKo: text("label_ko").notNull(),
    labelEn: text("label_en").notNull(),
    labelJa: text("label_ja").notNull(),

    // Lucide icon name e.g. 'rocket', 'zap', 'git-branch'
    icon: text("icon"),

    // Self-referential for subcategories
    parentId: uuid("parent_id"),

    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    uniqueIndex("categories_slug_uk").on(t.slug),
    index("categories_parent_idx").on(t.parentId),
  ],
);

// ============================================================
// tags
// ============================================================
// Flat tag list with localized labels and a meta-category for
// grouping in the UI (language / framework / concept / level).

export const tags = pgTable(
  "tags",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    slug: text("slug").notNull(),
    labelKo: text("label_ko").notNull(),
    labelEn: text("label_en").notNull(),
    labelJa: text("label_ja").notNull(),

    // Tailwind color class for badge rendering, e.g. 'blue', 'teal'
    color: text("color"),

    // 'language' | 'framework' | 'tool' | 'concept' | 'level'
    category: text("category"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [uniqueIndex("tags_slug_uk").on(t.slug)],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
