import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { skills } from "./skills";

// ============================================================
// skill_packages
// ============================================================
// A curated collection of skills bundled together.
// Users can create, star, and install packages.

export const skillPackages = pgTable(
  "skill_packages",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    name: text("name").notNull(),

    slug: text("slug").notNull(),

    description: text("description").notNull(),

    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    isPublic: boolean("is_public").notNull().default(true),

    iconName: text("icon_name"),

    tags: jsonb("tags").$type<string[]>().notNull().default([]),

    installCount: integer("install_count").notNull().default(0),

    starCount: integer("star_count").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("skill_packages_slug_uk").on(t.slug),
    index("skill_packages_author_idx").on(t.authorId),
    index("skill_packages_public_idx").on(t.isPublic),
  ],
);

// ============================================================
// skill_package_items
// ============================================================
// Junction table linking skills to packages with ordering.

export const skillPackageItems = pgTable(
  "skill_package_items",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    packageId: uuid("package_id")
      .notNull()
      .references(() => skillPackages.id, { onDelete: "cascade" }),

    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),

    order: integer("order").notNull().default(0),

    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("skill_package_items_uk").on(t.packageId, t.skillId),
    index("skill_package_items_pkg_idx").on(t.packageId),
    index("skill_package_items_skill_idx").on(t.skillId),
  ],
);

// ============================================================
// skill_package_stars
// ============================================================
// One star per user per package.

export const skillPackageStars = pgTable(
  "skill_package_stars",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    packageId: uuid("package_id")
      .notNull()
      .references(() => skillPackages.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("skill_package_stars_uk").on(t.packageId, t.userId),
    index("skill_package_stars_pkg_idx").on(t.packageId),
    index("skill_package_stars_user_idx").on(t.userId),
  ],
);

// ============================================================
// Type exports
// ============================================================

export type SkillPackage = typeof skillPackages.$inferSelect;
export type NewSkillPackage = typeof skillPackages.$inferInsert;
export type SkillPackageItem = typeof skillPackageItems.$inferSelect;
export type SkillPackageStar = typeof skillPackageStars.$inferSelect;
