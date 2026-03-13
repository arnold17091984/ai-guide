"use server";

import { eq, desc, sql, and, count, gte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  users,
  votes,
  comments,
  editSuggestions,
  knowledgeEntries,
  skills,
  achievements,
  userAchievements,
} from "@/lib/db/schema";

// ============================================================
// getUserAchievements
// ============================================================

export interface UserAchievementWithDetails {
  id: string;
  slug: string;
  nameKey: string;
  descriptionKey: string;
  iconName: string;
  category: string;
  tier: string;
  requiredValue: number;
  isSecret: boolean;
  progress: number;
  unlockedAt: Date | null;
}

export async function getUserAchievements(
  userId: string,
): Promise<UserAchievementWithDetails[]> {
  try {
    const rows = await db
      .select({
        id: userAchievements.id,
        slug: achievements.slug,
        nameKey: achievements.nameKey,
        descriptionKey: achievements.descriptionKey,
        iconName: achievements.iconName,
        category: achievements.category,
        tier: achievements.tier,
        requiredValue: achievements.requiredValue,
        isSecret: achievements.isSecret,
        progress: userAchievements.progress,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// getAllAchievements
// ============================================================

export interface AchievementWithUnlockCount {
  id: string;
  slug: string;
  nameKey: string;
  descriptionKey: string;
  iconName: string;
  category: string;
  tier: string;
  requiredValue: number;
  isSecret: boolean;
  unlockCount: number;
}

export async function getAllAchievements(): Promise<AchievementWithUnlockCount[]> {
  try {
    const rows = await db
      .select({
        id: achievements.id,
        slug: achievements.slug,
        nameKey: achievements.nameKey,
        descriptionKey: achievements.descriptionKey,
        iconName: achievements.iconName,
        category: achievements.category,
        tier: achievements.tier,
        requiredValue: achievements.requiredValue,
        isSecret: achievements.isSecret,
        unlockCount: sql<number>`count(${userAchievements.id})::int`,
      })
      .from(achievements)
      .leftJoin(
        userAchievements,
        and(
          eq(userAchievements.achievementId, achievements.id),
          sql`${userAchievements.unlockedAt} is not null`,
        ),
      )
      .groupBy(achievements.id)
      .orderBy(achievements.category, achievements.tier);

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// getLeaderboard
// ============================================================

export interface LeaderboardEntry {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputation: number;
  rank: number;
}

export async function getLeaderboard(
  limit: number = 50,
): Promise<LeaderboardEntry[]> {
  try {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        reputation: users.reputation,
      })
      .from(users)
      .orderBy(desc(users.reputation))
      .limit(limit);

    return rows.map((row, i) => ({
      ...row,
      rank: i + 1,
    }));
  } catch {
    return [];
  }
}

// ============================================================
// getRisingStars (last 30 days growth)
// ============================================================

export async function getRisingStars(
  limit: number = 50,
): Promise<LeaderboardEntry[]> {
  // Users who have created the most content / received the most votes
  // in the last 30 days, ordered by recent activity score
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // Simple heuristic: count recent published entries + recent comments
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        reputation: users.reputation,
        recentActivity: sql<number>`(
          (SELECT count(*) FROM knowledge_entries ke
           WHERE ke.author_id = ${users.id}
           AND ke.status = 'published'
           AND ke.published_at >= ${thirtyDaysAgo.toISOString()}) * 25 +
          (SELECT count(*) FROM comments c
           WHERE c.author_id = ${users.id}
           AND c.is_deleted = false
           AND c.created_at >= ${thirtyDaysAgo.toISOString()}) * 2
        )::int`,
      })
      .from(users)
      .orderBy(
        sql`(
          (SELECT count(*) FROM knowledge_entries ke
           WHERE ke.author_id = ${users.id}
           AND ke.status = 'published'
           AND ke.published_at >= ${thirtyDaysAgo.toISOString()}) * 25 +
          (SELECT count(*) FROM comments c
           WHERE c.author_id = ${users.id}
           AND c.is_deleted = false
           AND c.created_at >= ${thirtyDaysAgo.toISOString()}) * 2
        ) desc`,
      )
      .limit(limit);

    return rows
      .filter((r) => r.recentActivity > 0)
      .map((row, i) => ({
        id: row.id,
        username: row.username,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl,
        reputation: row.reputation,
        rank: i + 1,
      }));
  } catch {
    return [];
  }
}

// ============================================================
// getUserStats
// ============================================================

export interface UserStats {
  entriesPublished: number;
  commentsPosted: number;
  votesReceived: number;
  editsApproved: number;
  skillsPublished: number;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const [entriesResult, commentsResult, votesResult, editsResult, skillsResult] =
      await Promise.all([
        db
          .select({ total: count() })
          .from(knowledgeEntries)
          .where(
            and(
              eq(knowledgeEntries.authorId, userId),
              eq(knowledgeEntries.status, "published"),
            ),
          ),
        db
          .select({ total: count() })
          .from(comments)
          .where(
            and(
              eq(comments.authorId, userId),
              eq(comments.isDeleted, false),
            ),
          ),
        db
          .select({ total: count() })
          .from(votes)
          .innerJoin(
            knowledgeEntries,
            and(
              eq(votes.targetId, knowledgeEntries.id),
              eq(votes.targetType, "knowledge_entry"),
            ),
          )
          .where(
            and(
              eq(knowledgeEntries.authorId, userId),
              eq(votes.value, sql`1`),
            ),
          ),
        db
          .select({ total: count() })
          .from(editSuggestions)
          .where(
            and(
              eq(editSuggestions.authorId, userId),
              eq(editSuggestions.status, "accepted"),
            ),
          ),
        db
          .select({ total: count() })
          .from(skills)
          .where(
            and(
              eq(skills.authorId, userId),
              eq(skills.status, "published"),
            ),
          ),
      ]);

    return {
      entriesPublished: entriesResult[0]?.total ?? 0,
      commentsPosted: commentsResult[0]?.total ?? 0,
      votesReceived: votesResult[0]?.total ?? 0,
      editsApproved: editsResult[0]?.total ?? 0,
      skillsPublished: skillsResult[0]?.total ?? 0,
    };
  } catch {
    return {
      entriesPublished: 0,
      commentsPosted: 0,
      votesReceived: 0,
      editsApproved: 0,
      skillsPublished: 0,
    };
  }
}
