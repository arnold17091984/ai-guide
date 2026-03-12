"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ReputationBadge from "@/components/ReputationBadge";
import { DURATION, EASE_APPLE } from "@/lib/motion";

// ============================================================
// Rank badge for top 3
// ============================================================

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-yellow-400 to-amber-500 text-sm font-bold text-white shadow-sm">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-slate-300 to-gray-400 text-sm font-bold text-white shadow-sm">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-amber-600 to-orange-700 text-sm font-bold text-white shadow-sm">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-(--text-2) dark:bg-gray-800">
      {rank}
    </span>
  );
}

// ============================================================
// Default avatar SVG
// ============================================================

function DefaultAvatar() {
  return (
    <svg
      className="h-10 w-10 rounded-full bg-gray-200 p-1.5 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

// ============================================================
// Component
// ============================================================

export interface LeaderboardRowProps {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputation: number;
  isCurrentUser: boolean;
  locale: string;
}

export default function LeaderboardRow({
  rank,
  userId,
  username,
  displayName,
  avatarUrl,
  reputation,
  isCurrentUser,
  locale,
}: LeaderboardRowProps) {
  return (
    <motion.div
      whileHover={{
        backgroundColor: "rgba(59, 130, 246, 0.04)",
        transition: { duration: DURATION.fast, ease: EASE_APPLE },
      }}
    >
      <Link
        href={`/${locale}/users/${username}`}
        className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-colors ${
          isCurrentUser
            ? "border border-blue-300/40 bg-blue-50/50 dark:border-cyan-500/20 dark:bg-cyan-900/10"
            : ""
        }`}
      >
        <RankBadge rank={rank} />

        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName ?? username}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <DefaultAvatar />
        )}

        {/* Name */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-(--text-1)">
            {displayName ?? username}
          </p>
          <p className="truncate text-sm text-(--text-2)">@{username}</p>
        </div>

        {/* Reputation */}
        <div className="flex items-center gap-3">
          <ReputationBadge reputation={reputation} />
          <span className="min-w-[4rem] text-right text-sm font-semibold tabular-nums text-(--text-2)">
            {reputation.toLocaleString()}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
