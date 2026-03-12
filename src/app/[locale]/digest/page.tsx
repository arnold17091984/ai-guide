import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import DigestCard from "@/components/DigestCard";
import { getLatestDigest } from "@/lib/digest/actions";
import type {
  DigestTopEntry,
  DigestTopSkill,
  DigestTopContributor,
  DigestStats,
} from "@/lib/db/schema/digests";

export default async function DigestPage() {
  const t = await getTranslations("digest");
  const digest = await getLatestDigest();

  const topEntries = (digest?.topEntries ?? []) as DigestTopEntry[];
  const topSkills = (digest?.topSkills ?? []) as DigestTopSkill[];
  const topContributors = (digest?.topContributors ?? []) as DigestTopContributor[];
  const stats = (digest?.stats ?? {
    newEntries: 0,
    newSkills: 0,
    newUsers: 0,
    totalVotes: 0,
    totalComments: 0,
  }) as DigestStats;

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        gradient="from-indigo-500 to-violet-500"
        icon={
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        }
      />

      {/* Platform stats summary */}
      <ScrollFadeIn>
        <h2 className="mb-4 text-xl font-semibold text-(--text-1)">
          {t("platformStats")}
        </h2>
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatBadge label={t("stats.newEntries")} value={stats.newEntries} />
          <StatBadge label={t("stats.newSkills")} value={stats.newSkills} />
          <StatBadge label={t("stats.newUsers")} value={stats.newUsers} />
          <StatBadge label={t("stats.totalVotes")} value={stats.totalVotes} />
          <StatBadge label={t("stats.totalComments")} value={stats.totalComments} />
        </div>
      </ScrollFadeIn>

      {/* Top entries */}
      <ScrollFadeIn>
        <h2 className="mb-4 text-xl font-semibold text-(--text-1)">
          {t("topEntries")}
        </h2>
        <div className="mb-12 space-y-3">
          {topEntries.length > 0 ? (
            topEntries.map((entry, i) => (
              <DigestCard
                key={entry.id}
                rank={i + 1}
                title={entry.title}
                metric={entry.voteCount}
                metricLabel={t("stats.totalVotes")}
                href={`/knowledge/${entry.slug}`}
                type="entry"
              />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </ScrollFadeIn>

      {/* Top skills */}
      <ScrollFadeIn>
        <h2 className="mb-4 text-xl font-semibold text-(--text-1)">
          {t("topSkills")}
        </h2>
        <div className="mb-12 space-y-3">
          {topSkills.length > 0 ? (
            topSkills.map((skill, i) => (
              <DigestCard
                key={skill.id}
                rank={i + 1}
                title={skill.name}
                metric={skill.downloads}
                metricLabel={t("stats.newSkills")}
                href={`/skills/${skill.slug}`}
                type="skill"
              />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </ScrollFadeIn>

      {/* Top contributors */}
      <ScrollFadeIn>
        <h2 className="mb-4 text-xl font-semibold text-(--text-1)">
          {t("topContributors")}
        </h2>
        <div className="mb-12 space-y-3">
          {topContributors.length > 0 ? (
            topContributors.map((user, i) => (
              <DigestCard
                key={user.id}
                rank={i + 1}
                title={user.displayName ?? user.username}
                author={`@${user.username}`}
                metric={user.reputation}
                metricLabel={t("topContributors")}
                href={`/profile/${user.username}`}
                type="contributor"
              />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </ScrollFadeIn>

      {/* Week navigation */}
      <ScrollFadeIn>
        <div className="flex items-center justify-between rounded-2xl border border-(--border) bg-white/70 p-4 backdrop-blur-xl dark:bg-white/5">
          <span className="text-sm text-(--text-2)">
            {t("thisWeek")}
          </span>
        </div>
      </ScrollFadeIn>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-(--border) bg-white/70 p-4 text-center backdrop-blur-xl dark:bg-white/5">
      <p className="text-2xl font-bold text-(--text-1)">{value.toLocaleString()}</p>
      <p className="text-xs text-(--text-2)">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-(--border) p-8 text-center text-sm text-(--text-2)">
      --
    </div>
  );
}
