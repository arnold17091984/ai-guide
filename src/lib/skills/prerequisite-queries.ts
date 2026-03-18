import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { contentRelations, skills, userSkills } from "@/lib/db/schema";

// ============================================================
// Types
// ============================================================

export type SkillPrerequisite = {
  id: string;
  name: string;
  slug: string;
  isCompleted: boolean;
};

// ============================================================
// getSkillPrerequisites
// ============================================================
// Returns prerequisite skills for a given skillId.
// contentRelations encodes "source requires target" semantics:
//   relationType='prerequisite', targetType='skill', targetId=skillId
// means sourceId is a skill that is a prerequisite OF skillId.
// If userId is provided, each result includes whether that user
// has already completed the prerequisite.

export async function getSkillPrerequisites(
  skillId: string,
  userId?: string,
): Promise<SkillPrerequisite[]> {
  try {
    // Find all relations where something is declared a prerequisite of skillId
    const relationRows = await db
      .select({ sourceId: contentRelations.sourceId })
      .from(contentRelations)
      .where(
        and(
          eq(contentRelations.relationType, "prerequisite"),
          eq(contentRelations.sourceType, "skill"),
          eq(contentRelations.targetType, "skill"),
          eq(contentRelations.targetId, skillId),
        ),
      );

    if (relationRows.length === 0) return [];

    const prerequisiteIds = relationRows.map((r) => r.sourceId);

    // Fetch skill name/slug for each prerequisite skill
    const skillRows = await db
      .select({
        id: skills.id,
        name: skills.name,
        slug: skills.slug,
      })
      .from(skills)
      .where(inArray(skills.id, prerequisiteIds));

    if (!userId) {
      return skillRows.map((s) => ({ ...s, isCompleted: false }));
    }

    // Check which prerequisites the user has already completed
    const completedRows = await db
      .select({ skillId: userSkills.skillId })
      .from(userSkills)
      .where(
        and(
          eq(userSkills.userId, userId),
          eq(userSkills.status, "completed"),
          inArray(userSkills.skillId, prerequisiteIds),
        ),
      );

    const completedSet = new Set(completedRows.map((r) => r.skillId));

    return skillRows.map((s) => ({
      ...s,
      isCompleted: completedSet.has(s.id),
    }));
  } catch {
    return [];
  }
}
