import {
  pgTable,
  uuid,
  text,
  boolean,
  smallint,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

// ============================================================
// votes
// ============================================================
// Polymorphic: targets any content type or comment.
// value = +1 (upvote) or -1 (downvote).
// One vote per (user, target) enforced by unique constraint.

export const votes = pgTable(
  "votes",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // 'knowledge_entry' | 'skill' | 'case_study' | 'claude_config' | 'comment'
    targetType: text("target_type").notNull(),

    targetId: uuid("target_id").notNull(),

    // +1 or -1
    value: smallint("value").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("votes_user_target_uk").on(t.userId, t.targetType, t.targetId),
    index("votes_target_idx").on(t.targetType, t.targetId),
  ],
);

// ============================================================
// comments
// ============================================================
// Threaded comments on any content type.
// parent_id = null means top-level comment.
// Soft-deletes: body replaced with '[deleted]' but record remains
// to preserve threading.

export const comments = pgTable(
  "comments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),

    // Self-referential threading
    parentId: uuid("parent_id"),

    // 'knowledge_entry' | 'skill' | 'case_study' | 'claude_config'
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),

    body: text("body").notNull(),

    // Soft delete — keeps thread structure intact
    isDeleted: boolean("is_deleted").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("comments_target_idx").on(t.targetType, t.targetId),
    index("comments_author_idx").on(t.authorId),
    index("comments_parent_idx").on(t.parentId),
  ],
);

// ============================================================
// edit_suggestions
// ============================================================
// Wiki-style contribution: any user can propose changes.
// Moderators (or the original author) accept or reject them.
// Accepted suggestions create a new content_version entry.

export const editSuggestions = pgTable(
  "edit_suggestions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),

    reviewedBy: uuid("reviewed_by").references(() => users.id),

    // 'knowledge_entry' | 'skill' | 'case_study' | 'claude_config'
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),

    // Which field was edited e.g. 'body_ko', 'title_en', 'body_en'
    field: text("field").notNull(),

    // Full snapshot of the field value at time of suggestion
    originalBody: text("original_body").notNull(),
    suggestedBody: text("suggested_body").notNull(),

    // One-line human-readable description of the change
    summary: text("summary"),

    // 'pending' | 'accepted' | 'rejected' | 'superseded'
    status: text("status").notNull().default("pending"),

    rejectionReason: text("rejection_reason"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [
    index("edit_suggestions_target_idx").on(t.targetType, t.targetId),
    index("edit_suggestions_status_idx").on(t.status),
    index("edit_suggestions_author_idx").on(t.authorId),
  ],
);

// ============================================================
// bookmarks
// ============================================================
// User saves content for later. Powers the "My Library" feature.

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    contentType: text("content_type").notNull(),
    contentId: uuid("content_id").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("bookmarks_uk").on(t.userId, t.contentType, t.contentId),
    index("bookmarks_user_idx").on(t.userId),
  ],
);

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type EditSuggestion = typeof editSuggestions.$inferSelect;
export type NewEditSuggestion = typeof editSuggestions.$inferInsert;
export type Bookmark = typeof bookmarks.$inferSelect;
