import { db } from "../client";
import {
  skills,
  skillVersions,
  skillDependencies,
  skillSecurityFindings,
  users,
} from "../schema";
import { eq, and, sql, desc, ilike, or, count } from "drizzle-orm";
import type { SkillCategory } from "@/lib/skill-registry/types";

// ============================================================
// Skill DB Queries
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkillListItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  currentVersion: string;
  status: string;
  stars: number;
  downloads: number;
  forks: number;
  tags: string[];
  triggers: string[];
  license: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  authorId: string;
  authorName: string | null;
  authorUsername: string;
  categoryId: string | null;
}

export interface SkillDetail extends SkillListItem {
  body: string;
  contentHash: string;
  compatibleMin: string | null;
  compatibleMax: string | null;
  homepageUrl: string | null;
  securityScannedAt: Date | null;
  securityPassed: boolean | null;
  securityRiskScore: number | null;
  weeklyDownloads: number[];
  updatedAt: Date;
  versions: Array<{
    id: string;
    version: string;
    changelog: string | null;
    yanked: boolean;
    yankedReason: string | null;
    publishedAt: Date;
  }>;
  dependencies: Array<{
    id: string;
    slug: string;
    name: string;
    currentVersion: string;
    versionRange: string | null;
    required: boolean;
  }>;
  securityFindings: Array<{
    id: string;
    level: string;
    rule: string;
    message: string;
    lines: number[] | null;
    suggestion: string | null;
    scannedAt: Date;
  }>;
}

export interface ListSkillsParams {
  search?: string;
  category?: SkillCategory | string;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// listSkills
// ---------------------------------------------------------------------------

export async function listSkills(
  params: ListSkillsParams = {},
): Promise<{ items: SkillListItem[]; total: number }> {
  const { search, category, page = 1, pageSize = 12 } = params;
  const offset = (page - 1) * pageSize;

  // Build WHERE conditions
  const conditions = [eq(skills.status, "published")];

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(skills.name, term),
        ilike(skills.description, term),
      )!,
    );
  }

  // Category filtering: we store category as a string slug on the skill,
  // matching against the SkillCategory enum values via a tag/name match.
  // Since `skills` doesn't have a category slug column directly,
  // we filter by checking `tags` contains the category value OR by
  // using a denormalized approach: treat category param as matching
  // against the tags array.
  // The schema has `categoryId` FK to `categories` but also free-form `tags`.
  // The SkillCategory type maps to tags values in practice.
  // We filter via SQL array contains for category in tags.
  if (category) {
    conditions.push(
      sql`${skills.tags} @> ARRAY[${category}]::text[]`,
    );
  }

  const whereClause = and(...conditions);

  // Run count + list in parallel
  const [countResult, rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(skills)
      .leftJoin(users, eq(skills.authorId, users.id))
      .where(whereClause)
      .then((r) => Number(r[0]?.total ?? 0)),

    db
      .select({
        id: skills.id,
        slug: skills.slug,
        name: skills.name,
        description: skills.description,
        currentVersion: skills.currentVersion,
        status: skills.status,
        stars: skills.stars,
        downloads: skills.downloads,
        forks: skills.forks,
        tags: skills.tags,
        triggers: skills.triggers,
        license: skills.license,
        publishedAt: skills.publishedAt,
        createdAt: skills.createdAt,
        authorId: skills.authorId,
        authorName: users.displayName,
        authorUsername: users.username,
        categoryId: skills.categoryId,
      })
      .from(skills)
      .leftJoin(users, eq(skills.authorId, users.id))
      .where(whereClause)
      .orderBy(desc(skills.stars), desc(skills.downloads))
      .limit(pageSize)
      .offset(offset),
  ]);

  return { items: rows as SkillListItem[], total: countResult };
}

// ---------------------------------------------------------------------------
// getSkillBySlug
// ---------------------------------------------------------------------------

export async function getSkillBySlug(
  slug: string,
): Promise<SkillDetail | null> {
  const row = await db
    .select({
      id: skills.id,
      slug: skills.slug,
      name: skills.name,
      description: skills.description,
      currentVersion: skills.currentVersion,
      status: skills.status,
      stars: skills.stars,
      downloads: skills.downloads,
      forks: skills.forks,
      tags: skills.tags,
      triggers: skills.triggers,
      license: skills.license,
      homepageUrl: skills.homepageUrl,
      compatibleMin: skills.compatibleMin,
      compatibleMax: skills.compatibleMax,
      body: skills.body,
      contentHash: skills.contentHash,
      publishedAt: skills.publishedAt,
      createdAt: skills.createdAt,
      updatedAt: skills.updatedAt,
      securityScannedAt: skills.securityScannedAt,
      securityPassed: skills.securityPassed,
      securityRiskScore: skills.securityRiskScore,
      weeklyDownloads: skills.weeklyDownloads,
      authorId: skills.authorId,
      authorName: users.displayName,
      authorUsername: users.username,
      categoryId: skills.categoryId,
    })
    .from(skills)
    .leftJoin(users, eq(skills.authorId, users.id))
    .where(
      and(
        eq(skills.slug, slug),
        eq(skills.status, "published"),
      ),
    )
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!row) return null;

  // Fetch versions, dependencies, and security findings in parallel
  const [versions, depRows, findings] = await Promise.all([
    db
      .select({
        id: skillVersions.id,
        version: skillVersions.version,
        changelog: skillVersions.changelog,
        yanked: skillVersions.yanked,
        yankedReason: skillVersions.yankedReason,
        publishedAt: skillVersions.publishedAt,
      })
      .from(skillVersions)
      .where(eq(skillVersions.skillId, row.id))
      .orderBy(desc(skillVersions.publishedAt)),

    db
      .select({
        id: skills.id,
        slug: skills.slug,
        name: skills.name,
        currentVersion: skills.currentVersion,
        versionRange: skillDependencies.versionRange,
        required: skillDependencies.required,
      })
      .from(skillDependencies)
      .innerJoin(skills, eq(skillDependencies.dependsOnId, skills.id))
      .where(eq(skillDependencies.skillId, row.id)),

    db
      .select({
        id: skillSecurityFindings.id,
        level: skillSecurityFindings.level,
        rule: skillSecurityFindings.rule,
        message: skillSecurityFindings.message,
        lines: skillSecurityFindings.lines,
        suggestion: skillSecurityFindings.suggestion,
        scannedAt: skillSecurityFindings.scannedAt,
      })
      .from(skillSecurityFindings)
      .where(eq(skillSecurityFindings.skillId, row.id))
      .orderBy(desc(skillSecurityFindings.scannedAt)),
  ]);

  return {
    ...row,
    versions,
    dependencies: depRows,
    securityFindings: findings,
  } as SkillDetail;
}

// ---------------------------------------------------------------------------
// getSkillStarStatus
// ---------------------------------------------------------------------------
// Checks whether `userId` has starred `skillId`.
// Stars for skills use the polymorphic `votes` table with targetType="skill"
// and value=1 (star) — consistent with the vote system.

export async function getSkillStarStatus(
  skillId: string,
  userId: string,
): Promise<boolean> {
  const { votes } = await import("../schema");
  const row = await db
    .select({ id: votes.id })
    .from(votes)
    .where(
      and(
        eq(votes.userId, userId),
        eq(votes.targetType, "skill"),
        eq(votes.targetId, skillId),
        eq(votes.value, 1),
      ),
    )
    .limit(1)
    .then((r) => r[0] ?? null);

  return !!row;
}
