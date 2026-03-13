"use server";

import { revalidatePath } from "next/cache";
import { eq, and, or, desc, asc, sql, count } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  knowledgeDebtItems,
  debtVotes,
  debtComments,
} from "@/lib/db/schema/knowledge-debt";
import { users } from "@/lib/db/schema/users";
import { knowledgeEntries } from "@/lib/db/schema/knowledge";
import { requireAuth } from "@/lib/auth/require-auth";

// ============================================================
// Types
// ============================================================

export type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

type DebtCategory = "missing" | "outdated" | "incomplete" | "inaccurate";
type DebtPriority = "critical" | "high" | "medium" | "low";
type DebtStatus = "open" | "in_progress" | "resolved" | "wont_fix";

const VALID_CATEGORIES: DebtCategory[] = [
  "missing",
  "outdated",
  "incomplete",
  "inaccurate",
];
const VALID_PRIORITIES: DebtPriority[] = [
  "critical",
  "high",
  "medium",
  "low",
];
const VALID_STATUSES: DebtStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "wont_fix",
];

// ============================================================
// createDebtItem
// ============================================================

export async function createDebtItem(data: {
  title: string;
  description: string;
  category: string;
  priority: string;
  tags?: string[];
  relatedEntryId?: string;
}): Promise<ActionResult> {
  const user = await requireAuth();

  if (!data.title || data.title.trim().length < 3) {
    return { success: false, error: "Title must be at least 3 characters" };
  }
  if (!data.description || data.description.trim().length < 10) {
    return {
      success: false,
      error: "Description must be at least 10 characters",
    };
  }
  if (!VALID_CATEGORIES.includes(data.category as DebtCategory)) {
    return { success: false, error: "Invalid category" };
  }
  if (!VALID_PRIORITIES.includes(data.priority as DebtPriority)) {
    return { success: false, error: "Invalid priority" };
  }

  try {
    const [item] = await db
      .insert(knowledgeDebtItems)
      .values({
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        priority: data.priority,
        reporterId: user.id,
        tags: data.tags ?? [],
        relatedEntryId: data.relatedEntryId || null,
      })
      .returning({ id: knowledgeDebtItems.id });

    if (!item) {
      return { success: false, error: "Failed to create debt item" };
    }

    revalidatePath("/[locale]/knowledge/debt", "page");
    return { success: true, id: item.id };
  } catch (err) {
    console.error("[createDebtItem]", err);
    return { success: false, error: "Server error" };
  }
}

// ============================================================
// updateDebtItem
// ============================================================

export async function updateDebtItem(
  id: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    priority?: string;
    tags?: string[];
    relatedEntryId?: string | null;
  },
): Promise<ActionResult> {
  const user = await requireAuth();

  const existing = await db
    .select({
      reporterId: knowledgeDebtItems.reporterId,
      assigneeId: knowledgeDebtItems.assigneeId,
    })
    .from(knowledgeDebtItems)
    .where(eq(knowledgeDebtItems.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!existing) {
    return { success: false, error: "Item not found" };
  }

  if (existing.reporterId !== user.id && existing.assigneeId !== user.id) {
    return { success: false, error: "Only reporter or assignee can edit" };
  }

  if (data.category && !VALID_CATEGORIES.includes(data.category as DebtCategory)) {
    return { success: false, error: "Invalid category" };
  }
  if (data.priority && !VALID_PRIORITIES.includes(data.priority as DebtPriority)) {
    return { success: false, error: "Invalid priority" };
  }

  try {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined)
      updateData.description = data.description.trim();
    if (data.category !== undefined) updateData.category = data.category;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.relatedEntryId !== undefined)
      updateData.relatedEntryId = data.relatedEntryId;

    await db
      .update(knowledgeDebtItems)
      .set(updateData)
      .where(eq(knowledgeDebtItems.id, id));

    revalidatePath("/[locale]/knowledge/debt", "page");
    revalidatePath(`/[locale]/knowledge/debt/${id}`, "page");
    return { success: true, id };
  } catch (err) {
    console.error("[updateDebtItem]", err);
    return { success: false, error: "Server error" };
  }
}

// ============================================================
// assignDebtItem
// ============================================================

export async function assignDebtItem(
  id: string,
  assigneeId: string,
): Promise<ActionResult> {
  const user = await requireAuth();

  // Users can only self-assign
  if (assigneeId !== user.id) {
    return { success: false, error: "You can only assign to yourself" };
  }

  const existing = await db
    .select({ id: knowledgeDebtItems.id, status: knowledgeDebtItems.status })
    .from(knowledgeDebtItems)
    .where(eq(knowledgeDebtItems.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!existing) {
    return { success: false, error: "Item not found" };
  }

  try {
    await db
      .update(knowledgeDebtItems)
      .set({
        assigneeId,
        status: existing.status === "open" ? "in_progress" : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeDebtItems.id, id));

    revalidatePath("/[locale]/knowledge/debt", "page");
    revalidatePath(`/[locale]/knowledge/debt/${id}`, "page");
    return { success: true, id };
  } catch (err) {
    console.error("[assignDebtItem]", err);
    return { success: false, error: "Server error" };
  }
}

// ============================================================
// resolveDebtItem
// ============================================================

export async function resolveDebtItem(
  id: string,
  note: string,
): Promise<ActionResult> {
  const user = await requireAuth();

  const existing = await db
    .select({
      reporterId: knowledgeDebtItems.reporterId,
      assigneeId: knowledgeDebtItems.assigneeId,
    })
    .from(knowledgeDebtItems)
    .where(eq(knowledgeDebtItems.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!existing) {
    return { success: false, error: "Item not found" };
  }

  if (existing.reporterId !== user.id && existing.assigneeId !== user.id) {
    return {
      success: false,
      error: "Only reporter or assignee can resolve",
    };
  }

  try {
    await db
      .update(knowledgeDebtItems)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
        resolvedById: user.id,
        resolutionNote: note.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeDebtItems.id, id));

    revalidatePath("/[locale]/knowledge/debt", "page");
    revalidatePath(`/[locale]/knowledge/debt/${id}`, "page");
    return { success: true, id };
  } catch (err) {
    console.error("[resolveDebtItem]", err);
    return { success: false, error: "Server error" };
  }
}

// ============================================================
// reopenDebtItem
// ============================================================

export async function reopenDebtItem(id: string): Promise<ActionResult> {
  await requireAuth();

  const existing = await db
    .select({ id: knowledgeDebtItems.id })
    .from(knowledgeDebtItems)
    .where(eq(knowledgeDebtItems.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!existing) {
    return { success: false, error: "Item not found" };
  }

  try {
    await db
      .update(knowledgeDebtItems)
      .set({
        status: "open",
        resolvedAt: null,
        resolvedById: null,
        resolutionNote: null,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeDebtItems.id, id));

    revalidatePath("/[locale]/knowledge/debt", "page");
    revalidatePath(`/[locale]/knowledge/debt/${id}`, "page");
    return { success: true, id };
  } catch (err) {
    console.error("[reopenDebtItem]", err);
    return { success: false, error: "Server error" };
  }
}

// ============================================================
// voteDebtItem (toggle)
// ============================================================

export async function voteDebtItem(id: string): Promise<ActionResult> {
  const user = await requireAuth();

  const existingVote = await db
    .select({ id: debtVotes.id })
    .from(debtVotes)
    .where(
      and(eq(debtVotes.debtItemId, id), eq(debtVotes.userId, user.id)),
    )
    .limit(1)
    .then((r) => r[0] ?? null);

  try {
    if (existingVote) {
      // Remove vote
      await db.delete(debtVotes).where(eq(debtVotes.id, existingVote.id));
    } else {
      // Add vote
      await db.insert(debtVotes).values({
        debtItemId: id,
        userId: user.id,
      });
    }

    revalidatePath("/[locale]/knowledge/debt", "page");
    revalidatePath(`/[locale]/knowledge/debt/${id}`, "page");
    return { success: true, id };
  } catch (err) {
    console.error("[voteDebtItem]", err);
    return { success: false, error: "Server error" };
  }
}

// ============================================================
// addDebtComment
// ============================================================

export async function addDebtComment(
  debtItemId: string,
  content: string,
): Promise<ActionResult> {
  const user = await requireAuth();

  if (!content || content.trim().length < 1) {
    return { success: false, error: "Comment cannot be empty" };
  }

  try {
    const [comment] = await db
      .insert(debtComments)
      .values({
        debtItemId,
        userId: user.id,
        content: content.trim(),
      })
      .returning({ id: debtComments.id });

    if (!comment) {
      return { success: false, error: "Failed to add comment" };
    }

    revalidatePath(`/[locale]/knowledge/debt/${debtItemId}`, "page");
    return { success: true, id: comment.id };
  } catch (err) {
    console.error("[addDebtComment]", err);
    return { success: false, error: "Server error" };
  }
}

// ============================================================
// listDebtItems
// ============================================================

export async function listDebtItems(params?: {
  category?: string;
  priority?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "votes" | "newest" | "priority";
}) {
  const {
    category,
    priority,
    status,
    search,
    page = 1,
    limit = 20,
    sortBy = "newest",
  } = params ?? {};

  const offset = (page - 1) * limit;

  const conditions = [];
  if (category && VALID_CATEGORIES.includes(category as DebtCategory)) {
    conditions.push(eq(knowledgeDebtItems.category, category));
  }
  if (priority && VALID_PRIORITIES.includes(priority as DebtPriority)) {
    conditions.push(eq(knowledgeDebtItems.priority, priority));
  }
  if (status && VALID_STATUSES.includes(status as DebtStatus)) {
    conditions.push(eq(knowledgeDebtItems.status, status));
  }
  if (search && search.trim()) {
    conditions.push(
      or(
        sql`${knowledgeDebtItems.title} ILIKE ${"%" + search.trim() + "%"}`,
        sql`${knowledgeDebtItems.description} ILIKE ${"%" + search.trim() + "%"}`,
      ),
    );
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  // Subquery for vote count
  const voteCountSq = db
    .select({
      debtItemId: debtVotes.debtItemId,
      voteCount: count().as("vote_count"),
    })
    .from(debtVotes)
    .groupBy(debtVotes.debtItemId)
    .as("vote_counts");

  // Subquery for comment count
  const commentCountSq = db
    .select({
      debtItemId: debtComments.debtItemId,
      commentCount: count().as("comment_count"),
    })
    .from(debtComments)
    .groupBy(debtComments.debtItemId)
    .as("comment_counts");

  const priorityOrder = sql`CASE ${knowledgeDebtItems.priority}
    WHEN 'critical' THEN 0
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
    ELSE 4
  END`;

  let orderByClause;
  if (sortBy === "votes") {
    orderByClause = desc(sql`COALESCE(${voteCountSq.voteCount}, 0)`);
  } else if (sortBy === "priority") {
    orderByClause = asc(priorityOrder);
  } else {
    orderByClause = desc(knowledgeDebtItems.createdAt);
  }

  const reporter = db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .as("reporter");

  const assignee = db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .as("assignee");

  try {
    const rows = await db
      .select({
        id: knowledgeDebtItems.id,
        title: knowledgeDebtItems.title,
        description: knowledgeDebtItems.description,
        category: knowledgeDebtItems.category,
        priority: knowledgeDebtItems.priority,
        status: knowledgeDebtItems.status,
        tags: knowledgeDebtItems.tags,
        createdAt: knowledgeDebtItems.createdAt,
        updatedAt: knowledgeDebtItems.updatedAt,
        reporterUsername: reporter.username,
        reporterDisplayName: reporter.displayName,
        reporterAvatar: reporter.avatarUrl,
        assigneeUsername: assignee.username,
        assigneeDisplayName: assignee.displayName,
        assigneeAvatar: assignee.avatarUrl,
        voteCount: sql<number>`COALESCE(${voteCountSq.voteCount}, 0)::int`,
        commentCount: sql<number>`COALESCE(${commentCountSq.commentCount}, 0)::int`,
      })
      .from(knowledgeDebtItems)
      .leftJoin(reporter, eq(knowledgeDebtItems.reporterId, reporter.id))
      .leftJoin(assignee, eq(knowledgeDebtItems.assigneeId, assignee.id))
      .leftJoin(voteCountSq, eq(knowledgeDebtItems.id, voteCountSq.debtItemId))
      .leftJoin(
        commentCountSq,
        eq(knowledgeDebtItems.id, commentCountSq.debtItemId),
      )
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// getDebtItem
// ============================================================

export async function getDebtItem(id: string) {
  try {
  const reporter = db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .as("reporter");

  const assignee = db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .as("assignee");

  const resolver = db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
    })
    .from(users)
    .as("resolver");

  const item = await db
    .select({
      id: knowledgeDebtItems.id,
      title: knowledgeDebtItems.title,
      description: knowledgeDebtItems.description,
      category: knowledgeDebtItems.category,
      priority: knowledgeDebtItems.priority,
      status: knowledgeDebtItems.status,
      tags: knowledgeDebtItems.tags,
      relatedEntryId: knowledgeDebtItems.relatedEntryId,
      resolvedAt: knowledgeDebtItems.resolvedAt,
      resolutionNote: knowledgeDebtItems.resolutionNote,
      createdAt: knowledgeDebtItems.createdAt,
      updatedAt: knowledgeDebtItems.updatedAt,
      reporterId: knowledgeDebtItems.reporterId,
      assigneeId: knowledgeDebtItems.assigneeId,
      reporterUsername: reporter.username,
      reporterDisplayName: reporter.displayName,
      reporterAvatar: reporter.avatarUrl,
      assigneeUsername: assignee.username,
      assigneeDisplayName: assignee.displayName,
      assigneeAvatar: assignee.avatarUrl,
      resolverUsername: resolver.username,
      resolverDisplayName: resolver.displayName,
    })
    .from(knowledgeDebtItems)
    .leftJoin(reporter, eq(knowledgeDebtItems.reporterId, reporter.id))
    .leftJoin(assignee, eq(knowledgeDebtItems.assigneeId, assignee.id))
    .leftJoin(resolver, eq(knowledgeDebtItems.resolvedById, resolver.id))
    .where(eq(knowledgeDebtItems.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!item) return null;

  // Fetch votes
  const votes = await db
    .select({
      userId: debtVotes.userId,
      username: users.username,
    })
    .from(debtVotes)
    .leftJoin(users, eq(debtVotes.userId, users.id))
    .where(eq(debtVotes.debtItemId, id));

  // Fetch comments
  const comments = await db
    .select({
      id: debtComments.id,
      content: debtComments.content,
      createdAt: debtComments.createdAt,
      userId: debtComments.userId,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(debtComments)
    .leftJoin(users, eq(debtComments.userId, users.id))
    .where(eq(debtComments.debtItemId, id))
    .orderBy(asc(debtComments.createdAt));

  // Fetch related entry title if exists
  let relatedEntry = null;
  if (item.relatedEntryId) {
    relatedEntry = await db
      .select({
        id: knowledgeEntries.id,
        slug: knowledgeEntries.slug,
        title: knowledgeEntries.titleKo,
      })
      .from(knowledgeEntries)
      .where(eq(knowledgeEntries.id, item.relatedEntryId))
      .limit(1)
      .then((r) => r[0] ?? null);
  }

  return {
    ...item,
    votes,
    comments,
    relatedEntry,
    voteCount: votes.length,
  };
  } catch {
    return null;
  }
}

// ============================================================
// getDebtStats
// ============================================================

export async function getDebtStats() {
  try {
    const statusCounts = await db
      .select({
        status: knowledgeDebtItems.status,
        count: count(),
      })
      .from(knowledgeDebtItems)
      .groupBy(knowledgeDebtItems.status);

    const categoryCounts = await db
      .select({
        category: knowledgeDebtItems.category,
        count: count(),
      })
      .from(knowledgeDebtItems)
      .groupBy(knowledgeDebtItems.category);

    const priorityCounts = await db
      .select({
        priority: knowledgeDebtItems.priority,
        count: count(),
      })
      .from(knowledgeDebtItems)
      .groupBy(knowledgeDebtItems.priority);

    const byStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      byStatus[row.status] = Number(row.count);
    }

    const byCategory: Record<string, number> = {};
    for (const row of categoryCounts) {
      byCategory[row.category] = Number(row.count);
    }

    const byPriority: Record<string, number> = {};
    for (const row of priorityCounts) {
      byPriority[row.priority] = Number(row.count);
    }

    const total =
      (byStatus.open ?? 0) +
      (byStatus.in_progress ?? 0) +
      (byStatus.resolved ?? 0) +
      (byStatus.wont_fix ?? 0);
    const resolved = (byStatus.resolved ?? 0) + (byStatus.wont_fix ?? 0);
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      byStatus,
      byCategory,
      byPriority,
      total,
      resolutionRate,
    };
  } catch {
    return {
      byStatus: {},
      byCategory: {},
      byPriority: {},
      total: 0,
      resolutionRate: 0,
    };
  }
}

// ============================================================
// getMyDebtItems
// ============================================================

export async function getMyDebtItems(userId: string) {
  try {
    const voteCountSq = db
      .select({
        debtItemId: debtVotes.debtItemId,
        voteCount: count().as("vote_count"),
      })
      .from(debtVotes)
      .groupBy(debtVotes.debtItemId)
      .as("vote_counts");

    const rows = await db
      .select({
        id: knowledgeDebtItems.id,
        title: knowledgeDebtItems.title,
        category: knowledgeDebtItems.category,
        priority: knowledgeDebtItems.priority,
        status: knowledgeDebtItems.status,
        createdAt: knowledgeDebtItems.createdAt,
        voteCount: sql<number>`COALESCE(${voteCountSq.voteCount}, 0)::int`,
      })
      .from(knowledgeDebtItems)
      .leftJoin(voteCountSq, eq(knowledgeDebtItems.id, voteCountSq.debtItemId))
      .where(
        or(
          eq(knowledgeDebtItems.reporterId, userId),
          eq(knowledgeDebtItems.assigneeId, userId),
        ),
      )
      .orderBy(desc(knowledgeDebtItems.createdAt));

    return rows;
  } catch {
    return [];
  }
}
