import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getMySkills, getMySkillStats } from "@/lib/skills/user-skill-actions";
import { getSkillRecommendations } from "@/lib/skills/recommendation-queries";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import MySkillsClient from "./MySkillsClient";
import SkillRecommendations from "./SkillRecommendations";
import AiLearningRecommendations from "@/components/AiLearningRecommendations";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function BookmarkIcon() {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function MySkillsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const locale = await getLocale();
  const t = await getTranslations("mySkills");

  let skills: Awaited<ReturnType<typeof getMySkills>> = [];
  let stats = { registered: 0, inProgress: 0, completed: 0 };
  let recommendations: Awaited<ReturnType<typeof getSkillRecommendations>> = [];

  try {
    [skills, stats, recommendations] = await Promise.all([
      getMySkills(),
      getMySkillStats(),
      getSkillRecommendations(user.id, 4),
    ]);
  } catch {
    // DB unavailable — render empty state
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={<BookmarkIcon />}
      />

      <div className="space-y-10">
        {/* Stats */}
        <ScrollFadeIn>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-4 text-center">
              <p className="text-2xl font-bold tabular-nums text-(--text-1)">
                {stats.registered}
              </p>
              <p className="mt-1 text-xs text-(--text-3)">
                {t("stats.registered")}
              </p>
            </div>
            <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-4 text-center">
              <p className="text-2xl font-bold tabular-nums text-(--text-1)">
                {stats.inProgress}
              </p>
              <p className="mt-1 text-xs text-(--text-3)">
                {t("stats.inProgress")}
              </p>
            </div>
            <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-4 text-center">
              <p className="text-2xl font-bold tabular-nums text-(--text-1)">
                {stats.completed}
              </p>
              <p className="mt-1 text-xs text-(--text-3)">
                {t("stats.completed")}
              </p>
            </div>
          </div>
        </ScrollFadeIn>

        {/* Skill list with filters */}
        <ScrollFadeIn delay={0.05}>
          <MySkillsClient skills={skills} locale={locale} />
        </ScrollFadeIn>

        {/* AI Learning Recommendations */}
        <ScrollFadeIn delay={0.1}>
          <AiLearningRecommendations />
        </ScrollFadeIn>

        {/* DB-based Recommendations */}
        {recommendations.length > 0 && (
          <ScrollFadeIn delay={0.15}>
            <SkillRecommendations
              recommendations={recommendations}
              locale={locale}
            />
          </ScrollFadeIn>
        )}
      </div>
    </>
  );
}
