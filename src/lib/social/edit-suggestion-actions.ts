"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { editSuggestions } from "@/lib/db/schema/social";
import { contentVersions } from "@/lib/db/schema/versioning";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canEdit, canModerate } from "@/lib/auth/rbac";
import type { UserRole } from "@/lib/auth/rbac";

// ============================================================
// Shared types
// ============================================================

export interface EditSuggestionResult {
  success: boolean;
  error?: string;
  suggestionId?: string;
}

export interface SuggestEditInput {
  targetType: string;
  targetId: string;
  /** Which field is being edited, e.g. 'body_ko', 'title_en' */
  field: string;
  /** Full snapshot of the field as it was when the user opened the editor */
  originalBody: string;
  /** The user's proposed new value for the field */
  suggestedBody: string;
  /** One-line human-readable description of the change */
  summary?: string;
}

// ============================================================
// suggestEdit
// ============================================================
// Creates a pending edit suggestion. Requires contributor+ role.
// ============================================================
export async function suggestEdit(
  input: SuggestEditInput,
): Promise<EditSuggestionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "unauthenticated" };
  }

  if (!canEdit(user.role as UserRole)) {
    return { success: false, error: "forbidden" };
  }

  const { targetType, targetId, field, originalBody, suggestedBody, summary } = input;

  if (!field.trim()) {
    return { success: false, error: "fieldRequired" };
  }

  if (!suggestedBody.trim()) {
    return { success: false, error: "suggestedBodyRequired" };
  }

  if (suggestedBody.trim() === originalBody.trim()) {
    return { success: false, error: "noChanges" };
  }

  if (summary && summary.length > 280) {
    return { success: false, error: "summaryTooLong" };
  }

  try {
    const [inserted] = await db
      .insert(editSuggestions)
      .values({
        authorId: user.id,
        targetType,
        targetId,
        field,
        originalBody,
        suggestedBody: suggestedBody.trim(),
        summary: summary?.trim() ?? null,
        status: "pending",
      })
      .returning({ id: editSuggestions.id });

    revalidatePath("/", "layout");

    return { success: true, suggestionId: inserted.id };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ============================================================
// reviewSuggestion
// ============================================================
// Approves or rejects a pending suggestion. Requires moderator+.
//
// On approval:
//   1. Marks the suggestion as 'accepted'.
//   2. Finds the latest content_versions row for this content to
//      determine the next version number.
//   3. Inserts a new content_versions row with changeType
//      'accept_suggestion' and the approved field snapshot.
//   4. Marks any other pending suggestions for the same target+field
//      as 'superseded'.
// ============================================================
export async function reviewSuggestion(
  suggestionId: string,
  action: "approve" | "reject",
  reviewNote?: string,
): Promise<EditSuggestionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "unauthenticated" };
  }

  if (!canModerate(user.role as UserRole)) {
    return { success: false, error: "forbidden" };
  }

  const suggestion = await db
    .select()
    .from(editSuggestions)
    .where(eq(editSuggestions.id, suggestionId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!suggestion) {
    return { success: false, error: "notFound" };
  }

  if (suggestion.status !== "pending") {
    return { success: false, error: "alreadyReviewed" };
  }

  const now = new Date();

  try {
    if (action === "reject") {
      await db
        .update(editSuggestions)
        .set({
          status: "rejected",
          reviewedBy: user.id,
          reviewedAt: now,
          rejectionReason: reviewNote?.trim() ?? null,
        })
        .where(eq(editSuggestions.id, suggestionId));

      revalidatePath("/", "layout");
      return { success: true };
    }

    // ---- APPROVE ----

    // Find the latest version number for this content
    const latestVersion = await db
      .select({ versionNumber: contentVersions.versionNumber })
      .from(contentVersions)
      .where(
        and(
          eq(contentVersions.contentType, suggestion.targetType),
          eq(contentVersions.contentId, suggestion.targetId),
        ),
      )
      .orderBy(sql`${contentVersions.versionNumber} desc`)
      .limit(1)
      .then((rows) => rows[0] ?? null);

    const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

    // Build a minimal snapshot containing only the edited field
    const snapshot: Record<string, string> = {
      [suggestion.field]: suggestion.suggestedBody,
    };

    // Insert the new version
    await db.insert(contentVersions).values({
      contentType: suggestion.targetType,
      contentId: suggestion.targetId,
      versionNumber: nextVersionNumber,
      authorId: user.id,
      editSuggestionId: suggestionId,
      snapshot,
      changeSummary:
        suggestion.summary ??
        `Accepted suggestion for field '${suggestion.field}'`,
      changeType: "accept_suggestion",
    });

    // Mark the suggestion as accepted
    await db
      .update(editSuggestions)
      .set({
        status: "accepted",
        reviewedBy: user.id,
        reviewedAt: now,
      })
      .where(eq(editSuggestions.id, suggestionId));

    // Supersede other pending suggestions for the same target + field
    await db
      .update(editSuggestions)
      .set({ status: "superseded" })
      .where(
        and(
          eq(editSuggestions.targetType, suggestion.targetType),
          eq(editSuggestions.targetId, suggestion.targetId),
          eq(editSuggestions.field, suggestion.field),
          eq(editSuggestions.status, "pending"),
        ),
      );

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ============================================================
// getPendingSuggestions — fetch suggestions for review UI
// ============================================================
export async function getPendingSuggestionsForTarget(
  targetType: string,
  targetId: string,
) {
  try {
    return db
      .select()
      .from(editSuggestions)
      .where(
        and(
          eq(editSuggestions.targetType, targetType),
          eq(editSuggestions.targetId, targetId),
          eq(editSuggestions.status, "pending"),
        ),
      )
      .orderBy(editSuggestions.createdAt);
  } catch {
    return [];
  }
}
