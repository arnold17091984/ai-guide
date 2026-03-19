import type { MetadataRoute } from "next";
import { db } from "@/lib/db/client";
import { knowledgeEntries, skills, caseStudies, learningPaths } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-guide.vercel.app";

const LOCALES = ["en", "ko", "ja"] as const;

/** Static pages that exist under every locale */
const STATIC_PATHS = [
  "",
  "/knowledge",
  "/skills",
  "/skills/packages",
  "/community",
  "/trending",
  "/digest",
  "/claude-md",
  "/case-studies",
  "/teams",
  "/knowledge/debt",
  "/learning-paths",
  "/profile",
] as const;

function makeUrl(
  locale: string,
  path: string,
  lastModified?: Date,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}/${locale}${path}`,
    lastModified: lastModified ?? new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.8,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch slugs + updatedAt in parallel — gracefully degrade to [] on error.
  // The outer try/catch is required because the db proxy throws synchronously
  // when DATABASE_URL is missing, before any Promise is created.
  let knowledgeSlugs: { slug: string; updatedAt: Date | null }[] = [];
  let skillSlugs: { slug: string; updatedAt: Date | null }[] = [];
  let caseSlugs: { slug: string; updatedAt: Date | null }[] = [];
  let learningPathIds: { id: string; updatedAt: Date }[] = [];

  try {
    [knowledgeSlugs, skillSlugs, caseSlugs, learningPathIds] = await Promise.all([
      db
        .select({
          slug: knowledgeEntries.slug,
          updatedAt: knowledgeEntries.updatedAt,
        })
        .from(knowledgeEntries)
        .where(eq(knowledgeEntries.status, "published"))
        .catch(() => [] as { slug: string; updatedAt: Date | null }[]),

      db
        .select({ slug: skills.slug, updatedAt: skills.updatedAt })
        .from(skills)
        .where(eq(skills.status, "published"))
        .catch(() => [] as { slug: string; updatedAt: Date | null }[]),

      db
        .select({ slug: caseStudies.slug, updatedAt: caseStudies.updatedAt })
        .from(caseStudies)
        .where(eq(caseStudies.status, "published"))
        .catch(() => [] as { slug: string; updatedAt: Date | null }[]),

      db
        .select({ id: learningPaths.id, updatedAt: learningPaths.updatedAt })
        .from(learningPaths)
        .where(eq(learningPaths.status, "published"))
        .catch(() => [] as { id: string; updatedAt: Date }[]),
    ]);
  } catch {
    // DATABASE_URL missing or connection failed — return only static routes
  }

  const entries: MetadataRoute.Sitemap = [];

  // Static pages for each locale
  for (const locale of LOCALES) {
    for (const path of STATIC_PATHS) {
      entries.push(makeUrl(locale, path));
    }
  }

  // Dynamic knowledge entries
  for (const locale of LOCALES) {
    for (const { slug, updatedAt } of knowledgeSlugs) {
      entries.push({
        url: `${SITE_URL}/${locale}/knowledge/${slug}`,
        lastModified: updatedAt ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // Dynamic skills
  for (const locale of LOCALES) {
    for (const { slug, updatedAt } of skillSlugs) {
      entries.push({
        url: `${SITE_URL}/${locale}/skills/${slug}`,
        lastModified: updatedAt ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // Dynamic case studies
  for (const locale of LOCALES) {
    for (const { slug, updatedAt } of caseSlugs) {
      entries.push({
        url: `${SITE_URL}/${locale}/case-studies/${slug}`,
        lastModified: updatedAt ?? new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  // Dynamic learning paths
  for (const locale of LOCALES) {
    for (const { id, updatedAt } of learningPathIds) {
      entries.push({
        url: `${SITE_URL}/${locale}/learning-paths/${id}`,
        lastModified: updatedAt ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
