"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { caseStudies } from "@/lib/db/schema/case-studies";
import { requireAuth } from "@/lib/auth/require-auth";

// ============================================================
// Types
// ============================================================

export type CaseStudyActionResult = {
  success: boolean;
  error?: string;
  id?: string;
  slug?: string;
};

type CaseStudyStatus = "draft" | "pending_review" | "published" | "archived";

const VALID_STATUSES: CaseStudyStatus[] = [
  "draft",
  "pending_review",
  "published",
  "archived",
];

// ============================================================
// generateSlug — URL-safe slug from title
// ============================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/--+/g, "-")
    .slice(0, 80);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let attempt = 0;

  while (true) {
    const existing = await db
      .select({ id: caseStudies.id })
      .from(caseStudies)
      .where(eq(caseStudies.slug, slug))
      .limit(1);

    if (existing.length === 0) return slug;

    attempt++;
    slug = `${base}-${attempt}`;
  }
}

// ============================================================
// createCaseStudy
// ============================================================

export async function createCaseStudy(data: {
  titleKo: string;
  titleEn?: string;
  titleJa?: string;
  summaryKo?: string;
  summaryEn?: string;
  summaryJa?: string;
  bodyKo?: string;
  bodyEn?: string;
  bodyJa?: string;
  categoryId?: string;
  industry?: string;
  teamSize?: number;
  projectDurationWeeks?: number;
  techStack?: string[];
  featuredImage?: string;
}): Promise<CaseStudyActionResult> {
  const user = await requireAuth();

  if (!data.titleKo || data.titleKo.trim().length < 3) {
    return { success: false, error: "Title must be at least 3 characters" };
  }

  try {
    const baseSlug = generateSlug(data.titleKo);
    const slug = await ensureUniqueSlug(baseSlug);

    const [item] = await db
      .insert(caseStudies)
      .values({
        slug,
        authorId: user.id,
        status: "draft",
        titleKo: data.titleKo.trim(),
        titleEn: data.titleEn?.trim() ?? null,
        titleJa: data.titleJa?.trim() ?? null,
        summaryKo: data.summaryKo?.trim() ?? null,
        summaryEn: data.summaryEn?.trim() ?? null,
        summaryJa: data.summaryJa?.trim() ?? null,
        bodyKo: data.bodyKo?.trim() ?? null,
        bodyEn: data.bodyEn?.trim() ?? null,
        bodyJa: data.bodyJa?.trim() ?? null,
        categoryId: data.categoryId ?? null,
        industry: data.industry?.trim() ?? null,
        teamSize: data.teamSize ?? null,
        projectDurationWeeks: data.projectDurationWeeks ?? null,
        techStack: data.techStack ?? [],
        featuredImage: data.featuredImage?.trim() ?? null,
      })
      .returning({ id: caseStudies.id, slug: caseStudies.slug });

    if (!item) {
      return { success: false, error: "Failed to create case study" };
    }

    revalidatePath("/[locale]/case-studies", "page");
    return { success: true, id: item.id, slug: item.slug };
  } catch (err) {
    console.error("[createCaseStudy]", err);
    return { success: false, error: "Server error" };
  }
}

// ============================================================
// updateCaseStudy
// ============================================================

export async function updateCaseStudy(
  id: string,
  data: {
    titleKo?: string;
    titleEn?: string;
    titleJa?: string;
    summaryKo?: string;
    summaryEn?: string;
    summaryJa?: string;
    bodyKo?: string;
    bodyEn?: string;
    bodyJa?: string;
    categoryId?: string | null;
    industry?: string;
    teamSize?: number | null;
    projectDurationWeeks?: number | null;
    techStack?: string[];
    featuredImage?: string | null;
  },
): Promise<CaseStudyActionResult> {
  const user = await requireAuth();

  const existing = await db
    .select({ authorId: caseStudies.authorId, status: caseStudies.status })
    .from(caseStudies)
    .where(eq(caseStudies.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!existing) {
    return { success: false, error: "Case study not found" };
  }

  const isModerator = user.role === "moderator" || user.role === "admin";
  if (existing.authorId !== user.id && !isModerator) {
    return { success: false, error: "Only the author or a moderator can edit" };
  }

  try {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (data.titleKo !== undefined) updateData.titleKo = data.titleKo.trim();
    if (data.titleEn !== undefined) updateData.titleEn = data.titleEn.trim();
    if (data.titleJa !== undefined) updateData.titleJa = data.titleJa.trim();
    if (data.summaryKo !== undefined) updateData.summaryKo = data.summaryKo.trim();
    if (data.summaryEn !== undefined) updateData.summaryEn = data.summaryEn.trim();
    if (data.summaryJa !== undefined) updateData.summaryJa = data.summaryJa.trim();
    if (data.bodyKo !== undefined) updateData.bodyKo = data.bodyKo.trim();
    if (data.bodyEn !== undefined) updateData.bodyEn = data.bodyEn.trim();
    if (data.bodyJa !== undefined) updateData.bodyJa = data.bodyJa.trim();
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.industry !== undefined) updateData.industry = data.industry.trim();
    if (data.teamSize !== undefined) updateData.teamSize = data.teamSize;
    if (data.projectDurationWeeks !== undefined)
      updateData.projectDurationWeeks = data.projectDurationWeeks;
    if (data.techStack !== undefined) updateData.techStack = data.techStack;
    if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;

    await db.update(caseStudies).set(updateData).where(eq(caseStudies.id, id));

    revalidatePath("/[locale]/case-studies", "page");
    revalidatePath(`/[locale]/case-studies/${existing}`, "page");
    return { success: true, id };
  } catch (err) {
    console.error("[updateCaseStudy]", err);
    return { success: false, error: "Server error" };
  }
}

// ============================================================
// publishCaseStudy
// ============================================================

export async function publishCaseStudy(id: string): Promise<CaseStudyActionResult> {
  const user = await requireAuth();

  const existing = await db
    .select({ authorId: caseStudies.authorId, slug: caseStudies.slug })
    .from(caseStudies)
    .where(eq(caseStudies.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!existing) {
    return { success: false, error: "Case study not found" };
  }

  const isModerator = user.role === "moderator" || user.role === "admin";
  if (existing.authorId !== user.id && !isModerator) {
    return { success: false, error: "Only the author or a moderator can publish" };
  }

  try {
    await db
      .update(caseStudies)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(caseStudies.id, id));

    revalidatePath("/[locale]/case-studies", "page");
    revalidatePath(`/[locale]/case-studies/${existing.slug}`, "page");
    return { success: true, id, slug: existing.slug };
  } catch (err) {
    console.error("[publishCaseStudy]", err);
    return { success: false, error: "Server error" };
  }
}

// ============================================================
// deleteCaseStudy
// ============================================================
// Author only (or admin). Hard delete.

export async function deleteCaseStudy(id: string): Promise<CaseStudyActionResult> {
  const user = await requireAuth();

  const existing = await db
    .select({ authorId: caseStudies.authorId, slug: caseStudies.slug })
    .from(caseStudies)
    .where(eq(caseStudies.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!existing) {
    return { success: false, error: "Case study not found" };
  }

  const isAdmin = user.role === "admin";
  if (existing.authorId !== user.id && !isAdmin) {
    return { success: false, error: "Only the author can delete this case study" };
  }

  try {
    await db.delete(caseStudies).where(eq(caseStudies.id, id));

    revalidatePath("/[locale]/case-studies", "page");
    return { success: true, id };
  } catch (err) {
    console.error("[deleteCaseStudy]", err);
    return { success: false, error: "Server error" };
  }
}

// ============================================================
// submitForReview
// ============================================================

export async function submitForReview(id: string): Promise<CaseStudyActionResult> {
  const user = await requireAuth();

  const existing = await db
    .select({ authorId: caseStudies.authorId })
    .from(caseStudies)
    .where(eq(caseStudies.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!existing) {
    return { success: false, error: "Case study not found" };
  }

  if (existing.authorId !== user.id) {
    return { success: false, error: "Only the author can submit for review" };
  }

  if (!VALID_STATUSES.includes("pending_review")) {
    return { success: false, error: "Invalid status transition" };
  }

  try {
    await db
      .update(caseStudies)
      .set({ status: "pending_review", updatedAt: new Date() })
      .where(eq(caseStudies.id, id));

    revalidatePath("/[locale]/case-studies", "page");
    return { success: true, id };
  } catch (err) {
    console.error("[submitForReview]", err);
    return { success: false, error: "Server error" };
  }
}
