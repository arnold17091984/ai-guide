import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getTeam,
  getTeamMembers,
  getTeamMemberCount,
  isTeamMember,
  getPendingInvites,
} from "@/lib/teams/actions";
import TeamDetailClient from "./team-detail-client";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;

  const [t, currentUser] = await Promise.all([
    getTranslations("teams"),
    getCurrentUser(),
  ]);

  const team = await getTeam(slug);
  if (!team) notFound();

  const [members, memberCount] = await Promise.all([
    getTeamMembers(team.id),
    getTeamMemberCount(team.id),
  ]);

  const membership = currentUser
    ? await isTeamMember(team.id, currentUser.id)
    : null;

  const pendingInvites =
    membership && (membership.role === "owner" || membership.role === "admin")
      ? await getPendingInvites(team.id)
      : [];

  return (
    <TeamDetailClient
      locale={locale}
      team={{
        id: team.id,
        name: team.name,
        slug: team.slug,
        description: team.description,
        avatarUrl: team.avatarUrl,
        isPublic: team.isPublic,
        maxMembers: team.maxMembers,
        ownerId: team.ownerId,
        createdAt: team.createdAt.toISOString(),
      }}
      members={members.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      }))}
      memberCount={memberCount}
      currentUserId={currentUser?.id ?? null}
      memberRole={membership?.role ?? null}
      pendingInvites={pendingInvites.map((inv) => ({
        ...inv,
        createdAt: new Date(inv.createdAt),
        expiresAt: new Date(inv.expiresAt),
      }))}
      labels={{
        members: t("members"),
        settings: t("settings"),
        invite: t("invite"),
        joinTeam: t("joinTeam"),
        leaveTeam: t("leaveTeam"),
        createdOn: t("createdOn"),
        memberCount: t("memberCount"),
        publicTeam: t("publicTeam"),
        privateTeam: t("privateTeam"),
        confirmLeave: t("confirmLeave"),
      }}
    />
  );
}
