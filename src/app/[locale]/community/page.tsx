import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import LeaderboardRow from "@/components/LeaderboardRow";
import { getCurrentUser } from "@/lib/auth";
import { getLeaderboard, getRisingStars } from "@/lib/reputation/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function TrophyIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8m-4-4v4m-4.5-8a7.5 7.5 0 0113-5.19M6.5 13A7.5 7.5 0 018 3h8a7.5 7.5 0 011.5 10M5 3H3v3a4 4 0 004 4m8-4h2V3h2v3a4 4 0 01-4 4" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tab Bar (client interactivity via search params)
// ---------------------------------------------------------------------------

function TabBar({
  activeTab,
  locale,
  labels,
}: {
  activeTab: string;
  locale: string;
  labels: { leaderboard: string; risingStars: string; achievementShowcase: string };
}) {
  const tabs = [
    { key: "leaderboard", label: labels.leaderboard, icon: <TrophyIcon /> },
    { key: "rising", label: labels.risingStars, icon: <StarIcon /> },
    { key: "achievements", label: labels.achievementShowcase, icon: <BadgeIcon /> },
  ];

  return (
    <div className="mb-8 flex gap-2 overflow-x-auto rounded-xl border border-(--border) bg-white/70 p-1 backdrop-blur-xl dark:bg-white/5">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const href =
          tab.key === "achievements"
            ? `/${locale}/community/achievements`
            : `/${locale}/community${tab.key === "leaderboard" ? "" : `?tab=${tab.key}`}`;

        return (
          <Link
            key={tab.key}
            href={href}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "text-(--text-2) hover:text-(--text-1) hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CommunityPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "rising" ? "rising" : "leaderboard";

  const [t, currentUser] = await Promise.all([
    getTranslations("community"),
    getCurrentUser(),
  ]);

  let entries: Awaited<ReturnType<typeof getLeaderboard>> = [];
  try {
    entries = activeTab === "rising"
      ? await getRisingStars(50)
      : await getLeaderboard(50);
  } catch {
    // DB not available — render empty state
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        gradient="from-purple-600 via-fuchsia-500 to-pink-500"
        icon={<TrophyIcon />}
      />

      <TabBar
        activeTab={activeTab}
        locale={locale}
        labels={{
          leaderboard: t("leaderboard"),
          risingStars: t("risingStars"),
          achievementShowcase: t("achievementShowcase"),
        }}
      />

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        }
      >
        <div className="space-y-1">
          {entries.length === 0 && (
            <ScrollFadeIn>
              <div className="rounded-2xl border border-(--border) bg-white/70 p-12 text-center backdrop-blur-xl dark:bg-white/5">
                <p className="text-(--text-2)">{t("empty")}</p>
              </div>
            </ScrollFadeIn>
          )}

          {entries.map((entry, i) => (
            <ScrollFadeIn key={entry.id} delay={i * 0.03}>
              <LeaderboardRow
                rank={entry.rank}
                userId={entry.id}
                username={entry.username}
                displayName={entry.displayName}
                avatarUrl={entry.avatarUrl}
                reputation={entry.reputation}
                isCurrentUser={currentUser?.id === entry.id}
                locale={locale}
              />
            </ScrollFadeIn>
          ))}
        </div>
      </Suspense>
    </>
  );
}
