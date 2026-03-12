"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import type { SkillCategory } from "@/lib/skill-registry/types";

// ============================================================
// SkillCard
// ============================================================
// Glassmorphism card for the skill registry browse page.
// Displays name, description, category badge, version,
// star count, download count, and author.
// ============================================================

export interface SkillCardEntry {
  id: string;
  slug: string;
  name: string;
  description: string;
  currentVersion: string;
  stars: number;
  downloads: number;
  tags: string[];
  authorName: string | null;
  authorUsername: string;
  publishedAt: Date | null;
}

interface SkillCardProps {
  entry: SkillCardEntry;
  locale: string;
}

// ---------------------------------------------------------------------------
// Category badge colors
// ---------------------------------------------------------------------------

const CATEGORY_STYLES: Record<string, string> = {
  workflow:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "code-generation":
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  testing:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  documentation:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  security:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  devops:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  refactoring:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  debugging:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  review:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  other:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const SKILL_CATEGORIES: SkillCategory[] = [
  "workflow",
  "code-generation",
  "testing",
  "documentation",
  "security",
  "devops",
  "refactoring",
  "debugging",
  "review",
  "other",
];

function detectCategory(tags: string[]): SkillCategory | null {
  for (const tag of tags) {
    if (SKILL_CATEGORIES.includes(tag as SkillCategory)) {
      return tag as SkillCategory;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authorInitials(name: string | null, username: string): string {
  const src = name ?? username ?? "?";
  return src
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SkillCard({ entry, locale }: SkillCardProps) {
  const {
    slug,
    name,
    description,
    currentVersion,
    stars,
    downloads,
    tags,
    authorName,
    authorUsername,
  } = entry;

  const href = `/${locale}/skills/${slug}`;
  const category = detectCategory(tags);
  const truncatedDesc =
    description && description.length > 140
      ? description.slice(0, 140) + "…"
      : description;

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
            {category && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[category] ?? CATEGORY_STYLES.other}`}
              >
                {category}
              </span>
            )}
            <span className="ml-auto rounded-full border border-(--border) bg-(--surface)/60 px-2 py-0.5 font-mono text-xs text-(--text-2)">
              v{currentVersion}
            </span>
          </div>

          {/* --- Name --- */}
          <h2 className="line-clamp-1 text-base font-semibold leading-snug text-(--text-1) transition-colors group-hover:text-(--primary)">
            {name}
          </h2>

          {/* --- Description --- */}
          {truncatedDesc && (
            <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-(--text-2)">
              {truncatedDesc}
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
                {authorName ?? authorUsername}
              </span>
            </div>

            {/* Stats: stars + downloads */}
            <div className="flex shrink-0 items-center gap-3 text-xs text-(--text-2)">
              <span className="flex items-center gap-1">
                <StarIcon filled />
                {formatCount(stars)}
              </span>
              <span className="flex items-center gap-1">
                <DownloadIcon />
                {formatCount(downloads)}
              </span>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
