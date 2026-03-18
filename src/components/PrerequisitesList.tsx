import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSkillPrerequisites } from "@/lib/skills/prerequisite-queries";

interface PrerequisitesListProps {
  skillId: string;
  userId?: string;
  locale: string;
}

export default async function PrerequisitesList({
  skillId,
  userId,
  locale,
}: PrerequisitesListProps) {
  const [prerequisites, t] = await Promise.all([
    getSkillPrerequisites(skillId, userId),
    getTranslations("prerequisites"),
  ]);

  if (prerequisites.length === 0) return null;

  return (
    <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-4">
      <h3 className="mb-3 text-xs font-mono font-medium uppercase tracking-wider text-(--text-3)">
        {t("title")}
      </h3>
      <div className="space-y-2">
        {prerequisites.map((prereq) => (
          <div key={prereq.id} className="flex items-center gap-2">
            {prereq.isCompleted ? (
              <span className="text-(--accent)">&#10003;</span>
            ) : (
              <span className="text-(--text-3)">&#9675;</span>
            )}
            <Link
              href={`/${locale}/skills/${prereq.slug}`}
              className="text-sm text-(--text-1) hover:text-(--accent)"
            >
              {prereq.name}
            </Link>
            <span className="text-xs text-(--text-3)">
              {prereq.isCompleted ? t("completed") : t("notCompleted")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
