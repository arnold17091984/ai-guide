"use server";

import { desc, eq, count } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  knowledgeEntries,
  skills,
  users,
  votes,
  comments,
} from "@/lib/db/schema";

// ============================================================
// getDashboardStats — aggregate totals for hero banner
// ============================================================

export async function getDashboardStats() {
  try {
    const [entriesCount] = await db
      .select({ value: count() })
      .from(knowledgeEntries)
      .where(eq(knowledgeEntries.status, "published"));

    const [skillsCount] = await db
      .select({ value: count() })
      .from(skills)
      .where(eq(skills.status, "published"));

    const [usersCount] = await db
      .select({ value: count() })
      .from(users);

    const [votesCount] = await db
      .select({ value: count() })
      .from(votes);

    return {
      totalEntries: Number(entriesCount.value),
      totalSkills: Number(skillsCount.value),
      totalUsers: Number(usersCount.value),
      totalVotes: Number(votesCount.value),
    };
  } catch {
    return { totalEntries: 0, totalSkills: 0, totalUsers: 0, totalVotes: 0 };
  }
}

// ============================================================
// getRecentEntries — latest published knowledge entries
// ============================================================

export async function getRecentEntries(limit = 5) {
  try {
    const rows = await db
      .select({
        id: knowledgeEntries.id,
        slug: knowledgeEntries.slug,
        titleKo: knowledgeEntries.titleKo,
        titleEn: knowledgeEntries.titleEn,
        titleJa: knowledgeEntries.titleJa,
        summaryKo: knowledgeEntries.summaryKo,
        summaryEn: knowledgeEntries.summaryEn,
        summaryJa: knowledgeEntries.summaryJa,
        contentType: knowledgeEntries.contentType,
        publishedAt: knowledgeEntries.publishedAt,
        authorId: knowledgeEntries.authorId,
        authorUsername: users.username,
        authorDisplayName: users.displayName,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(knowledgeEntries)
      .innerJoin(users, eq(knowledgeEntries.authorId, users.id))
      .where(eq(knowledgeEntries.status, "published"))
      .orderBy(desc(knowledgeEntries.publishedAt))
      .limit(limit);

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// getPopularSkills — most downloaded/starred skills
// ============================================================

export async function getPopularSkills(limit = 5) {
  try {
    const rows = await db
      .select({
        id: skills.id,
        slug: skills.slug,
        name: skills.name,
        description: skills.description,
        downloads: skills.downloads,
        stars: skills.stars,
        authorId: skills.authorId,
        authorUsername: users.username,
        authorDisplayName: users.displayName,
      })
      .from(skills)
      .innerJoin(users, eq(skills.authorId, users.id))
      .where(eq(skills.status, "published"))
      .orderBy(desc(skills.downloads))
      .limit(limit);

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// getActiveDiscussions — entries with most recent comments
// ============================================================

export async function getActiveDiscussions(limit = 5) {
  try {
    const rows = await db
      .select({
        id: knowledgeEntries.id,
        slug: knowledgeEntries.slug,
        titleKo: knowledgeEntries.titleKo,
        titleEn: knowledgeEntries.titleEn,
        titleJa: knowledgeEntries.titleJa,
        commentCount: count(comments.id),
      })
      .from(knowledgeEntries)
      .innerJoin(
        comments,
        eq(comments.targetId, knowledgeEntries.id),
      )
      .where(eq(knowledgeEntries.status, "published"))
      .groupBy(knowledgeEntries.id)
      .orderBy(desc(count(comments.id)))
      .limit(limit);

    return rows;
  } catch {
    return [];
  }
}
