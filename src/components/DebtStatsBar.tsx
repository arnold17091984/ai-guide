"use client";

import { motion } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";

interface DebtStatsBarProps {
  stats: {
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    total: number;
    resolutionRate: number;
  };
  translations: {
    open: string;
    inProgress: string;
    resolved: string;
    total: string;
    resolutionRate: string;
    missing: string;
    outdated: string;
    incomplete: string;
    inaccurate: string;
  };
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DURATION.medium,
      ease: EASE_APPLE,
      delay: i * 0.08,
    },
  }),
};

function StatCard({
  label,
  value,
  color,
  index,
}: {
  label: string;
  value: number | string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-(--border) shadow-md rounded-2xl p-4"
    >
      <p className="text-sm text-(--text-2)">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </motion.div>
  );
}

function CategoryDot({ color }: { color: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}

export default function DebtStatsBar({
  stats,
  translations: t,
}: DebtStatsBarProps) {
  return (
    <div className="space-y-4">
      {/* Main stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={t.open}
          value={stats.byStatus.open ?? 0}
          color="text-amber-600 dark:text-amber-400"
          index={0}
        />
        <StatCard
          label={t.inProgress}
          value={stats.byStatus.in_progress ?? 0}
          color="text-blue-600 dark:text-blue-400"
          index={1}
        />
        <StatCard
          label={t.resolved}
          value={stats.byStatus.resolved ?? 0}
          color="text-green-600 dark:text-green-400"
          index={2}
        />
        <StatCard
          label={t.resolutionRate}
          value={`${stats.resolutionRate}%`}
          color="text-(--text-1)"
          index={3}
        />
      </div>

      {/* Category breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.medium, ease: EASE_APPLE, delay: 0.3 }}
        className="flex flex-wrap gap-4 text-sm text-(--text-2)"
      >
        <span className="flex items-center gap-1.5">
          <CategoryDot color="bg-red-500" />
          {t.missing}: {stats.byCategory.missing ?? 0}
        </span>
        <span className="flex items-center gap-1.5">
          <CategoryDot color="bg-amber-500" />
          {t.outdated}: {stats.byCategory.outdated ?? 0}
        </span>
        <span className="flex items-center gap-1.5">
          <CategoryDot color="bg-blue-500" />
          {t.incomplete}: {stats.byCategory.incomplete ?? 0}
        </span>
        <span className="flex items-center gap-1.5">
          <CategoryDot color="bg-purple-500" />
          {t.inaccurate}: {stats.byCategory.inaccurate ?? 0}
        </span>
      </motion.div>
    </div>
  );
}
