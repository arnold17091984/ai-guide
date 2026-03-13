"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import type { CaseStudyListItem } from "@/lib/db/queries/case-studies";

interface CaseStudyCardProps {
  study: CaseStudyListItem;
}

// ============================================================
// Helpers
// ============================================================

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(
    new Date(date),
  );
}

/** Estimate reading time from summary length. */
function estimateReadTime(summary: string | null): number {
  if (!summary) return 3;
  const words = summary.trim().split(/\s+/).length;
  // avg 200 wpm; multiply by 10 to account for full body
  return Math.max(3, Math.round((words * 10) / 200));
}

// ============================================================
// TeamSizeBadge
// ============================================================

function TeamSizeBadge({ size }: { size: number | null }) {
  if (!size) return null;

  let label: string;
  let colorClass: string;

  if (size === 1) {
    label = "Solo";
    colorClass = "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
  } else if (size <= 5) {
    label = `${size} people`;
    colorClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  } else if (size <= 20) {
    label = `${size} people`;
    colorClass = "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300";
  } else {
    label = `${size}+ people`;
    colorClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {/* People icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3 w-3"
        aria-hidden="true"
      >
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
      {label}
    </span>
  );
}

// ============================================================
// CaseStudyCard
// ============================================================

export default function CaseStudyCard({ study }: CaseStudyCardProps) {
  const locale = useLocale();
  const href = `/${locale}/case-studies/${study.slug}`;
  const readTime = estimateReadTime(study.summary);

  return (
    <Link href={href} className="block">
      <motion.article
        whileHover={{
          y: -6,
          transition: { duration: DURATION.normal, ease: EASE_APPLE },
        }}
        whileTap={{ scale: 0.98 }}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-6 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-violet-300/50 hover:shadow-xl hover:shadow-violet-500/15 dark:bg-white/5 dark:hover:border-violet-500/30 dark:hover:shadow-violet-500/10"
      >
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-br from-violet-500/8 via-purple-500/5 to-fuchsia-500/8" />

        <div className="relative z-10 flex h-full flex-col">
          {/* Top badges row */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {study.categoryLabel && (
              <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                {study.categoryLabel}
              </span>
            )}
            {study.industry && (
              <span className="inline-flex items-center gap-1 rounded-full bg-(--surface-hover) px-2.5 py-0.5 text-xs font-medium text-(--text-2)">
                {/* Building icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3 w-3"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                    clipRule="evenodd"
                  />
                </svg>
                {study.industry}
              </span>
            )}
            {study.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {/* Star icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3 w-3"
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-2 text-base font-semibold leading-snug text-(--text-1) line-clamp-2 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors duration-200">
            {study.title ?? "Untitled"}
          </h3>

          {/* Summary */}
          {study.summary && (
            <p className="mb-4 flex-1 text-sm leading-relaxed text-(--text-2) line-clamp-3">
              {study.summary}
            </p>
          )}

          {/* Team size */}
          <div className="mb-4">
            <TeamSizeBadge size={study.teamSize} />
            {study.projectDurationWeeks && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-(--text-2)">
                {/* Clock icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3 w-3"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                {study.projectDurationWeeks}w
              </span>
            )}
          </div>

          {/* Footer: author + meta */}
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Author avatar */}
              {study.authorAvatar ? (
                <img
                  src={study.authorAvatar}
                  alt={study.authorName ?? study.authorUsername ?? ""}
                  className="h-6 w-6 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-200 dark:bg-violet-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <span className="text-xs text-(--text-2) truncate max-w-[100px]">
                {study.authorName ?? study.authorUsername ?? "Unknown"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-(--text-2)">
              {/* Read time */}
              <span className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3 w-3"
                  aria-hidden="true"
                >
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                {readTime}min
              </span>

              {/* Date */}
              {study.publishedAt && (
                <time dateTime={new Date(study.publishedAt).toISOString()}>
                  {formatDate(study.publishedAt)}
                </time>
              )}
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
