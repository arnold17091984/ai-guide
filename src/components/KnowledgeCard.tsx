"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { EASE_APPLE, DURATION } from "@/lib/motion";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface KnowledgeCardEntry {
  slug: string;
  title: string | null;
  summary: string | null;
  contentType: string;
  difficultyLevel: string | null;
  readTimeMins: number | null;
  publishedAt: Date | null;
  authorName: string | null;
  authorUsername: string | null;
  categoryLabel?: string | null;
  categorySlug?: string | null;
  /** Optional vote aggregate – passed from server when available */
  voteScore?: number;
  /** Optional comment count – passed from server when available */
  commentCount?: number;
}

interface KnowledgeCardProps {
  entry: KnowledgeCardEntry;
  locale: string;
}

// -----------------------------------------------------------------------
// Inline SVG icons (avoids lucide-react dependency)
// -----------------------------------------------------------------------

function ClockIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ThumbUpIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// -----------------------------------------------------------------------
// Badge helpers
// -----------------------------------------------------------------------

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  intermediate:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  advanced:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const CONTENT_TYPE_STYLES: Record<string, string> = {
  article:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  tip: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  workflow:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  tutorial:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
};

function difficultyLabel(level: string | null): string {
  if (!level) return "";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function relativeDate(date: Date | null): string {
  if (!date) return "";
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function authorInitials(name: string | null, username: string | null): string {
  const src = name ?? username ?? "?";
  return src
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

export default function KnowledgeCard({ entry, locale }: KnowledgeCardProps) {
  const {
    slug,
    title,
    summary,
    contentType,
    difficultyLevel,
    readTimeMins,
    publishedAt,
    authorName,
    authorUsername,
    categoryLabel,
    voteScore = 0,
    commentCount = 0,
  } = entry;

  const href = `/${locale}/knowledge/${slug}`;
  const truncatedSummary =
    summary && summary.length > 150 ? summary.slice(0, 150) + "…" : summary;

  return (
    <Link href={href} className="group block h-full focus:outline-none">
      <motion.article
        whileHover={{
          y: -5,
          transition: { duration: DURATION.normal, ease: EASE_APPLE },
        }}
        whileTap={{ scale: 0.98 }}
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-500/10 dark:bg-white/5 dark:hover:border-cyan-500/30 dark:hover:shadow-cyan-500/10"
      >
        {/* Hover gradient overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-br from-blue-500/8 via-cyan-500/4 to-teal-500/8" />

        <div className="relative z-10 flex h-full flex-col gap-3">
          {/* --- Badge row --- */}
          <div className="flex flex-wrap items-center gap-2">
            {contentType && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CONTENT_TYPE_STYLES[contentType] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
              >
                {contentType}
              </span>
            )}
            {difficultyLevel && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[difficultyLevel] ?? "bg-gray-100 text-gray-700"}`}
              >
                {difficultyLabel(difficultyLevel)}
              </span>
            )}
            {categoryLabel && (
              <span className="ml-auto truncate rounded-full bg-indigo-100/70 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                {categoryLabel}
              </span>
            )}
          </div>

          {/* --- Title --- */}
          <h2 className="line-clamp-2 text-base font-semibold leading-snug text-(--text-1) group-hover:text-(--primary) transition-colors">
            {title ?? "Untitled"}
          </h2>

          {/* --- Summary --- */}
          {truncatedSummary && (
            <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-(--text-2)">
              {truncatedSummary}
            </p>
          )}

          {/* --- Footer --- */}
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-(--border) pt-3">
            {/* Author */}
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-cyan-500 text-xs font-bold text-white">
                {authorInitials(authorName, authorUsername)}
              </div>
              <span className="truncate text-xs text-(--text-2)">
                {authorName ?? authorUsername ?? "Unknown"}
              </span>
            </div>

            {/* Meta: read time · votes · comments · date */}
            <div className="flex shrink-0 items-center gap-3 text-xs text-(--text-2)">
              {readTimeMins != null && (
                <span className="flex items-center gap-1">
                  <ClockIcon />
                  {readTimeMins}m
                </span>
              )}
              <span className="flex items-center gap-1">
                <ThumbUpIcon />
                {voteScore}
              </span>
              <span className="flex items-center gap-1">
                <ChatIcon />
                {commentCount}
              </span>
              <span className="hidden sm:inline">{relativeDate(publishedAt)}</span>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
