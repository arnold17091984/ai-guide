"use server";

import { eq, and, or, ilike, count, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { teams, teamMembers, teamInvites, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import crypto from "crypto";

// ============================================================
// Helpers
// ============================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function assertTeamRole(
  teamId: string,
  userId: string,
  requiredRoles: string[],
) {
  const member = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!member || !requiredRoles.includes(member.role)) {
    throw new Error("Insufficient permissions");
  }

  return member;
}

// ============================================================
// createTeam
// ============================================================

export async function createTeam(data: {
  name: string;
  description?: string;
  avatarUrl?: string;
  isPublic?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  let slug = generateSlug(data.name);

  // Ensure slug uniqueness
  const existing = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const [team] = await db
    .insert(teams)
    .values({
      name: data.name,
      slug,
      description: data.description ?? null,
      avatarUrl: data.avatarUrl ?? null,
      ownerId: user.id,
      isPublic: data.isPublic ?? true,
    })
    .returning();

  // Add the creator as owner member
  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: "owner",
  });

  return team;
}

// ============================================================
// updateTeam
// ============================================================

export async function updateTeam(
  teamId: string,
  data: {
    name?: string;
    description?: string;
    avatarUrl?: string;
    isPublic?: boolean;
    maxMembers?: number;
  },
) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  await assertTeamRole(teamId, user.id, ["owner", "admin"]);

  const [updated] = await db
    .update(teams)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId))
    .returning();

  return updated;
}

// ============================================================
// deleteTeam
// ============================================================

export async function deleteTeam(teamId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  await assertTeamRole(teamId, user.id, ["owner"]);

  await db.delete(teams).where(eq(teams.id, teamId));

  return { success: true };
}

// ============================================================
// getTeam
// ============================================================

export async function getTeam(slug: string) {
  try {
    const user = await getCurrentUser();

    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.slug, slug))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!team) return null;

    // Private teams visible only to members
    if (!team.isPublic && user) {
      const member = await db
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(
          and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, user.id)),
        )
        .limit(1);

      if (member.length === 0) return null;
    }

    if (!team.isPublic && !user) return null;

    return team;
  } catch {
    return null;
  }
}

// ============================================================
// getUserTeams
// ============================================================

export async function getUserTeams(userId?: string) {
  try {
    const user = await getCurrentUser();
    const targetUserId = userId ?? user?.id;
    if (!targetUserId) return [];

    const rows = await db
      .select({
        team: teams,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, targetUserId))
      .orderBy(desc(teamMembers.joinedAt));

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// getTeamMembers
// ============================================================

export async function getTeamMembers(teamId: string) {
  try {
    const rows = await db
      .select({
        memberId: teamMembers.id,
        userId: teamMembers.userId,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        reputation: users.reputation,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(
        sql`CASE ${teamMembers.role} WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END`,
      );

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// getTeamMemberCount
// ============================================================

export async function getTeamMemberCount(teamId: string) {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

// ============================================================
// inviteToTeam
// ============================================================

export async function inviteToTeam(teamId: string, email: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  await assertTeamRole(teamId, user.id, ["owner", "admin"]);

  // Check if already a member
  const existingMember = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(and(eq(users.email, email), eq(teamMembers.teamId, teamId)))
    .limit(1);

  if (existingMember.length > 0) {
    throw new Error("User is already a member");
  }

  // Check for pending invite
  const existingInvite = await db
    .select({ id: teamInvites.id })
    .from(teamInvites)
    .where(
      and(
        eq(teamInvites.teamId, teamId),
        eq(teamInvites.inviteeEmail, email),
        eq(teamInvites.status, "pending"),
      ),
    )
    .limit(1);

  if (existingInvite.length > 0) {
    throw new Error("Invite already pending");
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [invite] = await db
    .insert(teamInvites)
    .values({
      teamId,
      inviterId: user.id,
      inviteeEmail: email,
      token,
      expiresAt,
    })
    .returning();

  return invite;
}

// ============================================================
// acceptInvite
// ============================================================

export async function acceptInvite(token: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const invite = await db
    .select()
    .from(teamInvites)
    .where(eq(teamInvites.token, token))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!invite) throw new Error("Invalid invite");
  if (invite.status !== "pending") throw new Error("Invite is no longer valid");
  if (new Date() > invite.expiresAt) {
    await db
      .update(teamInvites)
      .set({ status: "expired" })
      .where(eq(teamInvites.id, invite.id));
    throw new Error("Invite has expired");
  }

  // Check max members
  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.id, invite.teamId))
    .limit(1)
    .then((rows) => rows[0]);

  if (team) {
    const memberCount = await getTeamMemberCount(team.id);
    if (memberCount >= team.maxMembers) {
      throw new Error("Team is full");
    }
  }

  // Add as member
  await db
    .insert(teamMembers)
    .values({
      teamId: invite.teamId,
      userId: user.id,
      role: "member",
    })
    .onConflictDoNothing();

  // Mark invite accepted
  await db
    .update(teamInvites)
    .set({ status: "accepted" })
    .where(eq(teamInvites.id, invite.id));

  return invite.teamId;
}

// ============================================================
// declineInvite
// ============================================================

export async function declineInvite(token: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  await db
    .update(teamInvites)
    .set({ status: "declined" })
    .where(and(eq(teamInvites.token, token), eq(teamInvites.status, "pending")));

  return { success: true };
}

// ============================================================
// removeMember
// ============================================================

export async function removeMember(teamId: string, userId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  await assertTeamRole(teamId, user.id, ["owner", "admin"]);

  // Can't remove owner
  const target = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!target) throw new Error("Member not found");
  if (target.role === "owner") throw new Error("Cannot remove the team owner");

  await db
    .delete(teamMembers)
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
    );

  return { success: true };
}

// ============================================================
// updateMemberRole
// ============================================================

export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: "admin" | "member",
) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  await assertTeamRole(teamId, user.id, ["owner"]);

  // Can't change owner's role
  const target = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!target) throw new Error("Member not found");
  if (target.role === "owner") throw new Error("Cannot change owner role");

  await db
    .update(teamMembers)
    .set({ role })
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
    );

  return { success: true };
}

// ============================================================
// leaveTeam
// ============================================================

export async function leaveTeam(teamId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const member = await assertTeamRole(teamId, user.id, [
    "owner",
    "admin",
    "member",
  ]);

  if (member.role === "owner") {
    throw new Error("Owner cannot leave the team. Transfer ownership or delete the team.");
  }

  await db
    .delete(teamMembers)
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id)),
    );

  return { success: true };
}

// ============================================================
// getPublicTeams — for "Discover" tab
// ============================================================

export async function getPublicTeams(search?: string) {
  const conditions = [eq(teams.isPublic, true)];

  if (search && search.trim()) {
    conditions.push(
      or(
        ilike(teams.name, `%${search}%`),
        ilike(teams.slug, `%${search}%`),
      )!,
    );
  }

  try {
    const rows = await db
      .select({
        team: teams,
        memberCount: count(teamMembers.id),
      })
      .from(teams)
      .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(and(...conditions))
      .groupBy(teams.id)
      .orderBy(desc(teams.createdAt))
      .limit(50);

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// getTeamInviteByToken
// ============================================================

export async function getTeamInviteByToken(token: string) {
  try {
    const invite = await db
      .select({
        invite: teamInvites,
        teamName: teams.name,
        teamSlug: teams.slug,
        teamAvatarUrl: teams.avatarUrl,
        inviterUsername: users.username,
        inviterDisplayName: users.displayName,
      })
      .from(teamInvites)
      .innerJoin(teams, eq(teamInvites.teamId, teams.id))
      .innerJoin(users, eq(teamInvites.inviterId, users.id))
      .where(eq(teamInvites.token, token))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    return invite;
  } catch {
    return null;
  }
}

// ============================================================
// getPendingInvites — for invite modal
// ============================================================

export async function getPendingInvites(teamId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const rows = await db
      .select({
        id: teamInvites.id,
        email: teamInvites.inviteeEmail,
        status: teamInvites.status,
        createdAt: teamInvites.createdAt,
        expiresAt: teamInvites.expiresAt,
      })
      .from(teamInvites)
      .where(
        and(eq(teamInvites.teamId, teamId), eq(teamInvites.status, "pending")),
      )
      .orderBy(desc(teamInvites.createdAt));

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// joinPublicTeam
// ============================================================

export async function joinPublicTeam(teamId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const team = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.isPublic, true)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!team) throw new Error("Team not found");

  const memberCount = await getTeamMemberCount(teamId);
  if (memberCount >= team.maxMembers) {
    throw new Error("Team is full");
  }

  await db
    .insert(teamMembers)
    .values({
      teamId,
      userId: user.id,
      role: "member",
    })
    .onConflictDoNothing();

  return { success: true };
}

// ============================================================
// isTeamMember
// ============================================================

export async function isTeamMember(teamId: string, userId: string) {
  try {
    const member = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    return member;
  } catch {
    return null;
  }
}
