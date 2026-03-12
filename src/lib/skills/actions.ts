"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { skills, votes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// ============================================================
// Skill Server Actions
// ============================================================

// ---------------------------------------------------------------------------
// starSkill — toggle star on a skill
// ---------------------------------------------------------------------------
// Uses the polymorphic votes table (targetType = "skill", value = 1).
// Also keeps the denormalized `stars` count on the skill row in sync.
// ---------------------------------------------------------------------------

export interface StarSkillResult {
  success: boolean;
  starred: boolean;
  newCount: number;
  error?: string;
}

export async function starSkill(skillId: string): Promise<StarSkillResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, starred: false, newCount: 0, error: "unauthenticated" };
  }

  try {
    // Check for existing star vote
    const existing = await db
      .select({ id: votes.id })
      .from(votes)
      .where(
        and(
          eq(votes.userId, user.id),
          eq(votes.targetType, "skill"),
          eq(votes.targetId, skillId),
          eq(votes.value, 1),
        ),
      )
      .limit(1)
      .then((r) => r[0] ?? null);

    let starred: boolean;

    if (existing) {
      // Toggle off — remove the star
      await db.delete(votes).where(eq(votes.id, existing.id));
      await db
        .update(skills)
        .set({ stars: sql`GREATEST(${skills.stars} - 1, 0)` })
        .where(eq(skills.id, skillId));
      starred = false;
    } else {
      // Add the star
      await db.insert(votes).values({
        userId: user.id,
        targetType: "skill",
        targetId: skillId,
        value: 1,
      });
      await db
        .update(skills)
        .set({ stars: sql`${skills.stars} + 1` })
        .where(eq(skills.id, skillId));
      starred = true;
    }

    // Read back the authoritative count
    const updatedRow = await db
      .select({ stars: skills.stars })
      .from(skills)
      .where(eq(skills.id, skillId))
      .limit(1)
      .then((r) => r[0]);

    const newCount = updatedRow?.stars ?? 0;

    revalidatePath("/", "layout");

    return { success: true, starred, newCount };
  } catch {
    return { success: false, starred: false, newCount: 0, error: "serverError" };
  }
}

// ---------------------------------------------------------------------------
// incrementDownload — bump the download counter on a skill
// ---------------------------------------------------------------------------
// Called when the user copies/installs a skill.
// No authentication required — anyone can trigger a download.
// ---------------------------------------------------------------------------

export interface IncrementDownloadResult {
  success: boolean;
  newCount: number;
  error?: string;
}

export async function incrementDownload(
  skillId: string,
): Promise<IncrementDownloadResult> {
  try {
    await db
      .update(skills)
      .set({ downloads: sql`${skills.downloads} + 1` })
      .where(eq(skills.id, skillId));

    const updatedRow = await db
      .select({ downloads: skills.downloads })
      .from(skills)
      .where(eq(skills.id, skillId))
      .limit(1)
      .then((r) => r[0]);

    return { success: true, newCount: updatedRow?.downloads ?? 0 };
  } catch {
    return { success: false, newCount: 0, error: "serverError" };
  }
}
