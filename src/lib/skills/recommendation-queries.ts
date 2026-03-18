import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { contentRelations, skills, userSkills } from "@/lib/db/schema";

// ============================================================
// Types
// ============================================================

export type RecommendedSkill = {
  id: string;
  slug: string;
  name: string;
  description: string;
  downloads: number;
  stars: number;
  status: string;
};

// ============================================================
// getSkillRecommendations
// ============================================================
// Finds skills related to skills the user has already completed
// via contentRelations (relationType = 'related' | 'builds_upon'),
// excluding skills the user has already registered.

export async function getSkillRecommendations(
  userId: string,
  limit = 8,
): Promise<RecommendedSkill[]> {
  const safeLimit = Math.min(Math.max(1, limit), 50);

  try {
    // Fetch all skill IDs the user has registered (any status)
    const userSkillRows = await db
      .select({ skillId: userSkills.skillId })
      .from(userSkills)
      .where(eq(userSkills.userId, userId));

    const registeredSkillIds = userSkillRows.map((r) => r.skillId);

    // Find completed skills to use as source for recommendations
    const completedSkillRows = await db
      .select({ skillId: userSkills.skillId })
      .from(userSkills)
      .where(
        and(
          eq(userSkills.userId, userId),
          eq(userSkills.status, "completed"),
        ),
      );

    if (completedSkillRows.length === 0) return [];

    const completedSkillIds = completedSkillRows.map((r) => r.skillId);

    // Find skills related to completed skills via contentRelations
    const relationRows = await db
      .select({ targetId: contentRelations.targetId })
      .from(contentRelations)
      .where(
        and(
          eq(contentRelations.sourceType, "skill"),
          eq(contentRelations.targetType, "skill"),
          inArray(contentRelations.sourceId, completedSkillIds),
          inArray(contentRelations.relationType, ["related", "builds_upon"]),
        ),
      );

    const candidateIds = [
      ...new Set(relationRows.map((r) => r.targetId)),
    ].filter((id) => !registeredSkillIds.includes(id));

    if (candidateIds.length === 0) return [];

    // Fetch skill records for candidates, published only
    const rows = await db
      .select({
        id: skills.id,
        slug: skills.slug,
        name: skills.name,
        description: skills.description,
        downloads: skills.downloads,
        stars: skills.stars,
        status: skills.status,
      })
      .from(skills)
      .where(
        and(
          inArray(skills.id, candidateIds),
          eq(skills.status, "published"),
        ),
      )
      .limit(safeLimit);

    return rows;
  } catch {
    return [];
  }
}
