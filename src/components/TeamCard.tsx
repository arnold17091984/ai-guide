"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";
import { DURATION, EASE_APPLE } from "@/lib/motion";

// ============================================================
// TeamCard — Glassmorphism card with team info
// ============================================================

interface TeamCardProps {
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  memberCount: number;
  isPublic: boolean;
  isJoined?: boolean;
  onJoin?: () => void;
}

export default function TeamCard({
  name,
  slug,
  description,
  avatarUrl,
  memberCount,
  isPublic,
  isJoined,
  onJoin,
}: TeamCardProps) {
  const locale = useLocale();
  const initial = name.charAt(0).toUpperCase();

  return (
    <motion.div
      whileHover={{
        y: -4,
        transition: { duration: DURATION.normal, ease: EASE_APPLE },
      }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-5 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-cyan-300/50 hover:shadow-xl hover:shadow-cyan-500/15 dark:bg-white/5 dark:hover:border-cyan-500/30 dark:hover:shadow-cyan-500/10"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-br from-cyan-500/10 via-blue-500/5 to-teal-500/10" />

      <div className="relative z-10">
        {/* Header: Avatar + Badge */}
        <div className="mb-3 flex items-start justify-between">
          <Link href={`/${locale}/teams/${slug}`} className="flex items-center gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                className="h-12 w-12 rounded-xl object-cover ring-2 ring-cyan-400/20"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-500 text-lg font-bold text-white ring-2 ring-cyan-400/20">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-(--text-1) group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {name}
              </h3>
              <span className="text-xs text-(--text-2)">/{slug}</span>
            </div>
          </Link>

          {/* Public/Private badge */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              isPublic
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            {isPublic ? (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            ) : (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            )}
            {isPublic ? "Public" : "Private"}
          </span>
        </div>

        {/* Description */}
        {description && (
          <p className="mb-3 line-clamp-2 text-sm text-(--text-2)">
            {description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-(--text-2)">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span>{memberCount} members</span>
          </div>

          {!isJoined && isPublic && onJoin && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onJoin();
              }}
              className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-cyan-600"
            >
              Join
            </button>
          )}

          {isJoined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Joined
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
