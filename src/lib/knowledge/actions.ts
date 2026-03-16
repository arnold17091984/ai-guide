"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { knowledgeEntries, knowledgeEntryTags } from "@/lib/db/schema/knowledge";
import { tags } from "@/lib/db/schema/taxonomy";
import { requireAuth } from "@/lib/auth/require-auth";
import { hasRole } from "@/lib/auth/rbac";
import {
  saveVersion,
  getCurrentVersionNumber,
} from "@/lib/db/queries/versioning";
import type { KnowledgeEntrySnapshot } from "@/lib/db/schema/versioning";
import { toSlug } from "./utils";

// ============================================================
// Types
// ============================================================

export type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
  slug?: string;
};

type DifficultyLevel = "beginner" | "intermediate" | "advanced";
type ContentType = "article" | "tip" | "workflow" | "tutorial";

// ============================================================
// Helpers
// ============================================================

/** Generate a unique slug by appending a random suffix if needed. */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  let attempt = 0;

  while (attempt < 10) {
    const rows = await db
      .select({ id: knowledgeEntries.id })
      .from(knowledgeEntries)
      .where(eq(knowledgeEntries.slug, candidate))
      .limit(1);

    const conflict = rows[0];
    if (!conflict || conflict.id === excludeId) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }

  return `${base}-${Date.now()}`;
}

/** Validate common fields shared by create and update. */
function validateFields(data: {
  titleKo: string;
  bodyKo: string;
  categoryId: string;
}): string | null {
  if (data.titleKo.length < 3 || data.titleKo.length > 200) {
    return "title must be between 3 and 200 characters";
  }
  if (data.bodyKo.length < 50) {
    return "body must be at least 50 characters";
  }
  if (!data.categoryId) {
    return "category is required";
  }
  return null;
}

/**
 * Resolve or create tags from a comma-separated string.
 * Only resolves existing tags by slug — does not create new ones.
 */
async function resolveTagIds(tagSlugs: string[]): Promise<string[]> {
  if (tagSlugs.length === 0) return [];

  const slugList = tagSlugs
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (slugList.length === 0) return [];

  const rows = await db
    .select({ id: tags.id, slug: tags.slug })
    .from(tags)
    .then((all) => all.filter((r) => slugList.includes(r.slug)));

  return rows.map((r) => r.id);
}

function estimateReadTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// ============================================================
// createEntry
// ============================================================

export async function createEntry(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();

  if (!hasRole(user.role, "contributor")) {
    return { success: false, error: "insufficient permissions" };
  }

  const titleKo = (formData.get("titleKo") as string | null)?.trim() ?? "";
  const titleEn = (formData.get("titleEn") as string | null)?.trim() ?? undefined;
  const titleJa = (formData.get("titleJa") as string | null)?.trim() ?? undefined;

  const bodyKo = (formData.get("bodyKo") as string | null)?.trim() ?? "";
  const bodyEn = (formData.get("bodyEn") as string | null)?.trim() ?? undefined;
  const bodyJa = (formData.get("bodyJa") as string | null)?.trim() ?? undefined;

  const categoryId = (formData.get("categoryId") as string | null)?.trim() ?? "";
  const difficulty = (formData.get("difficulty") as string | null)?.trim() as DifficultyLevel | undefined;
  const contentType = ((formData.get("contentType") as string | null)?.trim() ?? "article") as ContentType;
  const tagsRaw = (formData.get("tags") as string | null) ?? "";

  const VALID_DIFFICULTIES: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];
  const VALID_CONTENT_TYPES: ContentType[] = ["article", "tip", "workflow", "tutorial"];

  if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
    return { success: false, error: "invalid difficulty level" };
  }
  if (!VALID_CONTENT_TYPES.includes(contentType)) {
    return { success: false, error: "invalid content type" };
  }

  const validationError = validateFields({ titleKo, bodyKo, categoryId });
  if (validationError) {
    return { success: false, error: validationError };
  }

  const slugBase = toSlug(titleKo);
  const slug = await uniqueSlug(slugBase);

  const tagIds = await resolveTagIds(
    tagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
  );

  try {
    const [entry] = await db
      .insert(knowledgeEntries)
      .values({
        slug,
        contentType,
        status: "draft",
        difficultyLevel: difficulty ?? null,
        authorId: user.id,
        categoryId: categoryId || null,
        titleKo,
        titleEn: titleEn || null,
        titleJa: titleJa || null,
        bodyKo: bodyKo || null,
        bodyEn: bodyEn || null,
        bodyJa: bodyJa || null,
        readTimeMins: estimateReadTime(bodyKo),
      })
      .returning({ id: knowledgeEntries.id, slug: knowledgeEntries.slug });

    if (!entry) {
      return { success: false, error: "failed to create entry" };
    }

    // Insert tag associations
    if (tagIds.length > 0) {
      await db.insert(knowledgeEntryTags).values(
        tagIds.map((tagId) => ({ entryId: entry.id, tagId })),
      );
    }

    // Save initial version snapshot
    const snapshot: KnowledgeEntrySnapshot = {
      titleKo,
      titleEn,
      titleJa,
      bodyKo,
      bodyEn,
      bodyJa,
      categoryId: categoryId || undefined,
      difficultyLevel: difficulty,
    };

    await saveVersion({
      contentType: "knowledge_entry",
      contentId: entry.id,
      authorId: user.id,
      snapshot,
      baseVersion: 0,
      changeType: "create",
      changeSummary: `Created: ${titleKo}`,
    });

    revalidatePath("/[locale]/knowledge", "page");

    return { success: true, id: entry.id, slug: entry.slug };
  } catch (err) {
    console.error("[createEntry]", err);
    return { success: false, error: "server error" };
  }
}

// ============================================================
// updateEntry
// ============================================================

export async function updateEntry(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth();

  const existing = await db
    .select({
      id: knowledgeEntries.id,
      slug: knowledgeEntries.slug,
      authorId: knowledgeEntries.authorId,
      status: knowledgeEntries.status,
    })
    .from(knowledgeEntries)
    .where(eq(knowledgeEntries.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!existing) {
    return { success: false, error: "entry not found" };
  }

  const isAuthor = existing.authorId === user.id;
  const isModerator = hasRole(user.role, "moderator");

  if (!isAuthor && !isModerator) {
    return { success: false, error: "insufficient permissions" };
  }

  const titleKo = (formData.get("titleKo") as string | null)?.trim() ?? "";
  const titleEn = (formData.get("titleEn") as string | null)?.trim() ?? undefined;
  const titleJa = (formData.get("titleJa") as string | null)?.trim() ?? undefined;

  const bodyKo = (formData.get("bodyKo") as string | null)?.trim() ?? "";
  const bodyEn = (formData.get("bodyEn") as string | null)?.trim() ?? undefined;
  const bodyJa = (formData.get("bodyJa") as string | null)?.trim() ?? undefined;

  const categoryId = (formData.get("categoryId") as string | null)?.trim() ?? "";
  const difficulty = (formData.get("difficulty") as string | null)?.trim() as DifficultyLevel | undefined;
  const tagsRaw = (formData.get("tags") as string | null) ?? "";

  const validationError = validateFields({ titleKo, bodyKo, categoryId });
  if (validationError) {
    return { success: false, error: validationError };
  }

  const tagIds = await resolveTagIds(
    tagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
  );

  try {
    const baseVersion = await getCurrentVersionNumber("knowledge_entry", id);

    await db
      .update(knowledgeEntries)
      .set({
        titleKo,
        titleEn: titleEn || null,
        titleJa: titleJa || null,
        bodyKo: bodyKo || null,
        bodyEn: bodyEn || null,
        bodyJa: bodyJa || null,
        categoryId: categoryId || null,
        difficultyLevel: difficulty ?? null,
        readTimeMins: estimateReadTime(bodyKo),
        updatedAt: new Date(),
      })
      .where(eq(knowledgeEntries.id, id));

    // Replace tag associations
    await db
      .delete(knowledgeEntryTags)
      .where(eq(knowledgeEntryTags.entryId, id));

    if (tagIds.length > 0) {
      await db.insert(knowledgeEntryTags).values(
        tagIds.map((tagId) => ({ entryId: id, tagId })),
      );
    }

    // Save version snapshot
    const snapshot: KnowledgeEntrySnapshot = {
      titleKo,
      titleEn,
      titleJa,
      bodyKo,
      bodyEn,
      bodyJa,
      categoryId: categoryId || undefined,
      difficultyLevel: difficulty,
    };

    await saveVersion({
      contentType: "knowledge_entry",
      contentId: id,
      authorId: user.id,
      snapshot,
      baseVersion,
      changeType: "edit",
    });

    revalidatePath("/[locale]/knowledge", "page");
    revalidatePath(`/[locale]/knowledge/${existing.slug}`, "page");

    return { success: true, id, slug: existing.slug };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith("CONFLICT:")) {
      return { success: false, error: "conflict: entry was modified by someone else, please reload" };
    }
    console.error("[updateEntry]", err);
    return { success: false, error: "server error" };
  }
}

// ============================================================
// deleteEntry (soft delete)
// ============================================================

export async function deleteEntry(id: string): Promise<ActionResult> {
  const user = await requireAuth();

  const existing = await db
    .select({ authorId: knowledgeEntries.authorId, slug: knowledgeEntries.slug })
    .from(knowledgeEntries)
    .where(eq(knowledgeEntries.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!existing) {
    return { success: false, error: "entry not found" };
  }

  const isAuthor = existing.authorId === user.id;
  const isAdmin = hasRole(user.role, "admin");

  if (!isAuthor && !isAdmin) {
    return { success: false, error: "insufficient permissions" };
  }

  try {
    await db
      .update(knowledgeEntries)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(knowledgeEntries.id, id));

    revalidatePath("/[locale]/knowledge", "page");
    revalidatePath(`/[locale]/knowledge/${existing.slug}`, "page");

    return { success: true, id };
  } catch (err) {
    console.error("[deleteEntry]", err);
    return { success: false, error: "server error" };
  }
}

// ============================================================
// publishEntry
// ============================================================

export async function publishEntry(id: string): Promise<ActionResult> {
  const user = await requireAuth();

  const existing = await db
    .select({
      authorId: knowledgeEntries.authorId,
      status: knowledgeEntries.status,
      slug: knowledgeEntries.slug,
    })
    .from(knowledgeEntries)
    .where(eq(knowledgeEntries.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!existing) {
    return { success: false, error: "entry not found" };
  }

  if (existing.status !== "draft" && existing.status !== "pending") {
    return { success: false, error: "entry is not in a publishable state" };
  }

  const isAuthor = existing.authorId === user.id;
  const isModerator = hasRole(user.role, "moderator");

  if (!isAuthor && !isModerator) {
    return { success: false, error: "insufficient permissions" };
  }

  try {
    await db
      .update(knowledgeEntries)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(knowledgeEntries.id, id));

    revalidatePath("/[locale]/knowledge", "page");
    revalidatePath(`/[locale]/knowledge/${existing.slug}`, "page");

    return { success: true, id };
  } catch (err) {
    console.error("[publishEntry]", err);
    return { success: false, error: "server error" };
  }
}
