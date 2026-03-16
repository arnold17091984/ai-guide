"use server";

import { eq, and, count, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userSkills, skills, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { revalidatePath } from "next/cache";

// ============================================================
// registerSkill — user adopts a skill
// ============================================================

export async function registerSkill(skillId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await db
      .insert(userSkills)
      .values({ userId: user.id, skillId, status: "registered" })
      .onConflictDoNothing();
  } catch {
    // Already registered or DB error — silently ignore
  }

  revalidatePath("/");
}

// ============================================================
// updateSkillStatus — change status (in_progress / completed)
// ============================================================

export async function updateSkillStatus(
  skillId: string,
  status: "in_progress" | "completed",
) {
  const VALID_STATUSES: readonly string[] = ["in_progress", "completed"];
  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Invalid status");
  }

  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const now = new Date();
  const updates: Record<string, unknown> = { status };
  if (status === "in_progress") updates.startedAt = now;
  if (status === "completed") updates.completedAt = now;

  await db
    .update(userSkills)
    .set(updates)
    .where(
      and(eq(userSkills.userId, user.id), eq(userSkills.skillId, skillId)),
    );

  revalidatePath("/");
}

// ============================================================
// unregisterSkill — remove adoption
// ============================================================

export async function unregisterSkill(skillId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await db
    .delete(userSkills)
    .where(
      and(eq(userSkills.userId, user.id), eq(userSkills.skillId, skillId)),
    );

  revalidatePath("/");
}

// ============================================================
// getUserSkillStatus — check if current user has this skill
// ============================================================

export async function getUserSkillStatus(skillId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = await db
    .select({ status: userSkills.status })
    .from(userSkills)
    .where(
      and(eq(userSkills.userId, user.id), eq(userSkills.skillId, skillId)),
    )
    .limit(1);

  return rows[0]?.status ?? null;
}

// ============================================================
// getMySkills — all skills registered by current user
// ============================================================

export async function getMySkills() {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await db
    .select({
      id: userSkills.id,
      skillId: userSkills.skillId,
      status: userSkills.status,
      registeredAt: userSkills.registeredAt,
      completedAt: userSkills.completedAt,
      skillName: skills.name,
      skillSlug: skills.slug,
      skillDescription: skills.description,
      skillDownloads: skills.downloads,
      skillStars: skills.stars,
    })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id))
    .where(eq(userSkills.userId, user.id))
    .orderBy(desc(userSkills.registeredAt));

  return rows;
}

// ============================================================
// getMySkillStats — summary counts for current user
// ============================================================

export async function getMySkillStats() {
  const user = await getCurrentUser();
  if (!user) return { registered: 0, inProgress: 0, completed: 0 };

  const rows = await db
    .select({
      status: userSkills.status,
      count: count(),
    })
    .from(userSkills)
    .where(eq(userSkills.userId, user.id))
    .groupBy(userSkills.status);

  const stats = { registered: 0, inProgress: 0, completed: 0 };
  for (const row of rows) {
    if (row.status === "registered") stats.registered = Number(row.count);
    if (row.status === "in_progress") stats.inProgress = Number(row.count);
    if (row.status === "completed") stats.completed = Number(row.count);
  }
  return stats;
}

// ============================================================
// getSkillAdopters — who has registered a given skill
// ============================================================

export async function getSkillAdopters(skillId: string, limit = 10) {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const rows = await db
    .select({
      userId: userSkills.userId,
      status: userSkills.status,
      registeredAt: userSkills.registeredAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(userSkills)
    .innerJoin(users, eq(userSkills.userId, users.id))
    .where(eq(userSkills.skillId, skillId))
    .orderBy(desc(userSkills.registeredAt))
    .limit(safeLimit);

  return rows;
}

// ============================================================
// getSkillAdopterCount — total adopters for a skill
// ============================================================

export async function getSkillAdopterCount(skillId: string) {
  const [result] = await db
    .select({ value: count() })
    .from(userSkills)
    .where(eq(userSkills.skillId, skillId));

  return Number(result.value);
}
