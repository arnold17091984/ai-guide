import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { getTeam, isTeamMember } from "@/lib/teams/actions";
import TeamSettingsClient from "./settings-client";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function TeamSettingsPage({ params }: PageProps) {
  const { locale, slug } = await params;

  const [t, currentUser] = await Promise.all([
    getTranslations("teams"),
    getCurrentUser(),
  ]);

  if (!currentUser) redirect("/auth/login");

  const team = await getTeam(slug);
  if (!team) notFound();

  const membership = await isTeamMember(team.id, currentUser.id);
  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    notFound();
  }

  return (
    <TeamSettingsClient
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
      }}
      isOwner={membership.role === "owner"}
      labels={{
        settingsTitle: t("settingsTitle"),
        settingsSubtitle: t("settingsSubtitle"),
        teamName: t("teamName"),
        teamDescription: t("teamDescription"),
        avatarUrl: t("avatarUrl"),
        isPublic: t("isPublic"),
        maxMembers: t("maxMembers"),
        save: t("save"),
        saving: t("saving"),
        saved: t("saved"),
        dangerZone: t("dangerZone"),
        deleteTeam: t("deleteTeam"),
        deleteWarning: t("deleteWarning"),
        confirmDelete: t("confirmDelete"),
        back: t("back"),
      }}
    />
  );
}
