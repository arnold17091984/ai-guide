"use server";

import { eq, desc, and, count, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  trendingItems,
  trendingSources,
  userBookmarks,
} from "@/lib/db/schema/trending";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// ============================================================
// getTrendingFeed — paginated feed with optional source filter
// ============================================================
export async function getTrendingFeed(opts: {
  source?: string;
  limit?: number;
  offset?: number;
  sortBy?: "score" | "publishedAt";
} = {}) {
  const { source, limit = 20, offset = 0, sortBy = "score" } = opts;

  const conditions = [];
  if (source) {
    conditions.push(eq(trendingItems.source, source));
  }

  const orderCol =
    sortBy === "publishedAt"
      ? desc(trendingItems.publishedAt)
      : desc(trendingItems.score);

  try {
    const rows = await db
      .select()
      .from(trendingItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderCol)
      .limit(limit)
      .offset(offset);

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// getTrendingSources — list all active sources
// ============================================================
export async function getTrendingSources() {
  try {
    const rows = await db
      .select()
      .from(trendingSources)
      .where(eq(trendingSources.isActive, true))
      .orderBy(trendingSources.name);

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// bookmarkItem — toggle bookmark (auth required)
// ============================================================
export async function bookmarkItem(trendingItemId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  // Check if already bookmarked
  const existing = await db
    .select({ id: userBookmarks.id })
    .from(userBookmarks)
    .where(
      and(
        eq(userBookmarks.userId, user.id),
        eq(userBookmarks.trendingItemId, trendingItemId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // Remove bookmark
    await db
      .delete(userBookmarks)
      .where(eq(userBookmarks.id, existing[0].id));
    return { bookmarked: false };
  }

  // Add bookmark
  await db.insert(userBookmarks).values({
    userId: user.id,
    trendingItemId,
  });
  return { bookmarked: true };
}

// ============================================================
// getUserBookmarks — user's bookmarked items
// ============================================================
export async function getUserBookmarks(
  userId: string,
  opts: { limit?: number; offset?: number } = {},
) {
  const { limit = 20, offset = 0 } = opts;

  try {
    const rows = await db
      .select({
        bookmark: userBookmarks,
        item: trendingItems,
      })
      .from(userBookmarks)
      .innerJoin(trendingItems, eq(userBookmarks.trendingItemId, trendingItems.id))
      .where(eq(userBookmarks.userId, userId))
      .orderBy(desc(userBookmarks.createdAt))
      .limit(limit)
      .offset(offset);

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// isBookmarked — check bookmark status
// ============================================================
export async function isBookmarked(
  userId: string,
  trendingItemId: string,
): Promise<boolean> {
  try {
    const rows = await db
      .select({ id: userBookmarks.id })
      .from(userBookmarks)
      .where(
        and(
          eq(userBookmarks.userId, userId),
          eq(userBookmarks.trendingItemId, trendingItemId),
        ),
      )
      .limit(1);

    return rows.length > 0;
  } catch {
    return false;
  }
}

// ============================================================
// getTrendingStats — count items per source, last fetch times
// ============================================================
export async function getTrendingStats() {
  try {
    const itemCounts = await db
      .select({
        source: trendingItems.source,
        count: count(),
      })
      .from(trendingItems)
      .groupBy(trendingItems.source);

    const sources = await db
      .select({
        name: trendingSources.name,
        displayName: trendingSources.displayName,
        lastFetchedAt: trendingSources.lastFetchedAt,
        isActive: trendingSources.isActive,
      })
      .from(trendingSources);

    const countsMap: Record<string, number> = {};
    for (const row of itemCounts) {
      countsMap[row.source] = row.count;
    }

    return {
      itemCounts: countsMap,
      sources,
      totalItems: Object.values(countsMap).reduce((a, b) => a + b, 0),
    };
  } catch {
    return { itemCounts: {}, sources: [], totalItems: 0 };
  }
}
