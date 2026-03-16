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
          y: -2,
          transition: { duration: DURATION.normal, ease: EASE_APPLE },
        }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface) p-5 shadow-sm transition-all duration-300 hover:border-(--border-hover)"
      >
        <div className="flex items-center gap-4">
          {/* Rank */}
          {rank !== undefined && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-(--bg-elevated) text-sm font-bold text-(--text-1) font-mono">
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
                className="h-12 w-12 rounded-lg object-cover ring-1 ring-(--border)"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-(--bg-elevated) text-lg font-bold text-(--text-1)">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            {isVerified && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-(--accent) ring-1 ring-(--bg-base)">
                <svg
                  className="h-2.5 w-2.5 text-black"
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
            <span className="block truncate text-xs text-(--text-3)">
              @{username}
            </span>
          </div>

          {/* Right stats */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            <ReputationBadge reputation={reputation} />
            {entriesCount !== undefined && (
              <span className="text-xs tabular-nums text-(--text-3)">
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
