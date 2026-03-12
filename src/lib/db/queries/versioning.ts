import { db } from "../client";
import { contentVersions, users } from "../schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { ContentSnapshot } from "../schema/versioning";

// ============================================================
// Versioning Queries & Mutations
// ============================================================

export type ContentType =
  | "knowledge_entry"
  | "skill"
  | "case_study"
  | "claude_config";

/**
 * Get the latest version number for a piece of content.
 */
export async function getCurrentVersionNumber(
  contentType: ContentType,
  contentId: string,
): Promise<number> {
  const result = await db.execute(sql`
    SELECT COALESCE(MAX(version_number), 0) AS current_version
    FROM content_versions
    WHERE content_type = ${contentType}
      AND content_id = ${contentId}::uuid
  `);

  return Number((result[0] as { current_version: string }).current_version);
}

/**
 * Save a new version snapshot.
 * Returns the new version number, or throws on optimistic lock conflict.
 */
export async function saveVersion(params: {
  contentType: ContentType;
  contentId: string;
  authorId: string;
  snapshot: ContentSnapshot;
  baseVersion: number;
  changeSummary?: string;
  changeType?: string;
  editSuggestionId?: string;
}): Promise<{ versionNumber: number }> {
  const {
    contentType,
    contentId,
    authorId,
    snapshot,
    baseVersion,
    changeSummary,
    changeType = "edit",
    editSuggestionId,
  } = params;

  // Optimistic concurrency check + insert in a single transaction
  return await db.transaction(async (tx) => {
    const currentResult = await tx.execute(sql`
      SELECT COALESCE(MAX(version_number), 0) AS current_version
      FROM content_versions
      WHERE content_type = ${contentType}
        AND content_id = ${contentId}::uuid
      FOR UPDATE
    `);

    const current = Number(
      (currentResult[0] as { current_version: string }).current_version,
    );

    if (current > baseVersion) {
      // Conflict: another writer saved between client fetch and this save
      throw new Error(
        `CONFLICT:${current}:${baseVersion}`,
      );
    }

    const nextVersion = current + 1;

    await tx.insert(contentVersions).values({
      contentType,
      contentId,
      versionNumber: nextVersion,
      authorId,
      snapshot,
      changeType,
      changeSummary,
      baseVersion,
      editSuggestionId,
    });

    return { versionNumber: nextVersion };
  });
}

/**
 * Fetch version history for a content item (most recent first).
 * Returns lightweight list — no snapshot body.
 */
export async function getVersionHistory(
  contentType: ContentType,
  contentId: string,
  limit = 25,
) {
  return db
    .select({
      id: contentVersions.id,
      versionNumber: contentVersions.versionNumber,
      changeType: contentVersions.changeType,
      changeSummary: contentVersions.changeSummary,
      authorId: contentVersions.authorId,
      authorName: users.displayName,
      authorUsername: users.username,
      createdAt: contentVersions.createdAt,
    })
    .from(contentVersions)
    .leftJoin(users, eq(contentVersions.authorId, users.id))
    .where(
      and(
        eq(contentVersions.contentType, contentType),
        eq(contentVersions.contentId, contentId),
      ),
    )
    .orderBy(desc(contentVersions.versionNumber))
    .limit(limit);
}

/**
 * Fetch a specific version's snapshot (for rollback or diff display).
 */
export async function getVersionSnapshot(
  contentType: ContentType,
  contentId: string,
  versionNumber: number,
): Promise<ContentSnapshot | null> {
  const result = await db
    .select({ snapshot: contentVersions.snapshot })
    .from(contentVersions)
    .where(
      and(
        eq(contentVersions.contentType, contentType),
        eq(contentVersions.contentId, contentId),
        eq(contentVersions.versionNumber, versionNumber),
      ),
    )
    .limit(1);

  return (result[0]?.snapshot as ContentSnapshot) ?? null;
}
