import { db } from "../client";
import {
  users,
  knowledgeEntries,
  comments,
  skills,
} from "../schema";
import { eq, and, sql, desc, or, ilike, count } from "drizzle-orm";

// ============================================================
// User Queries
// ============================================================

/**
 * Fetch a user's full public profile by username.
 */
export async function getUserByUsername(username: string) {
  const row = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return row[0] ?? null;
}

/**
 * Aggregate stats for a user's public profile.
 */
export async function getUserStats(userId: string) {
  const [entriesResult, commentsResult, votesResult, skillsResult] =
    await Promise.all([
      // Published entries count
      db
        .select({ total: count() })
        .from(knowledgeEntries)
        .where(
          and(
            eq(knowledgeEntries.authorId, userId),
            eq(knowledgeEntries.status, "published"),
          ),
        ),

      // Comments count (non-deleted)
      db
        .select({ total: count() })
        .from(comments)
        .where(
          and(
            eq(comments.authorId, userId),
            eq(comments.isDeleted, false),
          ),
        ),

      // Upvotes received on user's knowledge entries
      db.execute(sql`
        SELECT COALESCE(SUM(v.value), 0)::int AS total
        FROM votes v
        INNER JOIN knowledge_entries ke ON ke.id = v.target_id
        WHERE v.target_type = 'knowledge_entry'
          AND ke.author_id = ${userId}
          AND v.value > 0
      `),

      // Skills starred (skills authored by the user, sum of stars)
      db
        .select({
          total: sql<number>`COALESCE(SUM(${skills.stars}), 0)::int`,
        })
        .from(skills)
        .where(eq(skills.authorId, userId)),
    ]);

  return {
    entries: Number(entriesResult[0]?.total ?? 0),
    comments: Number(commentsResult[0]?.total ?? 0),
    votesReceived: Number(
      (votesResult[0] as { total: number })?.total ?? 0,
    ),
    skillsStarred: Number(skillsResult[0]?.total ?? 0),
  };
}

/**
 * Fetch top contributors ordered by reputation.
 */
export async function getTopContributors(limit = 20) {
  return db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      reputation: users.reputation,
      role: users.role,
      isVerified: users.isVerified,
    })
    .from(users)
    .orderBy(desc(users.reputation))
    .limit(limit);
}

/**
 * Search users by username or display name.
 */
export async function searchUsers(query: string, limit = 20) {
  const pattern = `%${query}%`;

  return db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      reputation: users.reputation,
      role: users.role,
      isVerified: users.isVerified,
    })
    .from(users)
    .where(
      or(
        ilike(users.username, pattern),
        ilike(users.displayName, pattern),
      ),
    )
    .orderBy(desc(users.reputation))
    .limit(limit);
}
