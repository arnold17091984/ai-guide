"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { DURATION, EASE_APPLE } from "@/lib/motion";
import ReputationBadge from "@/components/ReputationBadge";

// ============================================================
// UserCard — Compact card for leaderboard / search results
// ============================================================

interface UserCardProps {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputation: number;
  role: string;
  isVerified: boolean;
  entriesCount?: number;
  rank?: number;
}

export default function UserCard({
  username,
  displayName,
  avatarUrl,
  reputation,
  role,
  isVerified,
  entriesCount,
  rank,
}: UserCardProps) {
  const locale = useLocale();
  const name = displayName ?? username;

  return (
    <Link href={`/${locale}/users/${username}`}>
      <motion.div
        whileHover={{
          y: -4,
          transition: { duration: DURATION.normal, ease: EASE_APPLE },
        }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-5 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-blue-300/50 hover:shadow-xl hover:shadow-blue-500/15 dark:bg-white/5 dark:hover:border-cyan-500/30 dark:hover:shadow-cyan-500/10"
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-br from-blue-500/10 via-cyan-500/5 to-teal-500/10" />
        <div className="relative z-10 flex items-center gap-4">
          {/* Rank */}
          {rank !== undefined && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {rank}
            </span>
          )}

          {/* Avatar */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl object-cover ring-2 ring-blue-400/20"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 text-lg font-bold text-white ring-2 ring-blue-400/20">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            {isVerified && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 ring-1 ring-white dark:ring-slate-900">
                <svg
                  className="h-2.5 w-2.5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-(--text-1)">
                {name}
              </span>
            </div>
            <span className="block truncate text-xs text-(--text-2)">
              @{username}
            </span>
          </div>

          {/* Right stats */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            <ReputationBadge reputation={reputation} />
            {entriesCount !== undefined && (
              <span className="text-xs tabular-nums text-(--text-2)">
                {entriesCount.toLocaleString()}{" "}
                <span className="opacity-70">entries</span>
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
