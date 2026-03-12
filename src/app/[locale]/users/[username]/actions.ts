import { db } from "@/lib/db/client";
import { userAchievements, achievements } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

// ============================================================
// Profile-specific data fetching
// ============================================================

export interface ProfileAchievement {
  id: string;
  slug: string;
  nameKey: string;
  descriptionKey: string;
  iconName: string;
  tier: string;
  category: string;
  unlockedAt: Date | null;
}

/**
 * Fetch unlocked achievements for a user's public profile.
 */
export async function getUserAchievementsForProfile(
  userId: string,
): Promise<ProfileAchievement[]> {
  const rows = await db
    .select({
      id: achievements.id,
      slug: achievements.slug,
      nameKey: achievements.nameKey,
      descriptionKey: achievements.descriptionKey,
      iconName: achievements.iconName,
      tier: achievements.tier,
      category: achievements.category,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(
      and(
        eq(userAchievements.userId, userId),
        isNotNull(userAchievements.unlockedAt),
      ),
    );

  return rows;
}
