"use client";

import { motion } from "framer-motion";
import { DURATION, EASE_APPLE, staggerContainer, fadeUp } from "@/lib/motion";
import type { ProfileAchievement } from "./actions";

// ============================================================
// AchievementShowcase — Grid of unlocked achievement badges
// ============================================================

const tierIconColor: Record<string, string> = {
  bronze: "text-amber-600",
  silver: "text-zinc-400",
  gold: "text-amber-400",
  platinum: "text-(--accent)",
};

const tierBorder: Record<string, string> = {
  bronze: "border-l-amber-700",
  silver: "border-l-zinc-400",
  gold: "border-l-amber-400",
  platinum: "border-l-emerald-400",
};

interface AchievementShowcaseProps {
  achievements: ProfileAchievement[];
}

export default function AchievementShowcase({
  achievements,
}: AchievementShowcaseProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-3 sm:grid-cols-6"
    >
      {achievements.map((ach) => (
        <motion.div
          key={ach.id}
          variants={fadeUp}
          whileHover={{
            scale: 1.08,
            transition: { duration: DURATION.fast, ease: EASE_APPLE },
          }}
          className={`flex flex-col items-center gap-2 rounded-lg border border-(--border) border-l-2 bg-(--bg-surface) p-3 text-center ${
            tierBorder[ach.tier] ?? "border-l-(--border)"
          }`}
          title={ach.nameKey}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-md bg-(--bg-elevated) ${
              tierIconColor[ach.tier] ?? "text-(--text-2)"
            }`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <span className="text-[10px] font-medium leading-tight text-(--text-2)">
            {ach.slug.replace(/-/g, " ")}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}
