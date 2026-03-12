import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================================
// users
// ============================================================
// Mirrors the Supabase auth.users table via a public profile.
// The `id` column matches auth.users.id so RLS can reference it.

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    username: text("username").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),

    // 'admin' | 'moderator' | 'contributor' | 'viewer'
    role: text("role").notNull().default("contributor"),

    // Preferred UI locale: 'ko' | 'en' | 'ja'
    locale: text("locale").notNull().default("ko"),

    githubHandle: text("github_handle"),
    websiteUrl: text("website_url"),

    // Earned through accepted edits, published content, votes received
    reputation: integer("reputation").notNull().default(0),

    isVerified: boolean("is_verified").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("users_username_uk").on(t.username),
    uniqueIndex("users_email_uk").on(t.email),
    index("users_role_idx").on(t.role),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
