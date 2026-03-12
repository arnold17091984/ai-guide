import { db } from "../client";
import { knowledgeEntries, knowledgeEntryTags, tags, users, categories } from "../schema";
import { eq, and, sql, desc, inArray, or, count } from "drizzle-orm";

// ============================================================
// Knowledge Entry Queries
// ============================================================

export type KnowledgeEntryWithRelations = Awaited<
  ReturnType<typeof getEntryBySlug>
>;

/**
 * Fetch a single published knowledge entry by slug.
 * Joins author, category, and tags.
 */
export async function getEntryBySlug(slug: string, locale: "ko" | "en" | "ja" = "ko") {
  const row = await db
    .select({
      id: knowledgeEntries.id,
      slug: knowledgeEntries.slug,
      contentType: knowledgeEntries.contentType,
      status: knowledgeEntries.status,
      difficultyLevel: knowledgeEntries.difficultyLevel,
      title: locale === "ko"
        ? knowledgeEntries.titleKo
        : locale === "en"
          ? knowledgeEntries.titleEn
          : knowledgeEntries.titleJa,
      summary: locale === "ko"
        ? knowledgeEntries.summaryKo
        : locale === "en"
          ? knowledgeEntries.summaryEn
          : knowledgeEntries.summaryJa,
      body: locale === "ko"
        ? knowledgeEntries.bodyKo
        : locale === "en"
          ? knowledgeEntries.bodyEn
          : knowledgeEntries.bodyJa,
      readTimeMins: knowledgeEntries.readTimeMins,
      featuredImage: knowledgeEntries.featuredImage,
      isFeatured: knowledgeEntries.isFeatured,
      publishedAt: knowledgeEntries.publishedAt,
      updatedAt: knowledgeEntries.updatedAt,
      authorId: knowledgeEntries.authorId,
      authorName: users.displayName,
      authorUsername: users.username,
      authorAvatar: users.avatarUrl,
      categorySlug: categories.slug,
      categoryLabel: locale === "ko"
        ? categories.labelKo
        : locale === "en"
          ? categories.labelEn
          : categories.labelJa,
    })
    .from(knowledgeEntries)
    .leftJoin(users, eq(knowledgeEntries.authorId, users.id))
    .leftJoin(categories, eq(knowledgeEntries.categoryId, categories.id))
    .where(
      and(
        eq(knowledgeEntries.slug, slug),
        eq(knowledgeEntries.status, "published"),
      ),
    )
    .limit(1);

  if (!row[0]) return null;

  // Fetch tags in a second query (simpler than a GROUP BY aggregate)
  const entryTags = await db
    .select({
      slug: tags.slug,
      label: locale === "ko" ? tags.labelKo : locale === "en" ? tags.labelEn : tags.labelJa,
      color: tags.color,
    })
    .from(knowledgeEntryTags)
    .innerJoin(tags, eq(knowledgeEntryTags.tagId, tags.id))
    .where(eq(knowledgeEntryTags.entryId, row[0].id));

  return { ...row[0], tags: entryTags };
}

/**
 * List all categories that have at least one published knowledge entry.
 * Used to populate the category filter pills on the browse page.
 */
export async function listKnowledgeCategories(locale: "ko" | "en" | "ja" = "ko") {
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
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .innerJoin(knowledgeEntries, eq(knowledgeEntries.categoryId, categories.id))
    .where(eq(knowledgeEntries.status, "published"))
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

/**
 * Count total published entries matching the given filters.
 * Used for pagination on the browse/search pages.
 */
export async function countEntries(params: {
  locale?: "ko" | "en" | "ja";
  categorySlug?: string;
  difficulty?: string;
  contentType?: string;
  query?: string;
}): Promise<number> {
  const { locale = "ko", categorySlug, difficulty, contentType, query } = params;

  if (query && query.trim()) {
    // Full-text count
    const dict = locale === "en" ? "english" : "simple";
    const searchCol =
      locale === "ko" ? "search_ko" : locale === "en" ? "search_en" : "search_ja";

    const result = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM knowledge_entries ke
      LEFT JOIN categories c ON c.id = ke.category_id
      WHERE ke.${sql.identifier(searchCol)} @@ plainto_tsquery(${dict}, ${query})
        AND ke.status = 'published'
        ${categorySlug ? sql`AND c.slug = ${categorySlug}` : sql``}
        ${difficulty ? sql`AND ke.difficulty_level = ${difficulty}` : sql``}
        ${contentType ? sql`AND ke.content_type = ${contentType}` : sql``}
    `);
    return Number((result[0] as { total: number }).total ?? 0);
  }

  // Browse count
  const conditions = [eq(knowledgeEntries.status, "published")];
  if (difficulty) conditions.push(eq(knowledgeEntries.difficultyLevel, difficulty));
  if (contentType) conditions.push(eq(knowledgeEntries.contentType, contentType));

  const baseQuery = db
    .select({ total: count() })
    .from(knowledgeEntries)
    .leftJoin(categories, eq(knowledgeEntries.categoryId, categories.id))
    .where(and(...conditions));

  if (categorySlug) {
    const result = await db
      .select({ total: count() })
      .from(knowledgeEntries)
      .leftJoin(categories, eq(knowledgeEntries.categoryId, categories.id))
      .where(
        and(
          ...conditions,
          eq(categories.slug, categorySlug),
        ),
      );
    return Number(result[0]?.total ?? 0);
  }

  const result = await baseQuery;
  return Number(result[0]?.total ?? 0);
}

/**
 * Full-text search across knowledge entries.
 * Returns lightweight list items (no body).
 */
export async function searchEntries(params: {
  query: string;
  locale?: "ko" | "en" | "ja";
  categorySlug?: string;
  difficulty?: string;
  contentType?: string;
  tagSlugs?: string[];
  page?: number;
  pageSize?: number;
}) {
  const {
    query,
    locale = "ko",
    categorySlug,
    difficulty,
    contentType,
    tagSlugs,
    page = 1,
    pageSize = 20,
  } = params;

  const offset = (page - 1) * pageSize;
  const dict = locale === "en" ? "english" : "simple";
  const searchCol = locale === "ko"
    ? "search_ko"
    : locale === "en"
      ? "search_en"
      : "search_ja";

  // Build raw query (tsvector full-text search with optional filters)
  // Uses raw SQL for the generated tsvector column and ts_rank
  const results = await db.execute(sql`
    SELECT
      ke.id,
      ke.slug,
      ke.content_type,
      ke.difficulty_level,
      ${locale === "ko" ? sql`ke.title_ko` : locale === "en" ? sql`ke.title_en` : sql`ke.title_ja`} AS title,
      ${locale === "ko" ? sql`ke.summary_ko` : locale === "en" ? sql`ke.summary_en` : sql`ke.summary_ja`} AS summary,
      ke.read_time_mins,
      ke.published_at,
      ke.updated_at,
      ts_rank(ke.${sql.identifier(searchCol)}, plainto_tsquery(${dict}, ${query})) AS rank,
      ts_headline(
        ${dict},
        COALESCE(${locale === "ko" ? sql`ke.body_ko` : locale === "en" ? sql`ke.body_en` : sql`ke.body_ja`}, ''),
        plainto_tsquery(${dict}, ${query}),
        'MaxWords=25, MinWords=10, ShortWord=3'
      ) AS excerpt
    FROM knowledge_entries ke
    LEFT JOIN categories c ON c.id = ke.category_id
    WHERE ke.${sql.identifier(searchCol)} @@ plainto_tsquery(${dict}, ${query})
      AND ke.status = 'published'
      ${categorySlug ? sql`AND c.slug = ${categorySlug}` : sql``}
      ${difficulty ? sql`AND ke.difficulty_level = ${difficulty}` : sql``}
      ${contentType ? sql`AND ke.content_type = ${contentType}` : sql``}
    ORDER BY rank DESC
    LIMIT ${pageSize}
    OFFSET ${offset}
  `);

  return results;
}

/**
 * List published entries with pagination (no search).
 * Used for browse pages.
 */
export async function listEntries(params: {
  locale?: "ko" | "en" | "ja";
  categorySlug?: string;
  difficulty?: string;
  contentType?: string;
  isFeatured?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const {
    locale = "ko",
    categorySlug,
    difficulty,
    contentType,
    isFeatured,
    page = 1,
    pageSize = 20,
  } = params;

  const offset = (page - 1) * pageSize;

  const conditions = [eq(knowledgeEntries.status, "published")];
  if (difficulty) conditions.push(eq(knowledgeEntries.difficultyLevel, difficulty));
  if (contentType) conditions.push(eq(knowledgeEntries.contentType, contentType));
  if (isFeatured !== undefined) conditions.push(eq(knowledgeEntries.isFeatured, isFeatured));

  return db
    .select({
      id: knowledgeEntries.id,
      slug: knowledgeEntries.slug,
      contentType: knowledgeEntries.contentType,
      difficultyLevel: knowledgeEntries.difficultyLevel,
      title: locale === "ko"
        ? knowledgeEntries.titleKo
        : locale === "en"
          ? knowledgeEntries.titleEn
          : knowledgeEntries.titleJa,
      summary: locale === "ko"
        ? knowledgeEntries.summaryKo
        : locale === "en"
          ? knowledgeEntries.summaryEn
          : knowledgeEntries.summaryJa,
      readTimeMins: knowledgeEntries.readTimeMins,
      featuredImage: knowledgeEntries.featuredImage,
      publishedAt: knowledgeEntries.publishedAt,
      authorName: users.displayName,
      authorUsername: users.username,
    })
    .from(knowledgeEntries)
    .leftJoin(users, eq(knowledgeEntries.authorId, users.id))
    .leftJoin(categories, eq(knowledgeEntries.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(knowledgeEntries.publishedAt))
    .limit(pageSize)
    .offset(offset);
}
