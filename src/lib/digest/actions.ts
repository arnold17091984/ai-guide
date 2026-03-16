"use server";

import { eq, desc, gte, and, count } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  weeklyDigests,
  userDigestPreferences,
  knowledgeEntries,
  skills,
  users,
  votes,
  comments,
} from "@/lib/db/schema";
import type {
  DigestTopEntry,
  DigestTopSkill,
  DigestTopContributor,
  DigestStats,
} from "@/lib/db/schema/digests";

// ============================================================
// getLatestDigest — fetch the most recent weekly digest
// ============================================================

export async function getLatestDigest() {
  try {
    const rows = await db
      .select()
      .from(weeklyDigests)
      .orderBy(desc(weeklyDigests.weekStart))
      .limit(1);

    return rows[0] ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// getDigestByOffset — fetch digest with pagination offset
// ============================================================
// offset 0 = latest, 1 = one week prior, etc.

export async function getDigestByOffset(offset: number) {
  try {
    const rows = await db
      .select()
      .from(weeklyDigests)
      .orderBy(desc(weeklyDigests.weekStart))
      .offset(offset)
      .limit(1);

    return rows[0] ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// generateWeeklyDigest — compute and insert a new digest
// ============================================================

export async function generateWeeklyDigest() {
  const now = new Date();
  // Week starts on Monday
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diffToMonday - 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // --- Top entries by vote count in the past week ---
  const topEntriesRaw = await db
    .select({
      id: knowledgeEntries.id,
      title: knowledgeEntries.titleKo,
      slug: knowledgeEntries.slug,
      voteCount: count(votes.id),
    })
    .from(knowledgeEntries)
    .leftJoin(
      votes,
      and(
        eq(votes.targetType, "knowledge_entry"),
        eq(votes.targetId, knowledgeEntries.id),
        gte(votes.createdAt, weekStart),
      ),
    )
    .where(eq(knowledgeEntries.status, "published"))
    .groupBy(knowledgeEntries.id)
    .orderBy(desc(count(votes.id)))
    .limit(5);

  const topEntries: DigestTopEntry[] = topEntriesRaw.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    voteCount: Number(r.voteCount),
  }));

  // --- Top skills by downloads ---
  const topSkillsRaw = await db
    .select({
      id: skills.id,
      name: skills.name,
      slug: skills.slug,
      downloads: skills.downloads,
    })
    .from(skills)
    .where(eq(skills.status, "published"))
    .orderBy(desc(skills.downloads))
    .limit(5);

  const topSkillsData: DigestTopSkill[] = topSkillsRaw.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    downloads: r.downloads,
  }));

  // --- Top contributors by reputation ---
  const topContribsRaw = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      reputation: users.reputation,
    })
    .from(users)
    .orderBy(desc(users.reputation))
    .limit(5);

  const topContributors: DigestTopContributor[] = topContribsRaw.map((r) => ({
    id: r.id,
    username: r.username,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    reputation: r.reputation,
  }));

  // --- Platform stats ---
  const [newEntriesCount] = await db
    .select({ value: count() })
    .from(knowledgeEntries)
    .where(gte(knowledgeEntries.createdAt, weekStart));

  const [newSkillsCount] = await db
    .select({ value: count() })
    .from(skills)
    .where(gte(skills.createdAt, weekStart));

  const [newUsersCount] = await db
    .select({ value: count() })
    .from(users)
    .where(gte(users.createdAt, weekStart));

  const [totalVotesCount] = await db
    .select({ value: count() })
    .from(votes)
    .where(gte(votes.createdAt, weekStart));

  const [totalCommentsCount] = await db
    .select({ value: count() })
    .from(comments)
    .where(gte(comments.createdAt, weekStart));

  const stats: DigestStats = {
    newEntries: Number(newEntriesCount.value),
    newSkills: Number(newSkillsCount.value),
    newUsers: Number(newUsersCount.value),
    totalVotes: Number(totalVotesCount.value),
    totalComments: Number(totalCommentsCount.value),
  };

  // --- Insert digest ---
  const [digest] = await db
    .insert(weeklyDigests)
    .values({
      weekStart,
      weekEnd,
      topEntries,
      topSkills: topSkillsData,
      topContributors,
      stats,
    })
    .returning();

  return digest;
}

// ============================================================
// getUserDigestPreferences
// ============================================================

export async function getUserDigestPreferences(userId: string) {
  const rows = await db
    .select()
    .from(userDigestPreferences)
    .where(eq(userDigestPreferences.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}

// ============================================================
// updateDigestPreferences
// ============================================================

export async function updateDigestPreferences(
  userId: string,
  prefs: {
    emailDigest?: boolean;
    digestFrequency?: string;
    preferredSources?: string[];
  },
) {
  const existing = await getUserDigestPreferences(userId);

  if (existing) {
    const [updated] = await db
      .update(userDigestPreferences)
      .set({
        ...prefs,
        updatedAt: new Date(),
      })
      .where(eq(userDigestPreferences.userId, userId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(userDigestPreferences)
    .values({
      userId,
      ...prefs,
    })
    .returning();
  return created;
}
