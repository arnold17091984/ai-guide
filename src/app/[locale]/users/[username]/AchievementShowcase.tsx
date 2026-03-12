"use client";

import { motion } from "framer-motion";
import { DURATION, EASE_APPLE, staggerContainer, fadeUp } from "@/lib/motion";
import type { ProfileAchievement } from "./actions";

// ============================================================
// AchievementShowcase — Grid of unlocked achievement badges
// ============================================================

const tierColors: Record<string, string> = {
  bronze: "from-amber-600 to-orange-700",
  silver: "from-slate-300 to-gray-400",
  gold: "from-yellow-400 to-amber-500",
  platinum: "from-cyan-400 to-blue-500",
};

const tierBorder: Record<string, string> = {
  bronze: "border-amber-400/40",
  silver: "border-gray-300/40",
  gold: "border-yellow-400/40",
  platinum: "border-cyan-400/40",
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
          className={`flex flex-col items-center gap-2 rounded-xl border bg-white/50 p-3 text-center backdrop-blur-sm dark:bg-white/5 ${
            tierBorder[ach.tier] ?? "border-(--border)"
          }`}
          title={ach.nameKey}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br ${
              tierColors[ach.tier] ?? "from-gray-400 to-gray-500"
            } text-white shadow-sm`}
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
