import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getUserSkillsForProfile } from "@/lib/skills/user-skill-actions";

// ============================================================
// ProfileSkillBadges — Server Component
// Displays a user's completed and in-progress skills as pills.
// Returns null when the user has no skills to keep profiles clean.
// ============================================================

interface Props {
  userId: string;
}

export default async function ProfileSkillBadges({ userId }: Props) {
  const [{ completed, inProgress }, locale, t] = await Promise.all([
    getUserSkillsForProfile(userId),
    getLocale(),
    getTranslations("mySkills"),
  ]);

  if (completed.length === 0 && inProgress.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface) p-6">
      {/* Summary line */}
      <p className="mb-4 text-sm text-(--text-2)">
        <span className="font-semibold text-(--text-1)">{completed.length}</span>{" "}
        {t("stats.completed").toLowerCase()}
        {inProgress.length > 0 && (
          <>
            {", "}
            <span className="font-semibold text-(--text-1)">{inProgress.length}</span>{" "}
            {t("stats.inProgress").toLowerCase()}
          </>
        )}
      </p>

      {/* Skill pills */}
      <div className="flex flex-wrap gap-2">
        {completed.map((skill) => (
          <Link
            key={skill.skillId}
            href={`/${locale}/skills/${skill.skillSlug}`}
            className="bg-(--accent-muted) text-(--accent) rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80"
          >
            {skill.skillName}
          </Link>
        ))}
        {inProgress.map((skill) => (
          <Link
            key={skill.skillId}
            href={`/${locale}/skills/${skill.skillSlug}`}
            className="border border-(--border) text-(--text-2) rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80"
          >
            {skill.skillName}
          </Link>
        ))}
      </div>
    </div>
  );
}
