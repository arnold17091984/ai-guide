"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import {
  learningPathSteps,
  userLearningProgress,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// ============================================================
// Types
// ============================================================

export type ActionResult = {
  success: boolean;
  error?: string;
};

// ============================================================
// enrollInPath — create not_started progress rows for all steps
// ============================================================

export async function enrollInPath(pathId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  try {
    const steps = await db
      .select({ id: learningPathSteps.id })
      .from(learningPathSteps)
      .where(eq(learningPathSteps.pathId, pathId));

    if (steps.length === 0) {
      return { success: false, error: "path not found or has no steps" };
    }

    await db.transaction(async (tx) => {
      await tx
        .insert(userLearningProgress)
        .values(
          steps.map((step) => ({
            userId: user.id,
            pathId,
            stepId: step.id,
            status: "not_started",
          })),
        )
        .onConflictDoNothing();
    });

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("[enrollInPath]", err);
    return { success: false, error: "server error" };
  }
}

// ============================================================
// completeStep — mark a step as completed
// ============================================================

export async function completeStep(
  pathId: string,
  stepId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  try {
    await db
      .update(userLearningProgress)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(
        and(
          eq(userLearningProgress.userId, user.id),
          eq(userLearningProgress.pathId, pathId),
          eq(userLearningProgress.stepId, stepId),
        ),
      );

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("[completeStep]", err);
    return { success: false, error: "server error" };
  }
}

// ============================================================
// unenrollFromPath — delete all progress rows for user + path
// ============================================================

export async function unenrollFromPath(pathId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  try {
    await db
      .delete(userLearningProgress)
      .where(
        and(
          eq(userLearningProgress.userId, user.id),
          eq(userLearningProgress.pathId, pathId),
        ),
      );

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("[unenrollFromPath]", err);
    return { success: false, error: "server error" };
  }
}
