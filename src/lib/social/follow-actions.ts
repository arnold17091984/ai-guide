"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { follows } from "@/lib/db/schema/social";
import { users } from "@/lib/db/schema/users";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// ============================================================
// followUser
// ============================================================
// Inserts a follow edge from the authenticated user to
// targetUserId. No-ops if the row already exists (unique
// constraint). A user cannot follow themselves.
// ============================================================
export async function followUser(
  targetUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "unauthenticated" };
  }

  if (user.id === targetUserId) {
    return { success: false, error: "cannotFollowSelf" };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(follows)
        .values({ followerId: user.id, followingId: targetUserId })
        .onConflictDoNothing();
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ============================================================
// unfollowUser
// ============================================================
// Removes the follow edge from the authenticated user to
// targetUserId. No-ops if the row does not exist.
// ============================================================
export async function unfollowUser(
  targetUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "unauthenticated" };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, user.id),
            eq(follows.followingId, targetUserId),
          ),
        );
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ============================================================
// isFollowing
// ============================================================
// Returns true if the authenticated user follows targetUserId.
// Returns false when unauthenticated.
// ============================================================
export async function isFollowing(targetUserId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  try {
    const row = await db
      .select({ id: follows.id })
      .from(follows)
      .where(
        and(
          eq(follows.followerId, user.id),
          eq(follows.followingId, targetUserId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    return row !== null;
  } catch {
    return false;
  }
}

// ============================================================
// getFollowerCount
// ============================================================
// Public. Returns the number of users following userId.
// ============================================================
export async function getFollowerCount(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followingId, userId))
      .then((rows) => rows[0]);

    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

// ============================================================
// getFollowingCount
// ============================================================
// Public. Returns the number of users that userId follows.
// ============================================================
export async function getFollowingCount(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followerId, userId))
      .then((rows) => rows[0]);

    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

// ============================================================
// Shared user projection used by getFollowers / getFollowing
// ============================================================
export type FollowUserSummary = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

// ============================================================
// getFollowers
// ============================================================
// Returns up to `limit` users who follow userId.
// Default limit: 50.
// ============================================================
export async function getFollowers(
  userId: string,
  limit = 50,
): Promise<FollowUserSummary[]> {
  try {
    return db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(follows)
      .innerJoin(users, eq(users.id, follows.followerId))
      .where(eq(follows.followingId, userId))
      .orderBy(follows.createdAt)
      .limit(limit);
  } catch {
    return [];
  }
}

// ============================================================
// getFollowing
// ============================================================
// Returns up to `limit` users that userId follows.
// Default limit: 50.
// ============================================================
export async function getFollowing(
  userId: string,
  limit = 50,
): Promise<FollowUserSummary[]> {
  try {
    return db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(follows)
      .innerJoin(users, eq(users.id, follows.followingId))
      .where(eq(follows.followerId, userId))
      .orderBy(follows.createdAt)
      .limit(limit);
  } catch {
    return [];
  }
}
