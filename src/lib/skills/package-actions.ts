"use server";

import { eq, and, sql, desc, ilike, or, count, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import {
  skillPackages,
  skillPackageItems,
  skillPackageStars,
  skills,
  users,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// ============================================================
// Skill Package Server Actions
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PackageListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string | null;
  tags: string[];
  isPublic: boolean;
  installCount: number;
  starCount: number;
  skillCount: number;
  authorId: string;
  authorName: string | null;
  authorUsername: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageDetail extends PackageListItem {
  skills: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    currentVersion: string;
    stars: number;
    downloads: number;
    tags: string[];
    authorName: string | null;
    authorUsername: string;
    publishedAt: Date | null;
    order: number;
  }>;
  starred: boolean;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// createPackage
// ---------------------------------------------------------------------------

export async function createPackage(data: {
  name: string;
  description: string;
  iconName?: string;
  tags?: string[];
}): Promise<ActionResult & { slug?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  try {
    // Generate slug from name
    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    await db.insert(skillPackages).values({
      name: data.name,
      slug,
      description: data.description,
      authorId: user.id,
      iconName: data.iconName ?? null,
      tags: data.tags ?? [],
    });

    revalidatePath("/", "layout");
    return { success: true, slug };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ---------------------------------------------------------------------------
// updatePackage
// ---------------------------------------------------------------------------

export async function updatePackage(
  packageId: string,
  data: {
    name?: string;
    description?: string;
    iconName?: string;
    tags?: string[];
    isPublic?: boolean;
  },
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  try {
    const pkg = await db
      .select({ authorId: skillPackages.authorId })
      .from(skillPackages)
      .where(eq(skillPackages.id, packageId))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!pkg) return { success: false, error: "notFound" };
    if (pkg.authorId !== user.id) return { success: false, error: "forbidden" };

    await db
      .update(skillPackages)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.iconName !== undefined && { iconName: data.iconName }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        updatedAt: new Date(),
      })
      .where(eq(skillPackages.id, packageId));

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ---------------------------------------------------------------------------
// deletePackage
// ---------------------------------------------------------------------------

export async function deletePackage(packageId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  try {
    const pkg = await db
      .select({ authorId: skillPackages.authorId })
      .from(skillPackages)
      .where(eq(skillPackages.id, packageId))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!pkg) return { success: false, error: "notFound" };
    if (pkg.authorId !== user.id) return { success: false, error: "forbidden" };

    await db.delete(skillPackages).where(eq(skillPackages.id, packageId));

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ---------------------------------------------------------------------------
// addSkillToPackage
// ---------------------------------------------------------------------------

export async function addSkillToPackage(
  packageId: string,
  skillId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  try {
    const pkg = await db
      .select({ authorId: skillPackages.authorId })
      .from(skillPackages)
      .where(eq(skillPackages.id, packageId))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!pkg) return { success: false, error: "notFound" };
    if (pkg.authorId !== user.id) return { success: false, error: "forbidden" };

    // Get next order value
    const maxOrder = await db
      .select({ max: sql<number>`COALESCE(MAX(${skillPackageItems.order}), -1)` })
      .from(skillPackageItems)
      .where(eq(skillPackageItems.packageId, packageId))
      .then((r) => r[0]?.max ?? -1);

    await db.insert(skillPackageItems).values({
      packageId,
      skillId,
      order: maxOrder + 1,
    });

    await db
      .update(skillPackages)
      .set({ updatedAt: new Date() })
      .where(eq(skillPackages.id, packageId));

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ---------------------------------------------------------------------------
// removeSkillFromPackage
// ---------------------------------------------------------------------------

export async function removeSkillFromPackage(
  packageId: string,
  skillId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  try {
    const pkg = await db
      .select({ authorId: skillPackages.authorId })
      .from(skillPackages)
      .where(eq(skillPackages.id, packageId))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!pkg) return { success: false, error: "notFound" };
    if (pkg.authorId !== user.id) return { success: false, error: "forbidden" };

    await db
      .delete(skillPackageItems)
      .where(
        and(
          eq(skillPackageItems.packageId, packageId),
          eq(skillPackageItems.skillId, skillId),
        ),
      );

    await db
      .update(skillPackages)
      .set({ updatedAt: new Date() })
      .where(eq(skillPackages.id, packageId));

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ---------------------------------------------------------------------------
// reorderPackageItems
// ---------------------------------------------------------------------------

export async function reorderPackageItems(
  packageId: string,
  items: { id: string; order: number }[],
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  try {
    const pkg = await db
      .select({ authorId: skillPackages.authorId })
      .from(skillPackages)
      .where(eq(skillPackages.id, packageId))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!pkg) return { success: false, error: "notFound" };
    if (pkg.authorId !== user.id) return { success: false, error: "forbidden" };

    // Update each item's order
    await Promise.all(
      items.map((item) =>
        db
          .update(skillPackageItems)
          .set({ order: item.order })
          .where(
            and(
              eq(skillPackageItems.id, item.id),
              eq(skillPackageItems.packageId, packageId),
            ),
          ),
      ),
    );

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ---------------------------------------------------------------------------
// listPackages
// ---------------------------------------------------------------------------

export async function listPackages(params: {
  search?: string;
  authorId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ items: PackageListItem[]; total: number }> {
  const { search, authorId, page = 1, limit: pageSize = 12 } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(skillPackages.isPublic, true)];

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(skillPackages.name, term),
        ilike(skillPackages.description, term),
      )!,
    );
  }

  if (authorId) {
    conditions.push(eq(skillPackages.authorId, authorId));
  }

  const whereClause = and(...conditions);

  const [totalResult, rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(skillPackages)
      .where(whereClause)
      .then((r) => Number(r[0]?.total ?? 0)),

    db
      .select({
        id: skillPackages.id,
        name: skillPackages.name,
        slug: skillPackages.slug,
        description: skillPackages.description,
        iconName: skillPackages.iconName,
        tags: skillPackages.tags,
        isPublic: skillPackages.isPublic,
        installCount: skillPackages.installCount,
        starCount: skillPackages.starCount,
        authorId: skillPackages.authorId,
        authorName: users.displayName,
        authorUsername: users.username,
        createdAt: skillPackages.createdAt,
        updatedAt: skillPackages.updatedAt,
      })
      .from(skillPackages)
      .leftJoin(users, eq(skillPackages.authorId, users.id))
      .where(whereClause)
      .orderBy(desc(skillPackages.starCount), desc(skillPackages.installCount))
      .limit(pageSize)
      .offset(offset),
  ]);

  // Get skill counts for each package
  const packageIds = rows.map((r) => r.id);
  let skillCounts: Record<string, number> = {};

  if (packageIds.length > 0) {
    const countRows = await db
      .select({
        packageId: skillPackageItems.packageId,
        count: count(),
      })
      .from(skillPackageItems)
      .where(
        sql`${skillPackageItems.packageId} IN ${packageIds}`,
      )
      .groupBy(skillPackageItems.packageId);

    skillCounts = Object.fromEntries(
      countRows.map((r) => [r.packageId, Number(r.count)]),
    );
  }

  const items: PackageListItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    iconName: r.iconName,
    tags: r.tags as string[],
    isPublic: r.isPublic,
    installCount: r.installCount,
    starCount: r.starCount,
    skillCount: skillCounts[r.id] ?? 0,
    authorId: r.authorId,
    authorName: r.authorName,
    authorUsername: r.authorUsername!,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  return { items, total: totalResult };
}

// ---------------------------------------------------------------------------
// getPackageBySlug
// ---------------------------------------------------------------------------

export async function getPackageBySlug(
  slug: string,
  currentUserId?: string,
): Promise<PackageDetail | null> {
  const row = await db
    .select({
      id: skillPackages.id,
      name: skillPackages.name,
      slug: skillPackages.slug,
      description: skillPackages.description,
      iconName: skillPackages.iconName,
      tags: skillPackages.tags,
      isPublic: skillPackages.isPublic,
      installCount: skillPackages.installCount,
      starCount: skillPackages.starCount,
      authorId: skillPackages.authorId,
      authorName: users.displayName,
      authorUsername: users.username,
      createdAt: skillPackages.createdAt,
      updatedAt: skillPackages.updatedAt,
    })
    .from(skillPackages)
    .leftJoin(users, eq(skillPackages.authorId, users.id))
    .where(eq(skillPackages.slug, slug))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!row) return null;

  // Fetch included skills with order
  const packageSkills = await db
    .select({
      id: skills.id,
      slug: skills.slug,
      name: skills.name,
      description: skills.description,
      currentVersion: skills.currentVersion,
      stars: skills.stars,
      downloads: skills.downloads,
      tags: skills.tags,
      authorName: users.displayName,
      authorUsername: users.username,
      publishedAt: skills.publishedAt,
      order: skillPackageItems.order,
    })
    .from(skillPackageItems)
    .innerJoin(skills, eq(skillPackageItems.skillId, skills.id))
    .leftJoin(users, eq(skills.authorId, users.id))
    .where(eq(skillPackageItems.packageId, row.id))
    .orderBy(asc(skillPackageItems.order));

  // Check if current user has starred
  let starred = false;
  if (currentUserId) {
    const starRow = await db
      .select({ id: skillPackageStars.id })
      .from(skillPackageStars)
      .where(
        and(
          eq(skillPackageStars.packageId, row.id),
          eq(skillPackageStars.userId, currentUserId),
        ),
      )
      .limit(1)
      .then((r) => r[0] ?? null);
    starred = !!starRow;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    iconName: row.iconName,
    tags: row.tags as string[],
    isPublic: row.isPublic,
    installCount: row.installCount,
    starCount: row.starCount,
    skillCount: packageSkills.length,
    authorId: row.authorId,
    authorName: row.authorName,
    authorUsername: row.authorUsername!,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    skills: packageSkills.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      currentVersion: s.currentVersion,
      stars: s.stars,
      downloads: s.downloads,
      tags: s.tags,
      authorName: s.authorName,
      authorUsername: s.authorUsername!,
      publishedAt: s.publishedAt,
      order: s.order,
    })),
    starred,
  };
}

// ---------------------------------------------------------------------------
// starPackage — toggle
// ---------------------------------------------------------------------------

export async function starPackage(
  packageId: string,
): Promise<ActionResult & { starred?: boolean; newCount?: number }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  try {
    const existing = await db
      .select({ id: skillPackageStars.id })
      .from(skillPackageStars)
      .where(
        and(
          eq(skillPackageStars.packageId, packageId),
          eq(skillPackageStars.userId, user.id),
        ),
      )
      .limit(1)
      .then((r) => r[0] ?? null);

    let starred: boolean;

    if (existing) {
      await db.delete(skillPackageStars).where(eq(skillPackageStars.id, existing.id));
      await db
        .update(skillPackages)
        .set({ starCount: sql`GREATEST(${skillPackages.starCount} - 1, 0)` })
        .where(eq(skillPackages.id, packageId));
      starred = false;
    } else {
      await db.insert(skillPackageStars).values({
        packageId,
        userId: user.id,
      });
      await db
        .update(skillPackages)
        .set({ starCount: sql`${skillPackages.starCount} + 1` })
        .where(eq(skillPackages.id, packageId));
      starred = true;
    }

    const updated = await db
      .select({ starCount: skillPackages.starCount })
      .from(skillPackages)
      .where(eq(skillPackages.id, packageId))
      .limit(1)
      .then((r) => r[0]);

    revalidatePath("/", "layout");
    return { success: true, starred, newCount: updated?.starCount ?? 0 };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ---------------------------------------------------------------------------
// installPackage — increment install count
// ---------------------------------------------------------------------------

export async function installPackage(
  packageId: string,
): Promise<ActionResult & { newCount?: number }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "unauthenticated" };

  try {
    await db
      .update(skillPackages)
      .set({ installCount: sql`${skillPackages.installCount} + 1` })
      .where(eq(skillPackages.id, packageId));

    const updated = await db
      .select({ installCount: skillPackages.installCount })
      .from(skillPackages)
      .where(eq(skillPackages.id, packageId))
      .limit(1)
      .then((r) => r[0]);

    revalidatePath("/", "layout");
    return { success: true, newCount: updated?.installCount ?? 0 };
  } catch {
    return { success: false, error: "serverError" };
  }
}

// ---------------------------------------------------------------------------
// getUserPackages
// ---------------------------------------------------------------------------

export async function getUserPackages(
  userId: string,
): Promise<PackageListItem[]> {
  const rows = await db
    .select({
      id: skillPackages.id,
      name: skillPackages.name,
      slug: skillPackages.slug,
      description: skillPackages.description,
      iconName: skillPackages.iconName,
      tags: skillPackages.tags,
      isPublic: skillPackages.isPublic,
      installCount: skillPackages.installCount,
      starCount: skillPackages.starCount,
      authorId: skillPackages.authorId,
      authorName: users.displayName,
      authorUsername: users.username,
      createdAt: skillPackages.createdAt,
      updatedAt: skillPackages.updatedAt,
    })
    .from(skillPackages)
    .leftJoin(users, eq(skillPackages.authorId, users.id))
    .where(eq(skillPackages.authorId, userId))
    .orderBy(desc(skillPackages.updatedAt));

  const packageIds = rows.map((r) => r.id);
  let skillCounts: Record<string, number> = {};

  if (packageIds.length > 0) {
    const countRows = await db
      .select({
        packageId: skillPackageItems.packageId,
        count: count(),
      })
      .from(skillPackageItems)
      .where(sql`${skillPackageItems.packageId} IN ${packageIds}`)
      .groupBy(skillPackageItems.packageId);

    skillCounts = Object.fromEntries(
      countRows.map((r) => [r.packageId, Number(r.count)]),
    );
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    iconName: r.iconName,
    tags: r.tags as string[],
    isPublic: r.isPublic,
    installCount: r.installCount,
    starCount: r.starCount,
    skillCount: skillCounts[r.id] ?? 0,
    authorId: r.authorId,
    authorName: r.authorName,
    authorUsername: r.authorUsername!,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

// ---------------------------------------------------------------------------
// getFeaturedPackages
// ---------------------------------------------------------------------------

export async function getFeaturedPackages(
  limit: number = 6,
): Promise<PackageListItem[]> {
  const rows = await db
    .select({
      id: skillPackages.id,
      name: skillPackages.name,
      slug: skillPackages.slug,
      description: skillPackages.description,
      iconName: skillPackages.iconName,
      tags: skillPackages.tags,
      isPublic: skillPackages.isPublic,
      installCount: skillPackages.installCount,
      starCount: skillPackages.starCount,
      authorId: skillPackages.authorId,
      authorName: users.displayName,
      authorUsername: users.username,
      createdAt: skillPackages.createdAt,
      updatedAt: skillPackages.updatedAt,
    })
    .from(skillPackages)
    .leftJoin(users, eq(skillPackages.authorId, users.id))
    .where(eq(skillPackages.isPublic, true))
    .orderBy(
      desc(sql`${skillPackages.starCount} + ${skillPackages.installCount}`),
    )
    .limit(limit);

  const packageIds = rows.map((r) => r.id);
  let skillCounts: Record<string, number> = {};

  if (packageIds.length > 0) {
    const countRows = await db
      .select({
        packageId: skillPackageItems.packageId,
        count: count(),
      })
      .from(skillPackageItems)
      .where(sql`${skillPackageItems.packageId} IN ${packageIds}`)
      .groupBy(skillPackageItems.packageId);

    skillCounts = Object.fromEntries(
      countRows.map((r) => [r.packageId, Number(r.count)]),
    );
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    iconName: r.iconName,
    tags: r.tags as string[],
    isPublic: r.isPublic,
    installCount: r.installCount,
    starCount: r.starCount,
    skillCount: skillCounts[r.id] ?? 0,
    authorId: r.authorId,
    authorName: r.authorName,
    authorUsername: r.authorUsername!,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}
