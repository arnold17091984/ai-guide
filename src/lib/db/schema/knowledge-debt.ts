import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { knowledgeEntries } from "./knowledge";

// ============================================================
// knowledge_debt_items
// ============================================================
// Tracks areas where documentation is missing, outdated,
// incomplete, or inaccurate in the knowledge base.

export const knowledgeDebtItems = pgTable(
  "knowledge_debt_items",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    title: text("title").notNull(),
    description: text("description").notNull(),

    // 'missing' | 'outdated' | 'incomplete' | 'inaccurate'
    category: text("category").notNull(),

    // 'critical' | 'high' | 'medium' | 'low'
    priority: text("priority").notNull().default("medium"),

    // 'open' | 'in_progress' | 'resolved' | 'wont_fix'
    status: text("status").notNull().default("open"),

    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id),

    assigneeId: uuid("assignee_id").references(() => users.id),

    relatedEntryId: uuid("related_entry_id").references(
      () => knowledgeEntries.id,
    ),

    tags: jsonb("tags").$type<string[]>().default([]),

    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedById: uuid("resolved_by_id").references(() => users.id),
    resolutionNote: text("resolution_note"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("debt_items_status_idx").on(t.status),
    index("debt_items_category_idx").on(t.category),
    index("debt_items_priority_idx").on(t.priority),
    index("debt_items_reporter_idx").on(t.reporterId),
    index("debt_items_assignee_idx").on(t.assigneeId),
    index("debt_items_created_idx").on(t.createdAt),
  ],
);

// ============================================================
// debt_votes
// ============================================================
// Upvote system to prioritize debt items.
// Each user can vote once per item (toggle).

export const debtVotes = pgTable(
  "debt_votes",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    debtItemId: uuid("debt_item_id")
      .notNull()
      .references(() => knowledgeDebtItems.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("debt_votes_item_user_uk").on(t.debtItemId, t.userId),
    index("debt_votes_item_idx").on(t.debtItemId),
  ],
);

// ============================================================
// debt_comments
// ============================================================
// Discussion thread on debt items.

export const debtComments = pgTable(
  "debt_comments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    debtItemId: uuid("debt_item_id")
      .notNull()
      .references(() => knowledgeDebtItems.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    content: text("content").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("debt_comments_item_idx").on(t.debtItemId)],
);

// ============================================================
// Type exports
// ============================================================

export type KnowledgeDebtItem = typeof knowledgeDebtItems.$inferSelect;
export type NewKnowledgeDebtItem = typeof knowledgeDebtItems.$inferInsert;
export type DebtVote = typeof debtVotes.$inferSelect;
export type DebtComment = typeof debtComments.$inferSelect;
