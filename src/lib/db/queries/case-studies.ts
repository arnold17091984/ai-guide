import { db } from "../client";
import { caseStudies, caseStudyTags } from "../schema/case-studies";
import { users } from "../schema/users";
import { categories, tags } from "../schema/taxonomy";
import { eq, and, sql, desc, or, count, ilike } from "drizzle-orm";

// ============================================================
// Case Study Queries
// ============================================================

export type CaseStudyListItem = Awaited<
  ReturnType<typeof listCaseStudies>
>["items"][number];

export type CaseStudyDetail = Awaited<ReturnType<typeof getCaseStudyBySlug>>;

// ============================================================
// listCaseStudies
// ============================================================
// Paginated, filterable by category/industry, searchable.

export async function listCaseStudies(params: {
  locale?: "ko" | "en" | "ja";
  categorySlug?: string;
  industry?: string;
  query?: string;
  isFeatured?: boolean;
  page?: number;
  pageSize?: number;
} = {}) {
  const {
    locale = "ko",
    categorySlug,
    industry,
    query,
    isFeatured,
    page = 1,
    pageSize = 12,
  } = params;

  const offset = (page - 1) * pageSize;

  const titleCol =
    locale === "ko"
      ? caseStudies.titleKo
      : locale === "en"
        ? caseStudies.titleEn
        : caseStudies.titleJa;

  const summaryCol =
    locale === "ko"
      ? caseStudies.summaryKo
      : locale === "en"
        ? caseStudies.summaryEn
        : caseStudies.summaryJa;

  const conditions = [eq(caseStudies.status, "published")];

  if (industry) {
    conditions.push(eq(caseStudies.industry, industry));
  }
  if (isFeatured !== undefined) {
    conditions.push(eq(caseStudies.isFeatured, isFeatured));
  }
  if (query && query.trim()) {
    conditions.push(
      or(
        ilike(caseStudies.titleKo, `%${query.trim()}%`),
        ilike(caseStudies.titleEn, `%${query.trim()}%`),
        ilike(caseStudies.summaryKo, `%${query.trim()}%`),
        ilike(caseStudies.summaryEn, `%${query.trim()}%`),
      )!,
    );
  }

  const baseQuery = db
    .select({
      id: caseStudies.id,
      slug: caseStudies.slug,
      title: titleCol,
      summary: summaryCol,
      industry: caseStudies.industry,
      teamSize: caseStudies.teamSize,
      projectDurationWeeks: caseStudies.projectDurationWeeks,
      techStack: caseStudies.techStack,
      metrics: caseStudies.metrics,
      featuredImage: caseStudies.featuredImage,
      isFeatured: caseStudies.isFeatured,
      publishedAt: caseStudies.publishedAt,
      authorName: users.displayName,
      authorUsername: users.username,
      authorAvatar: users.avatarUrl,
      categorySlug: categories.slug,
      categoryLabel:
        locale === "ko"
          ? categories.labelKo
          : locale === "en"
            ? categories.labelEn
            : categories.labelJa,
    })
    .from(caseStudies)
    .leftJoin(users, eq(caseStudies.authorId, users.id))
    .leftJoin(categories, eq(caseStudies.categoryId, categories.id))
    .where(
      categorySlug
        ? and(...conditions, eq(categories.slug, categorySlug))
        : and(...conditions),
    )
    .orderBy(desc(caseStudies.publishedAt))
    .limit(pageSize)
    .offset(offset);

  const countQuery = db
    .select({ total: count() })
    .from(caseStudies)
    .leftJoin(categories, eq(caseStudies.categoryId, categories.id))
    .where(
      categorySlug
        ? and(...conditions, eq(categories.slug, categorySlug))
        : and(...conditions),
    );

  const [items, countResult] = await Promise.all([baseQuery, countQuery]);

  return {
    items,
    total: Number(countResult[0]?.total ?? 0),
    page,
    pageSize,
    totalPages: Math.ceil(Number(countResult[0]?.total ?? 0) / pageSize),
  };
}

// ============================================================
// getCaseStudyBySlug
// ============================================================
// Full detail with author join.

export async function getCaseStudyBySlug(
  slug: string,
  locale: "ko" | "en" | "ja" = "ko",
) {
  const row = await db
    .select({
      id: caseStudies.id,
      slug: caseStudies.slug,
      status: caseStudies.status,
      title:
        locale === "ko"
          ? caseStudies.titleKo
          : locale === "en"
            ? caseStudies.titleEn
            : caseStudies.titleJa,
      summary:
        locale === "ko"
          ? caseStudies.summaryKo
          : locale === "en"
            ? caseStudies.summaryEn
            : caseStudies.summaryJa,
      body:
        locale === "ko"
          ? caseStudies.bodyKo
          : locale === "en"
            ? caseStudies.bodyEn
            : caseStudies.bodyJa,
      industry: caseStudies.industry,
      teamSize: caseStudies.teamSize,
      projectDurationWeeks: caseStudies.projectDurationWeeks,
      techStack: caseStudies.techStack,
      metrics: caseStudies.metrics,
      featuredImage: caseStudies.featuredImage,
      isFeatured: caseStudies.isFeatured,
      publishedAt: caseStudies.publishedAt,
      createdAt: caseStudies.createdAt,
      updatedAt: caseStudies.updatedAt,
      authorId: caseStudies.authorId,
      authorName: users.displayName,
      authorUsername: users.username,
      authorAvatar: users.avatarUrl,
      categorySlug: categories.slug,
      categoryLabel:
        locale === "ko"
          ? categories.labelKo
          : locale === "en"
            ? categories.labelEn
            : categories.labelJa,
    })
    .from(caseStudies)
    .leftJoin(users, eq(caseStudies.authorId, users.id))
    .leftJoin(categories, eq(caseStudies.categoryId, categories.id))
    .where(
      and(
        eq(caseStudies.slug, slug),
        eq(caseStudies.status, "published"),
      ),
    )
    .limit(1);

  if (!row[0]) return null;

  // Fetch tags in a second query
  const entryTags = await db
    .select({
      slug: tags.slug,
      label:
        locale === "ko"
          ? tags.labelKo
          : locale === "en"
            ? tags.labelEn
            : tags.labelJa,
      color: tags.color,
    })
    .from(caseStudyTags)
    .innerJoin(tags, eq(caseStudyTags.tagId, tags.id))
    .where(eq(caseStudyTags.caseStudyId, row[0].id));

  return { ...row[0], tags: entryTags };
}

// ============================================================
// getFeaturedCaseStudies
// ============================================================

export async function getFeaturedCaseStudies(
  limit = 3,
  locale: "ko" | "en" | "ja" = "ko",
) {
  const result = await listCaseStudies({
    locale,
    isFeatured: true,
    pageSize: limit,
    page: 1,
  });
  return result.items;
}

// ============================================================
// getCaseStudyCategories
// ============================================================
// Returns distinct categories that have at least one published case study.

export async function getCaseStudyCategories(locale: "ko" | "en" | "ja" = "ko") {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      label:
        locale === "ko"
          ? categories.labelKo
          : locale === "en"
            ? categories.labelEn
            : categories.labelJa,
      icon: categories.icon,
    })
    .from(categories)
    .innerJoin(caseStudies, eq(caseStudies.categoryId, categories.id))
    .where(eq(caseStudies.status, "published"))
    .groupBy(
      categories.id,
      categories.slug,
      categories.labelKo,
      categories.labelEn,
      categories.labelJa,
      categories.icon,
      categories.sortOrder,
    )
    .orderBy(categories.sortOrder);
}

// ============================================================
// getRelatedCaseStudies
// ============================================================
// Returns up to `limit` published studies in the same category,
// excluding the given slug.

export async function getRelatedCaseStudies(params: {
  categoryId: string | null;
  excludeSlug: string;
  locale?: "ko" | "en" | "ja";
  limit?: number;
}) {
  const { categoryId, excludeSlug, locale = "ko", limit = 3 } = params;

  if (!categoryId) return [];

  const rows = await db
    .select({
      id: caseStudies.id,
      slug: caseStudies.slug,
      title:
        locale === "ko"
          ? caseStudies.titleKo
          : locale === "en"
            ? caseStudies.titleEn
            : caseStudies.titleJa,
      summary:
        locale === "ko"
          ? caseStudies.summaryKo
          : locale === "en"
            ? caseStudies.summaryEn
            : caseStudies.summaryJa,
      industry: caseStudies.industry,
      featuredImage: caseStudies.featuredImage,
      publishedAt: caseStudies.publishedAt,
      authorName: users.displayName,
      authorAvatar: users.avatarUrl,
    })
    .from(caseStudies)
    .leftJoin(users, eq(caseStudies.authorId, users.id))
    .where(
      and(
        eq(caseStudies.status, "published"),
        eq(caseStudies.categoryId, categoryId),
        sql`${caseStudies.slug} != ${excludeSlug}`,
      ),
    )
    .orderBy(desc(caseStudies.publishedAt))
    .limit(limit);

  return rows;
}

// ============================================================
// getDistinctIndustries
// ============================================================

export async function getDistinctIndustries(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ industry: caseStudies.industry })
    .from(caseStudies)
    .where(
      and(
        eq(caseStudies.status, "published"),
        sql`${caseStudies.industry} IS NOT NULL`,
      ),
    )
    .orderBy(caseStudies.industry);

  return rows
    .map((r) => r.industry)
    .filter((v): v is string => v !== null);
}
