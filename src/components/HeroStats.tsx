import { getDashboardStats } from "@/lib/dashboard/actions";
import { getTranslations } from "next-intl/server";
import HeroStatsClient from "./HeroStatsClient";

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
    {
      label: t("heroStats.entries"),
      value: stats.totalEntries,
      icon: "entries" as const,
    },
    {
      label: t("heroStats.skills"),
      value: stats.totalSkills,
      icon: "skills" as const,
    },
    {
      label: t("heroStats.contributors"),
      value: stats.totalUsers,
      icon: "contributors" as const,
    },
    {
      label: t("heroStats.discussions"),
      value: stats.totalVotes,
      icon: "discussions" as const,
    },
  ];

  return <HeroStatsClient items={items} />;
}
