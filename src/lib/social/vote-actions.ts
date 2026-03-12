"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { votes } from "@/lib/db/schema/social";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// ============================================================
// Permitted target types
// ============================================================
const VALID_TARGET_TYPES = [
  "knowledge_entry",
  "skill",
  "case_study",
  "claude_config",
  "comment",
] as const;

export type VoteTargetType = (typeof VALID_TARGET_TYPES)[number];

export interface CastVoteInput {
  targetType: VoteTargetType;
  targetId: string;
  value: 1 | -1;
}

export interface CastVoteResult {
  success: boolean;
  newScore: number;
  userVote: 1 | -1 | 0;
  error?: string;
}

// ============================================================
// Helper — sum all votes for a target
// ============================================================
async function getTargetScore(
  targetType: string,
  targetId: string,
): Promise<number> {
  const result = await db
    .select({ total: sql<number>`coalesce(sum(${votes.value}), 0)` })
    .from(votes)
    .where(
      and(
        eq(votes.targetType, targetType),
        eq(votes.targetId, targetId),
      ),
    )
    .then((rows) => rows[0]);

  return Number(result?.total ?? 0);
}

// ============================================================
// castVote
// ============================================================
// Upserts a vote for the authenticated user.
// If the user submits the same value they already have, the
// vote is removed (toggle-off). If they submit a different
// value the existing vote is updated.
//
// Returns the recalculated score and the user's resulting vote
// state (0 = no vote).
// ============================================================
export async function castVote(
  input: CastVoteInput,
): Promise<CastVoteResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, newScore: 0, userVote: 0, error: "unauthenticated" };
  }

  const { targetType, targetId, value } = input;

  if (!VALID_TARGET_TYPES.includes(targetType)) {
    return { success: false, newScore: 0, userVote: 0, error: "invalidTargetType" };
  }

  if (value !== 1 && value !== -1) {
    return { success: false, newScore: 0, userVote: 0, error: "invalidVoteValue" };
  }

  try {
    // Check if a vote from this user already exists
    const existing = await db
      .select({ id: votes.id, value: votes.value })
      .from(votes)
      .where(
        and(
          eq(votes.userId, user.id),
          eq(votes.targetType, targetType),
          eq(votes.targetId, targetId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    let userVote: 1 | -1 | 0;

    if (existing) {
      if (existing.value === value) {
        // Same value — toggle off (delete the vote)
        await db.delete(votes).where(eq(votes.id, existing.id));
        userVote = 0;
      } else {
        // Different value — update
        await db
          .update(votes)
          .set({ value })
          .where(eq(votes.id, existing.id));
        userVote = value;
      }
    } else {
      // No existing vote — insert
      await db.insert(votes).values({
        userId: user.id,
        targetType,
        targetId,
        value,
      });
      userVote = value;
    }

    const newScore = await getTargetScore(targetType, targetId);

    // Revalidate the most common paths that show vote scores.
    // Callers can also pass a specific path if needed.
    revalidatePath("/", "layout");

    return { success: true, newScore, userVote };
  } catch {
    return { success: false, newScore: 0, userVote: 0, error: "serverError" };
  }
}

// ============================================================
// getUserVote — convenience query for server components
// ============================================================
export async function getUserVoteForTarget(
  targetType: string,
  targetId: string,
): Promise<1 | -1 | 0> {
  const user = await getCurrentUser();
  if (!user) return 0;

  const existing = await db
    .select({ value: votes.value })
    .from(votes)
    .where(
      and(
        eq(votes.userId, user.id),
        eq(votes.targetType, targetType),
        eq(votes.targetId, targetId),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!existing) return 0;
  return existing.value as 1 | -1;
}

// ============================================================
// getTargetVoteScore — convenience query for server components
// ============================================================
export async function getTargetVoteScore(
  targetType: string,
  targetId: string,
): Promise<number> {
  return getTargetScore(targetType, targetId);
}
