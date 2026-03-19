"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { skills, votes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { rateLimit } from "@/lib/rate-limit";

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
    const { starred, newCount } = await db.transaction(async (tx) => {
      // Check for existing star vote
      const existing = await tx
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
        await tx.delete(votes).where(eq(votes.id, existing.id));
        await tx
          .update(skills)
          .set({ stars: sql`GREATEST(${skills.stars} - 1, 0)` })
          .where(eq(skills.id, skillId));
        starred = false;
      } else {
        // Add the star
        await tx.insert(votes).values({
          userId: user.id,
          targetType: "skill",
          targetId: skillId,
          value: 1,
        });
        await tx
          .update(skills)
          .set({ stars: sql`${skills.stars} + 1` })
          .where(eq(skills.id, skillId));
        starred = true;
      }

      // Read back the authoritative count
      const updatedRow = await tx
        .select({ stars: skills.stars })
        .from(skills)
        .where(eq(skills.id, skillId))
        .limit(1)
        .then((r) => r[0]);

      const newCount = updatedRow?.stars ?? 0;

      return { starred, newCount };
    });

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
  // Rate limit by userId+skillId when authenticated (10 req/min).
  // Server actions already require a valid session cookie to invoke,
  // so unauthenticated abuse is limited by default.
  const user = await getCurrentUser();
  if (user) {
    const { allowed } = rateLimit(`download:${user.id}:${skillId}`, 10);
    if (!allowed) {
      return { success: false, newCount: 0, error: "rate limited" };
    }
  }

  try {
    const [updatedRow] = await db
      .update(skills)
      .set({ downloads: sql`${skills.downloads} + 1` })
      .where(eq(skills.id, skillId))
      .returning({ downloads: skills.downloads });

    if (!updatedRow) {
      return { success: false, newCount: 0, error: "skill not found" };
    }

    return { success: true, newCount: updatedRow.downloads };
  } catch {
    return { success: false, newCount: 0, error: "serverError" };
  }
}
