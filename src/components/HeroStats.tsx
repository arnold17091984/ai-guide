import { getDashboardStats } from "@/lib/dashboard/actions";
import { getTranslations } from "next-intl/server";
import HeroStatsClient from "./HeroStatsClient";

export default async function HeroStats() {
  const stats = await getDashboardStats();
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
