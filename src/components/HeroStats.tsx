import { getDashboardStats } from "@/lib/dashboard/actions";
import { getTranslations } from "next-intl/server";

export default async function HeroStats() {
  let stats: Awaited<ReturnType<typeof getDashboardStats>> = {
    totalEntries: 0,
    totalSkills: 0,
    totalUsers: 0,
    totalVotes: 0,
  };
  try {
    stats = await getDashboardStats();
  } catch {
    // DB not available — show zeroes
  }
  const t = await getTranslations("dashboard");

  const items = [
    { label: t("heroStats.entries"), value: stats.totalEntries },
    { label: t("heroStats.skills"), value: stats.totalSkills },
    { label: t("heroStats.contributors"), value: stats.totalUsers },
    { label: t("heroStats.discussions"), value: stats.totalVotes },
  ];

  return (
    <div className="border-t border-(--border) pt-4">
      <p className="text-sm text-(--text-3) font-mono">
        {items.map((item, i) => (
          <span key={item.label}>
            {i > 0 && <span className="mx-2">•</span>}
            <span>{item.value.toLocaleString()} {item.label}</span>
          </span>
        ))}
      </p>
    </div>
  );
}
