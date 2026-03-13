import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import DashboardWidget from "@/components/DashboardWidget";
import HeroStats from "@/components/HeroStats";
import { getRecentEntries, getPopularSkills, getActiveDiscussions } from "@/lib/dashboard/actions";

export default async function HomeDashboard() {
  const t = await getTranslations("dashboard");
  const locale = await getLocale();

  let recentEntries: Awaited<ReturnType<typeof getRecentEntries>> = [];
  let popularSkills: Awaited<ReturnType<typeof getPopularSkills>> = [];
  let activeDiscussions: Awaited<ReturnType<typeof getActiveDiscussions>> = [];
  try {
    [recentEntries, popularSkills, activeDiscussions] = await Promise.all([
      getRecentEntries(5),
      getPopularSkills(5),
      getActiveDiscussions(5),
    ]);
  } catch {
    // DB not available — render empty state
  }

  // Helper to pick localized title
  function getLocalizedTitle(entry: {
    titleKo: string;
    titleEn: string | null;
    titleJa: string | null;
  }) {
    if (locale === "en" && entry.titleEn) return entry.titleEn;
    if (locale === "ja" && entry.titleJa) return entry.titleJa;
    return entry.titleKo;
  }

  return (
    <div className="mt-16 space-y-8">
      {/* Hero Stats */}
      <ScrollFadeIn>
        <HeroStats />
      </ScrollFadeIn>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Knowledge */}
        <ScrollFadeIn delay={0.1}>
          <DashboardWidget
            title={t("recentKnowledge")}
            viewAllHref={`/${locale}/knowledge`}
            viewAllLabel={t("viewAll")}
          >
            <div className="space-y-3">
              {recentEntries.length > 0 ? (
                recentEntries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/${locale}/knowledge/${entry.slug}`}
                    className="group flex items-start gap-3"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-900/20">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-(--text-1) group-hover:text-(--primary)">
                        {getLocalizedTitle(entry)}
                      </p>
                      <p className="text-xs text-(--text-2)">
                        {entry.authorDisplayName ?? entry.authorUsername}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-(--text-2)">--</p>
              )}
            </div>
          </DashboardWidget>
        </ScrollFadeIn>

        {/* Popular Skills */}
        <ScrollFadeIn delay={0.2}>
          <DashboardWidget
            title={t("popularSkills")}
            viewAllHref={`/${locale}/skills`}
            viewAllLabel={t("viewAll")}
          >
            <div className="space-y-3">
              {popularSkills.length > 0 ? (
                popularSkills.map((skill) => (
                  <Link
                    key={skill.id}
                    href={`/${locale}/skills/${skill.slug}`}
                    className="group flex items-start gap-3"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-500 dark:bg-violet-900/20">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-(--text-1) group-hover:text-(--primary)">
                        {skill.name}
                      </p>
                      <p className="text-xs text-(--text-2)">
                        {skill.downloads.toLocaleString()} downloads
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-(--text-2)">--</p>
              )}
            </div>
          </DashboardWidget>
        </ScrollFadeIn>

        {/* Active Discussions */}
        <ScrollFadeIn delay={0.3}>
          <DashboardWidget
            title={t("activeDiscussions")}
            viewAllHref={`/${locale}/knowledge`}
            viewAllLabel={t("viewAll")}
          >
            <div className="space-y-3">
              {activeDiscussions.length > 0 ? (
                activeDiscussions.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/${locale}/knowledge/${entry.slug}`}
                    className="group flex items-start gap-3"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 dark:bg-amber-900/20">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-(--text-1) group-hover:text-(--primary)">
                        {getLocalizedTitle(entry)}
                      </p>
                      <p className="text-xs text-(--text-2)">
                        {Number(entry.commentCount).toLocaleString()} comments
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-(--text-2)">--</p>
              )}
            </div>
          </DashboardWidget>
        </ScrollFadeIn>

        {/* This Week link */}
        <ScrollFadeIn delay={0.4}>
          <Link href={`/${locale}/digest`}>
            <div className="flex items-center justify-between rounded-2xl border border-(--border) bg-linear-to-br from-indigo-500/10 to-violet-500/10 p-6 transition-colors hover:border-indigo-300/50 dark:hover:border-indigo-500/30">
              <div>
                <h3 className="text-lg font-semibold text-(--text-1)">
                  {t("thisWeek")}
                </h3>
                <p className="text-sm text-(--text-2)">
                  {t("thisWeekDescription")}
                </p>
              </div>
              <svg className="h-6 w-6 text-(--primary)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
