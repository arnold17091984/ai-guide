import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import DashboardWidget from "@/components/DashboardWidget";
import HeroStats from "@/components/HeroStats";
import {
  getRecentEntries,
  getPopularSkills,
  getActiveDiscussions,
  getDashboardStats,
} from "@/lib/dashboard/actions";

export default async function HomeDashboard() {
  const t = await getTranslations("dashboard");
  const locale = await getLocale();

  let recentEntries: Awaited<ReturnType<typeof getRecentEntries>> = [];
  let popularSkills: Awaited<ReturnType<typeof getPopularSkills>> = [];
  let activeDiscussions: Awaited<ReturnType<typeof getActiveDiscussions>> = [];
  let stats: Awaited<ReturnType<typeof getDashboardStats>> = {
    totalEntries: 0,
    totalSkills: 0,
    totalUsers: 0,
    totalVotes: 0,
  };
  try {
    [recentEntries, popularSkills, activeDiscussions, stats] =
      await Promise.all([
        getRecentEntries(5),
        getPopularSkills(5),
        getActiveDiscussions(5),
        getDashboardStats(),
      ]);
  } catch {
    // DB not available — render empty state
  }

  function getLocalizedTitle(entry: {
    titleKo: string;
    titleEn: string | null;
    titleJa: string | null;
  }) {
    if (locale === "en" && entry.titleEn) return entry.titleEn;
    if (locale === "ja" && entry.titleJa) return entry.titleJa;
    return entry.titleKo;
  }

  function getLocalizedSummary(entry: {
    summaryKo: string | null;
    summaryEn: string | null;
    summaryJa: string | null;
  }) {
    if (locale === "en" && entry.summaryEn) return entry.summaryEn;
    if (locale === "ja" && entry.summaryJa) return entry.summaryJa;
    return entry.summaryKo;
  }

  const featuredEntry = recentEntries[0] ?? null;
  const subEntries = recentEntries.slice(1, 4);

  return (
    <div className="mt-6 space-y-8">
      {/* ============================================================
          Weekly Digest — Magazine-style featured section
          ============================================================ */}
      <ScrollFadeIn>
        <section>
          {/* Section header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-5 w-1 rounded-full bg-(--accent)" />
              <h2 className="text-sm font-mono font-medium uppercase tracking-wider text-(--text-3)">
                {t("weeklyHighlight")}
              </h2>
            </div>
            <Link
              href={`/${locale}/digest`}
              className="group inline-flex items-center gap-1 text-xs font-medium text-(--accent) transition-colors hover:text-(--accent-hover)"
            >
              {t("viewFullDigest")}
              <svg
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {/* Featured + sub-entries + sidebar */}
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            {/* Left: Featured entry + sub-entries */}
            <div className="space-y-4">
              {/* Featured card */}
              {featuredEntry ? (
                <Link
                  href={`/${locale}/knowledge/${featuredEntry.slug}`}
                  className="group block rounded-lg border border-(--border) bg-(--bg-surface) p-5 transition-colors hover:border-(--border-hover)"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded bg-(--accent-muted) px-2 py-0.5 text-xs font-mono font-medium text-(--accent)">
                      {featuredEntry.contentType}
                    </span>
                    <span className="text-xs text-(--text-3)">
                      {featuredEntry.authorDisplayName ??
                        featuredEntry.authorUsername}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold leading-snug text-(--text-1) group-hover:text-(--accent)">
                    {getLocalizedTitle(featuredEntry)}
                  </h3>
                  {featuredEntry.summaryKo && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-(--text-2)">
                      {getLocalizedSummary(featuredEntry)}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-(--accent)">
                    {t("readMore")}
                    <svg
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ) : (
                <div className="rounded-lg border border-dashed border-(--border) p-8 text-center text-sm text-(--text-3)">
                  {t("weeklyHighlightSubtitle")}
                </div>
              )}

              {/* Sub-entries row */}
              {subEntries.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-3">
                  {subEntries.map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/${locale}/knowledge/${entry.slug}`}
                      className="group rounded-lg border border-(--border) bg-(--bg-surface) p-4 transition-colors hover:border-(--border-hover)"
                    >
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-(--text-1) group-hover:text-(--accent)">
                        {getLocalizedTitle(entry)}
                      </p>
                      <p className="mt-2 text-xs text-(--text-3)">
                        {entry.authorDisplayName ?? entry.authorUsername}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right sidebar: trending skills + platform pulse */}
            <div className="space-y-4">
              {/* Trending Skills */}
              <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-4">
                <h3 className="mb-3 text-xs font-mono font-medium uppercase tracking-wider text-(--text-3)">
                  {t("popularSkills")}
                </h3>
                <div className="space-y-2.5">
                  {popularSkills.length > 0
                    ? popularSkills.slice(0, 4).map((skill, i) => (
                        <Link
                          key={skill.id}
                          href={`/${locale}/skills/${skill.slug}`}
                          className="group flex items-center gap-2.5"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-(--bg-elevated) text-xs font-mono text-(--text-3)">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-(--text-1) group-hover:text-(--accent)">
                              {skill.name}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs tabular-nums text-(--text-3)">
                            {skill.downloads.toLocaleString()}
                          </span>
                        </Link>
                      ))
                    : <p className="text-xs text-(--text-3)">--</p>}
                </div>
              </div>

              {/* Platform pulse — compact stats */}
              <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-4">
                <h3 className="mb-3 text-xs font-mono font-medium uppercase tracking-wider text-(--text-3)">
                  PLATFORM
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <PulseStat
                    value={stats.totalEntries}
                    label={t("statNewEntries")}
                  />
                  <PulseStat
                    value={stats.totalSkills}
                    label={t("statNewSkills")}
                  />
                  <PulseStat
                    value={stats.totalUsers}
                    label={t("statNewUsers")}
                  />
                  <PulseStat
                    value={stats.totalVotes}
                    label={t("statTotalVotes")}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* Hero Stats */}
      <ScrollFadeIn>
        <HeroStats />
      </ScrollFadeIn>

      {/* ============================================================
          Three-column widget grid
          ============================================================ */}
      <div className="grid gap-6 lg:grid-cols-3">
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
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--accent-muted) text-(--accent)">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-(--text-1) group-hover:text-(--accent)">
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
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--accent-muted) text-(--accent)">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-(--text-1) group-hover:text-(--accent)">
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
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--bg-elevated) text-(--text-2)">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-(--text-1) group-hover:text-(--accent)">
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
      </div>
    </div>
  );
}

function PulseStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold tabular-nums text-(--text-1)">
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-(--text-3)">{label}</p>
    </div>
  );
}
