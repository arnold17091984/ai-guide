"use client";

import { motion } from "framer-motion";
import { fadeIn, DURATION, EASE_APPLE } from "@/lib/motion";

// ============================================================
// Reputation level definitions
// ============================================================

interface ReputationLevel {
  name: string;
  minScore: number;
  className: string;
  iconPath: string;
}

const LEVELS: ReputationLevel[] = [
  {
    name: "Sage",
    minScore: 15000,
    className:
      "bg-linear-to-r from-cyan-400 to-blue-400 text-white border-cyan-300/40",
    iconPath:
      "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  },
  {
    name: "Master",
    minScore: 5000,
    className:
      "bg-amber-50 text-amber-700 border-amber-300/60 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-500/40",
    iconPath:
      "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
  {
    name: "Expert",
    minScore: 2000,
    className:
      "bg-purple-50 text-purple-700 border-purple-300/60 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-500/40",
    iconPath:
      "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    name: "Practitioner",
    minScore: 500,
    className:
      "bg-blue-50 text-blue-700 border-blue-300/60 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500/40",
    iconPath:
      "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
  {
    name: "Apprentice",
    minScore: 100,
    className:
      "bg-green-50 text-green-700 border-green-300/60 dark:bg-green-900/20 dark:text-green-400 dark:border-green-500/40",
    iconPath:
      "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.746 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    name: "Novice",
    minScore: 0,
    className:
      "bg-gray-50 text-gray-600 border-gray-300/60 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-600/40",
    iconPath:
      "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
];

function getLevel(reputation: number): ReputationLevel {
  for (const level of LEVELS) {
    if (reputation >= level.minScore) {
      return level;
    }
  }
  return LEVELS[LEVELS.length - 1];
}

// ============================================================
// Component
// ============================================================

interface ReputationBadgeProps {
  reputation: number;
  showScore?: boolean;
}

export default function ReputationBadge({
  reputation,
  showScore = false,
}: ReputationBadgeProps) {
  const level = getLevel(reputation);

  return (
    <motion.span
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.05,
        transition: { duration: DURATION.fast, ease: EASE_APPLE },
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${level.className}`}
    >
      <svg
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={level.iconPath} />
      </svg>
      {level.name}
      {showScore && (
        <span className="opacity-70">· {reputation.toLocaleString()}</span>
      )}
    </motion.span>
  );
}
