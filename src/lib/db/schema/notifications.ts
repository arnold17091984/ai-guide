import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

// ============================================================
// notifications
// ============================================================
// Per-user notifications triggered by platform events
// (votes, comments, achievements, edit reviews, etc.)

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // 'vote_received' | 'comment_reply' | 'achievement_unlocked'
    // | 'edit_approved' | 'edit_rejected' | 'mention' | 'system'
    type: varchar("type", { length: 50 }).notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),

    linkUrl: varchar("link_url", { length: 500 }),

    isRead: boolean("is_read").notNull().default(false),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [
    index("notifications_user_idx").on(t.userId),
    index("notifications_user_unread_idx").on(t.userId, t.isRead),
    index("notifications_created_idx").on(t.createdAt),
  ],
);

// ============================================================
// activity_feed
// ============================================================
// Public timeline of platform-wide activity.
// Powers the community activity feed page.

export const activityFeed = pgTable(
  "activity_feed",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // 'published_entry' | 'published_skill' | 'commented' | 'voted'
    // | 'earned_achievement' | 'reached_level' | 'edited_entry'
    actionType: varchar("action_type", { length: 50 }).notNull(),

    targetType: varchar("target_type", { length: 50 }).notNull(),
    targetId: uuid("target_id").notNull(),
    targetTitle: varchar("target_title", { length: 500 }).notNull(),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    isPublic: boolean("is_public").notNull().default(true),
  },
  (t) => [
    index("activity_feed_actor_idx").on(t.actorId),
    index("activity_feed_created_idx").on(t.createdAt),
    index("activity_feed_action_idx").on(t.actionType),
    index("activity_feed_public_idx").on(t.isPublic, t.createdAt),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type ActivityFeedEntry = typeof activityFeed.$inferSelect;
export type NewActivityFeedEntry = typeof activityFeed.$inferInsert;
