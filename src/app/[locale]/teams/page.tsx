import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import { getCurrentUser } from "@/lib/auth";
import { getUserTeams, getPublicTeams } from "@/lib/teams/actions";
import TeamsPageClient from "./teams-client";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function TeamIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; q?: string }>;
}

export default async function TeamsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { tab, q } = await searchParams;
  const activeTab = tab === "discover" ? "discover" : "my";

  const [t, currentUser] = await Promise.all([
    getTranslations("teams"),
    getCurrentUser(),
  ]);

  const [myTeamsData, publicTeamsData] = await Promise.all([
    currentUser ? getUserTeams(currentUser.id) : Promise.resolve([]),
    getPublicTeams(q),
  ]);

  const myTeams = myTeamsData.map((row) => ({
    ...row.team,
    memberRole: row.role,
  }));

  const publicTeams = publicTeamsData.map((row) => ({
    ...row.team,
    memberCount: row.memberCount,
  }));

  const myTeamIds = new Set(myTeams.map((t) => t.id));

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        gradient="from-cyan-600 via-blue-500 to-indigo-500"
        icon={<TeamIcon />}
      />

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        }
      >
        <TeamsPageClient
          locale={locale}
          activeTab={activeTab}
          myTeams={myTeams}
          publicTeams={publicTeams}
          myTeamIds={Array.from(myTeamIds)}
          isLoggedIn={!!currentUser}
          searchQuery={q ?? ""}
          labels={{
            myTeams: t("myTeams"),
            discover: t("discover"),
            createTeam: t("createTeam"),
            searchPlaceholder: t("searchPlaceholder"),
            noTeams: t("noTeams"),
            noPublicTeams: t("noPublicTeams"),
            loginToCreate: t("loginToCreate"),
            teamName: t("teamName"),
            teamDescription: t("teamDescription"),
            isPublic: t("isPublic"),
            cancel: t("cancel"),
            create: t("create"),
            creating: t("creating"),
          }}
        />
      </Suspense>
    </>
  );
}
