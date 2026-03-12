"use server";

import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { activityFeed } from "@/lib/db/schema/notifications";
import { users } from "@/lib/db/schema/users";
import type { NewActivityFeedEntry } from "@/lib/db/schema/notifications";

// ============================================================
// recordActivity
// ============================================================
export async function recordActivity(
  params: Omit<NewActivityFeedEntry, "id" | "createdAt">,
) {
  const [row] = await db.insert(activityFeed).values(params).returning();
  return row;
}

// ============================================================
// getPublicActivityFeed — global feed (public activities)
// ============================================================
export async function getPublicActivityFeed(
  opts: { limit?: number; offset?: number; actionType?: string } = {},
) {
  const { limit = 20, offset = 0, actionType } = opts;

  const conditions = [eq(activityFeed.isPublic, true)];
  if (actionType) {
    conditions.push(eq(activityFeed.actionType, actionType));
  }

  const rows = await db
    .select({
      id: activityFeed.id,
      actorId: activityFeed.actorId,
      actionType: activityFeed.actionType,
      targetType: activityFeed.targetType,
      targetId: activityFeed.targetId,
      targetTitle: activityFeed.targetTitle,
      metadata: activityFeed.metadata,
      createdAt: activityFeed.createdAt,
      isPublic: activityFeed.isPublic,
      actorUsername: users.username,
      actorDisplayName: users.displayName,
      actorAvatarUrl: users.avatarUrl,
    })
    .from(activityFeed)
    .leftJoin(users, eq(activityFeed.actorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(activityFeed.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

// ============================================================
// getUserActivityFeed — user-specific feed
// ============================================================
export async function getUserActivityFeed(
  userId: string,
  opts: { limit?: number; offset?: number } = {},
) {
  const { limit = 20, offset = 0 } = opts;

  const rows = await db
    .select({
      id: activityFeed.id,
      actorId: activityFeed.actorId,
      actionType: activityFeed.actionType,
      targetType: activityFeed.targetType,
      targetId: activityFeed.targetId,
      targetTitle: activityFeed.targetTitle,
      metadata: activityFeed.metadata,
      createdAt: activityFeed.createdAt,
      isPublic: activityFeed.isPublic,
      actorUsername: users.username,
      actorDisplayName: users.displayName,
      actorAvatarUrl: users.avatarUrl,
    })
    .from(activityFeed)
    .leftJoin(users, eq(activityFeed.actorId, users.id))
    .where(eq(activityFeed.actorId, userId))
    .orderBy(desc(activityFeed.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

// ============================================================
// getFollowingFeed — for now returns global feed (future-ready)
// ============================================================
export async function getFollowingFeed(
  _userId: string,
  opts: { limit?: number; offset?: number } = {},
) {
  // Future: filter by followed users
  return getPublicActivityFeed(opts);
}
