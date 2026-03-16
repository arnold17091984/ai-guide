import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import AchievementCard from "@/components/AchievementCard";
import { getCurrentUser } from "@/lib/auth";
import {
  getAllAchievements,
  getUserAchievements,
} from "@/lib/reputation/actions";
import type { UserAchievementWithDetails } from "@/lib/reputation/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string }>;
}

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function BadgeIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Category grouping
// ---------------------------------------------------------------------------

const CATEGORY_ORDER = ["contribution", "quality", "social", "milestone"] as const;

function groupByCategory<T extends { category: string }>(
  items: T[],
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AchievementsPage({ params }: PageProps) {
  await params;

  let allAchievements: Awaited<ReturnType<typeof getAllAchievements>> = [];
  const [t, currentUser] = await Promise.all([
    getTranslations("community"),
    getCurrentUser(),
  ]);
  try {
    allAchievements = await getAllAchievements();
  } catch {
    // DB not available — render empty state
  }

  // Build user's unlock map
  let userAchMap = new Map<string, UserAchievementWithDetails>();
  if (currentUser) {
    try {
      const userAchs = await getUserAchievements(currentUser.id);
      userAchMap = new Map(userAchs.map((a) => [a.slug, a]));
    } catch {
      // DB not available
    }
  }

  const grouped = groupByCategory(allAchievements);

  const categoryLabels: Record<string, string> = {
    contribution: t("achievements.categoryContribution"),
    quality: t("achievements.categoryQuality"),
    social: t("achievements.categorySocial"),
    milestone: t("achievements.categoryMilestone"),
  };

  return (
    <>
      <PageHeader
        title={t("achievements.title")}
        subtitle={t("achievements.subtitle")}
        gradient=""
        icon={<BadgeIcon />}
      />

      {CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;

        return (
          <section key={cat} className="mb-10">
            <ScrollFadeIn>
              <h2 className="mb-4 text-lg font-semibold text-(--text-1)">
                {categoryLabels[cat] ?? cat}
              </h2>
            </ScrollFadeIn>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((achievement, i) => {
                const userAch = userAchMap.get(achievement.slug);
                const isUnlocked = !!userAch?.unlockedAt;
                const progress = userAch?.progress ?? 0;

                return (
                  <ScrollFadeIn key={achievement.id} delay={i * 0.05}>
                    <AchievementCard
                      name={t(`achievements.badge.${toCamelSlug(achievement.slug)}` as never)}
                      description={t(`achievements.badge.${toCamelSlug(achievement.slug)}Desc` as never)}
                      iconName={achievement.iconName}
                      tier={achievement.tier}
                      isUnlocked={isUnlocked}
                      isSecret={achievement.isSecret}
                      progress={progress}
                      requiredValue={achievement.requiredValue}
                      unlockCount={achievement.unlockCount}
                      secretLabel={t("achievements.secret")}
                      unlockedLabel={t("achievements.unlocked")}
                      lockedLabel={t("achievements.locked")}
                      progressLabel={t("achievements.progress")}
                    />
                  </ScrollFadeIn>
                );
              })}
            </div>
          </section>
        );
      })}

      {allAchievements.length === 0 && (
        <ScrollFadeIn>
          <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-12 text-center">
            <p className="text-(--text-2)">{t("achievements.empty")}</p>
          </div>
        </ScrollFadeIn>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert "first-entry" to "firstEntry" for i18n key lookup */
function toCamelSlug(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
