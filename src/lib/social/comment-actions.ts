"use server";

import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { comments } from "@/lib/db/schema/social";
import { users } from "@/lib/db/schema/users";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canModerate } from "@/lib/auth/rbac";
import type { UserRole } from "@/lib/auth/rbac";

// ============================================================
// Shared types
// ============================================================

export interface CommentActionResult {
  success: boolean;
  error?: string;
}

export interface CommentWithAuthor {
  id: string;
  authorId: string | null;
  parentId: string | null;
  targetType: string;
  targetId: string;
  body: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

const BODY_MIN = 1;
const BODY_MAX = 2000;

function validateBody(body: string): string | null {
  const trimmed = body.trim();
  if (trimmed.length < BODY_MIN) return "bodyTooShort";
  if (trimmed.length > BODY_MAX) return "bodyTooLong";
  return null;
}

// ============================================================
// addComment
// ============================================================
export async function addComment(input: {
  targetType: string;
  targetId: string;
  body: string;
  parentId?: string;
}): Promise<CommentActionResult & { commentId?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "unauthenticated" };
  }

  const bodyError = validateBody(input.body);
  if (bodyError) {
    return { success: false, error: bodyError };
  }

  try {
    const [inserted] = await db
      .insert(comments)
      .values({
        authorId: user.id,
        targetType: input.targetType,
        targetId: input.targetId,
        body: input.body.trim(),
        parentId: input.parentId ?? null,
      })
      .returning({ id: comments.id });

    revalidatePath("/", "layout");

    return { success: true, commentId: inserted.id };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ============================================================
// editComment
// ============================================================
export async function editComment(
  commentId: string,
  body: string,
): Promise<CommentActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "unauthenticated" };
  }

  const bodyError = validateBody(body);
  if (bodyError) {
    return { success: false, error: bodyError };
  }

  // Fetch the comment to verify ownership / moderation right
  const existing = await db
    .select({ authorId: comments.authorId, isDeleted: comments.isDeleted })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return { success: false, error: "notFound" };
  }

  if (existing.isDeleted) {
    return { success: false, error: "commentDeleted" };
  }

  const isAuthor = existing.authorId === user.id;
  const isMod = canModerate(user.role as UserRole);

  if (!isAuthor && !isMod) {
    return { success: false, error: "forbidden" };
  }

  try {
    await db
      .update(comments)
      .set({ body: body.trim(), updatedAt: new Date() })
      .where(eq(comments.id, commentId));

    revalidatePath("/", "layout");

    return { success: true };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ============================================================
// deleteComment  — soft delete
// ============================================================
export async function deleteComment(
  commentId: string,
): Promise<CommentActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "unauthenticated" };
  }

  const existing = await db
    .select({ authorId: comments.authorId, isDeleted: comments.isDeleted })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return { success: false, error: "notFound" };
  }

  if (existing.isDeleted) {
    return { success: false, error: "alreadyDeleted" };
  }

  const isAuthor = existing.authorId === user.id;
  const isMod = canModerate(user.role as UserRole);

  if (!isAuthor && !isMod) {
    return { success: false, error: "forbidden" };
  }

  try {
    // Soft delete: replace body with '[deleted]' and set flag
    await db
      .update(comments)
      .set({
        isDeleted: true,
        body: "[deleted]",
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId));

    revalidatePath("/", "layout");

    return { success: true };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ============================================================
// getComments — fetches comments with author for a target
// ============================================================
export async function getComments(
  targetType: string,
  targetId: string,
): Promise<CommentWithAuthor[]> {
  try {
    const rows = await db
      .select({
        id: comments.id,
        authorId: comments.authorId,
        parentId: comments.parentId,
        targetType: comments.targetType,
        targetId: comments.targetId,
        body: comments.body,
        isDeleted: comments.isDeleted,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorUserId: users.id,
        authorUsername: users.username,
        authorDisplayName: users.displayName,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(
        and(
          eq(comments.targetType, targetType),
          eq(comments.targetId, targetId),
        ),
      )
      .orderBy(desc(comments.createdAt));

    return rows.map((row) => ({
      id: row.id,
      authorId: row.authorId,
      parentId: row.parentId,
      targetType: row.targetType,
      targetId: row.targetId,
      body: row.body,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.authorUserId
        ? {
            id: row.authorUserId,
            username: row.authorUsername ?? row.authorUserId,
            displayName: row.authorDisplayName,
            avatarUrl: row.authorAvatarUrl,
          }
        : null,
    }));
  } catch {
    return [];
  }
}
