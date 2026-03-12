import { eq, and, sql, count } from "drizzle-orm";
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
// Point values for reputation-earning activities
// ============================================================

export const POINT_VALUES = {
  vote_received: 10,
  answer_accepted: 15,
  entry_published: 25,
  comment_posted: 2,
  skill_starred: 5,
  edit_approved: 20,
} as const;

// ============================================================
// Reputation tiers (aligned with ReputationBadge component)
// ============================================================

export interface ReputationLevel {
  name: string;
  minScore: number;
  nextTierName: string | null;
  nextTierThreshold: number | null;
}

const TIERS = [
  { name: "Sage", minScore: 2500 },
  { name: "Master", minScore: 1000 },
  { name: "Expert", minScore: 500 },
  { name: "Contributor", minScore: 200 },
  { name: "Learner", minScore: 50 },
  { name: "Novice", minScore: 0 },
] as const;

/**
 * Returns the reputation tier for a given score,
 * along with the next tier name and threshold.
 */
export function getReputationLevel(score: number): ReputationLevel {
  for (let i = 0; i < TIERS.length; i++) {
    if (score >= TIERS[i].minScore) {
      const nextTier = i > 0 ? TIERS[i - 1] : null;
      return {
        name: TIERS[i].name,
        minScore: TIERS[i].minScore,
        nextTierName: nextTier?.name ?? null,
        nextTierThreshold: nextTier?.minScore ?? null,
      };
    }
  }
  const last = TIERS[TIERS.length - 1];
  return {
    name: last.name,
    minScore: last.minScore,
    nextTierName: TIERS[TIERS.length - 2]?.name ?? null,
    nextTierThreshold: TIERS[TIERS.length - 2]?.minScore ?? null,
  };
}

// ============================================================
// Achievement definitions
// ============================================================

export interface AchievementDef {
  slug: string;
  nameKey: string;
  descriptionKey: string;
  iconName: string;
  category: string;
  tier: string;
  requiredValue: number;
  isSecret: boolean;
  /** Function to compute the current progress value for a user */
  computeProgress: (userId: string) => Promise<number>;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  {
    slug: "first-entry",
    nameKey: "community.achievements.badge.firstEntry",
    descriptionKey: "community.achievements.badge.firstEntryDesc",
    iconName: "document",
    category: "contribution",
    tier: "bronze",
    requiredValue: 1,
    isSecret: false,
    computeProgress: async (userId: string) => {
      const result = await db
        .select({ count: count() })
        .from(knowledgeEntries)
        .where(
          and(
            eq(knowledgeEntries.authorId, userId),
            eq(knowledgeEntries.status, "published"),
          ),
        );
      return result[0]?.count ?? 0;
    },
  },
  {
    slug: "helpful",
    nameKey: "community.achievements.badge.helpful",
    descriptionKey: "community.achievements.badge.helpfulDesc",
    iconName: "heart",
    category: "quality",
    tier: "silver",
    requiredValue: 10,
    isSecret: false,
    computeProgress: async (userId: string) => {
      // Count upvotes received on user's content
      const result = await db
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
        );
      return result[0]?.total ?? 0;
    },
  },
  {
    slug: "prolific-writer",
    nameKey: "community.achievements.badge.prolificWriter",
    descriptionKey: "community.achievements.badge.prolificWriterDesc",
    iconName: "pencil",
    category: "contribution",
    tier: "gold",
    requiredValue: 10,
    isSecret: false,
    computeProgress: async (userId: string) => {
      const result = await db
        .select({ count: count() })
        .from(knowledgeEntries)
        .where(
          and(
            eq(knowledgeEntries.authorId, userId),
            eq(knowledgeEntries.status, "published"),
          ),
        );
      return result[0]?.count ?? 0;
    },
  },
  {
    slug: "community-builder",
    nameKey: "community.achievements.badge.communityBuilder",
    descriptionKey: "community.achievements.badge.communityBuilderDesc",
    iconName: "chat",
    category: "social",
    tier: "gold",
    requiredValue: 50,
    isSecret: false,
    computeProgress: async (userId: string) => {
      const result = await db
        .select({ count: count() })
        .from(comments)
        .where(
          and(
            eq(comments.authorId, userId),
            eq(comments.isDeleted, false),
          ),
        );
      return result[0]?.count ?? 0;
    },
  },
  {
    slug: "rising-star",
    nameKey: "community.achievements.badge.risingStar",
    descriptionKey: "community.achievements.badge.risingStarDesc",
    iconName: "star",
    category: "milestone",
    tier: "silver",
    requiredValue: 200,
    isSecret: false,
    computeProgress: async (userId: string) => {
      const result = await db
        .select({ reputation: users.reputation })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return result[0]?.reputation ?? 0;
    },
  },
  {
    slug: "skill-master",
    nameKey: "community.achievements.badge.skillMaster",
    descriptionKey: "community.achievements.badge.skillMasterDesc",
    iconName: "bolt",
    category: "contribution",
    tier: "gold",
    requiredValue: 20,
    isSecret: false,
    computeProgress: async (userId: string) => {
      // Count skills published by user with stars >= 1
      const result = await db
        .select({ count: count() })
        .from(skills)
        .where(
          and(
            eq(skills.authorId, userId),
            eq(skills.status, "published"),
          ),
        );
      return result[0]?.count ?? 0;
    },
  },
  {
    slug: "editor",
    nameKey: "community.achievements.badge.editor",
    descriptionKey: "community.achievements.badge.editorDesc",
    iconName: "edit",
    category: "quality",
    tier: "silver",
    requiredValue: 5,
    isSecret: false,
    computeProgress: async (userId: string) => {
      const result = await db
        .select({ count: count() })
        .from(editSuggestions)
        .where(
          and(
            eq(editSuggestions.authorId, userId),
            eq(editSuggestions.status, "accepted"),
          ),
        );
      return result[0]?.count ?? 0;
    },
  },
  {
    slug: "sage",
    nameKey: "community.achievements.badge.sage",
    descriptionKey: "community.achievements.badge.sageDesc",
    iconName: "crown",
    category: "milestone",
    tier: "platinum",
    requiredValue: 2500,
    isSecret: false,
    computeProgress: async (userId: string) => {
      const result = await db
        .select({ reputation: users.reputation })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return result[0]?.reputation ?? 0;
    },
  },
];

// ============================================================
// calculateReputation
// ============================================================

export async function calculateReputation(userId: string): Promise<number> {
  // Votes received on user's content (knowledge entries)
  const votesReceivedResult = await db
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
    );
  const votesReceived = votesReceivedResult[0]?.total ?? 0;

  // Published entries
  const entriesResult = await db
    .select({ total: count() })
    .from(knowledgeEntries)
    .where(
      and(
        eq(knowledgeEntries.authorId, userId),
        eq(knowledgeEntries.status, "published"),
      ),
    );
  const entriesPublished = entriesResult[0]?.total ?? 0;

  // Comments posted
  const commentsResult = await db
    .select({ total: count() })
    .from(comments)
    .where(
      and(
        eq(comments.authorId, userId),
        eq(comments.isDeleted, false),
      ),
    );
  const commentsPosted = commentsResult[0]?.total ?? 0;

  // Approved edits
  const editsResult = await db
    .select({ total: count() })
    .from(editSuggestions)
    .where(
      and(
        eq(editSuggestions.authorId, userId),
        eq(editSuggestions.status, "accepted"),
      ),
    );
  const editsApproved = editsResult[0]?.total ?? 0;

  // Skills published (as proxy for "skill starred")
  const skillsResult = await db
    .select({ totalStars: sql<number>`coalesce(sum(${skills.stars}), 0)` })
    .from(skills)
    .where(eq(skills.authorId, userId));
  const skillStars = Number(skillsResult[0]?.totalStars ?? 0);

  const total =
    votesReceived * POINT_VALUES.vote_received +
    entriesPublished * POINT_VALUES.entry_published +
    commentsPosted * POINT_VALUES.comment_posted +
    editsApproved * POINT_VALUES.edit_approved +
    skillStars * POINT_VALUES.skill_starred;

  return total;
}

// ============================================================
// checkAndUnlockAchievements
// ============================================================

export async function checkAndUnlockAchievements(
  userId: string,
): Promise<{ newlyUnlocked: string[] }> {
  const newlyUnlocked: string[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    const progress = await def.computeProgress(userId);

    // Find or create the achievement row in the DB
    const existing = await db
      .select({ id: achievements.id })
      .from(achievements)
      .where(eq(achievements.slug, def.slug))
      .limit(1);

    let achievementId: string;
    if (existing.length === 0) {
      // Seed the achievement definition
      const inserted = await db
        .insert(achievements)
        .values({
          slug: def.slug,
          nameKey: def.nameKey,
          descriptionKey: def.descriptionKey,
          iconName: def.iconName,
          category: def.category,
          tier: def.tier,
          requiredValue: def.requiredValue,
          isSecret: def.isSecret,
        })
        .returning({ id: achievements.id });
      achievementId = inserted[0].id;
    } else {
      achievementId = existing[0].id;
    }

    // Check if user already has this achievement
    const userAch = await db
      .select({
        id: userAchievements.id,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId),
        ),
      )
      .limit(1);

    if (userAch.length === 0) {
      // Create record
      const isUnlocked = progress >= def.requiredValue;
      await db.insert(userAchievements).values({
        userId,
        achievementId,
        progress,
        unlockedAt: isUnlocked ? sql`now()` : undefined,
      });
      if (isUnlocked) {
        newlyUnlocked.push(def.slug);
      }
    } else if (!userAch[0].unlockedAt) {
      // Update progress and check for unlock
      const isUnlocked = progress >= def.requiredValue;
      await db
        .update(userAchievements)
        .set({
          progress,
          ...(isUnlocked ? { unlockedAt: sql`now()` } : {}),
        })
        .where(eq(userAchievements.id, userAch[0].id));
      if (isUnlocked) {
        newlyUnlocked.push(def.slug);
      }
    } else {
      // Already unlocked, just update progress
      await db
        .update(userAchievements)
        .set({ progress })
        .where(eq(userAchievements.id, userAch[0].id));
    }
  }

  return { newlyUnlocked };
}
