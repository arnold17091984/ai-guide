import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

// ============================================================
// achievements
// ============================================================
// Defines all earnable badges/achievements.
// nameKey and descriptionKey reference i18n message keys.
// category: 'contribution' | 'quality' | 'social' | 'milestone'
// tier: 'bronze' | 'silver' | 'gold' | 'platinum'

export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    slug: varchar("slug", { length: 100 }).notNull(),

    nameKey: varchar("name_key", { length: 200 }).notNull(),
    descriptionKey: varchar("description_key", { length: 200 }).notNull(),

    // Inline SVG icon name (mapped in application layer)
    iconName: varchar("icon_name", { length: 100 }).notNull(),

    // 'contribution' | 'quality' | 'social' | 'milestone'
    category: text("category").notNull(),

    // 'bronze' | 'silver' | 'gold' | 'platinum'
    tier: text("tier").notNull(),

    // The numeric threshold required to unlock
    requiredValue: integer("required_value").notNull().default(1),

    // Secret achievements are hidden until unlocked
    isSecret: boolean("is_secret").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("achievements_slug_uk").on(t.slug),
    index("achievements_category_idx").on(t.category),
    index("achievements_tier_idx").on(t.tier),
  ],
);

// ============================================================
// user_achievements
// ============================================================
// Tracks which achievements each user has unlocked.

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),

    // Current progress toward the achievement threshold
    progress: integer("progress").notNull().default(0),

    unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("user_achievements_uk").on(t.userId, t.achievementId),
    index("user_achievements_user_idx").on(t.userId),
    index("user_achievements_achievement_idx").on(t.achievementId),
  ],
);

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
