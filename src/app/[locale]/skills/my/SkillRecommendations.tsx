import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { RecommendedSkill } from "@/lib/skills/recommendation-queries";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SkillRecommendationsProps {
  recommendations: RecommendedSkill[];
  locale: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default async function SkillRecommendations({
  recommendations,
  locale,
}: SkillRecommendationsProps) {
  const t = await getTranslations("mySkills");

  const items = recommendations.slice(0, 4);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-(--text-1)">
          {t("recommendations.title")}
        </h2>
        <p className="mt-0.5 text-sm text-(--text-3)">
          {t("recommendations.subtitle")}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-(--text-2)">{t("recommendations.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((skill) => (
            <Link
              key={skill.id}
              href={`/${locale}/skills/${skill.slug}`}
              className="group rounded-lg border border-(--border) bg-(--bg-surface) p-4 transition-colors hover:border-(--accent)/40 hover:bg-(--bg-elevated)"
            >
              <p className="text-sm font-medium text-(--text-1) group-hover:text-(--accent) transition-colors">
                {skill.name}
              </p>
              {skill.description && (
                <p className="mt-1 line-clamp-2 text-xs text-(--text-3)">
                  {skill.description}
                </p>
              )}
              <p className="mt-3 text-xs text-(--text-3)">
                {skill.downloads.toLocaleString()} downloads
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
