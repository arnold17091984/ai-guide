import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { skills } from "./skills";

// ============================================================
// user_skills
// ============================================================
// Tracks which skills each user has registered (adopted) and
// their progress status. This is the primary "who has what" table.

export const userSkills = pgTable(
  "user_skills",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),

    // 'registered' | 'in_progress' | 'completed'
    status: text("status").notNull().default("registered"),

    registeredAt: timestamp("registered_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    startedAt: timestamp("started_at", { withTimezone: true }),

    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("user_skills_uk").on(t.userId, t.skillId),
    index("user_skills_user_idx").on(t.userId),
    index("user_skills_skill_idx").on(t.skillId),
    index("user_skills_status_idx").on(t.userId, t.status),
  ],
);

export type UserSkill = typeof userSkills.$inferSelect;
export type NewUserSkill = typeof userSkills.$inferInsert;
