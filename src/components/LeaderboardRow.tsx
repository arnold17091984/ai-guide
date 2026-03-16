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
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-400">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-500/20 text-sm font-bold text-zinc-400">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 text-sm font-bold text-orange-400">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-(--bg-elevated) text-sm font-semibold text-(--text-2)">
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
      className="h-10 w-10 rounded-full bg-(--bg-elevated) p-1.5 text-(--text-3)"
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
        backgroundColor: "var(--bg-elevated)",
        transition: { duration: DURATION.fast, ease: EASE_APPLE },
      }}
    >
      <Link
        href={`/${locale}/users/${username}`}
        className={`flex items-center gap-4 border-b border-(--border) px-4 py-3 transition-colors last:border-b-0 ${
          isCurrentUser
            ? "border-l-2 border-l-(--accent) bg-(--accent-muted)"
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
