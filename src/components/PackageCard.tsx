"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { EASE_APPLE, DURATION } from "@/lib/motion";

// ============================================================
// PackageCard
// ============================================================
// Glassmorphism card for skill package listings.

export interface PackageCardEntry {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName: string | null;
  tags: string[];
  skillCount: number;
  starCount: number;
  installCount: number;
  authorName: string | null;
  authorUsername: string;
}

interface PackageCardProps {
  entry: PackageCardEntry;
  locale: string;
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function StarIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="currentColor"
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

function LayersIcon() {
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
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16.5 9.4l-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
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

export default function PackageCard({ entry, locale }: PackageCardProps) {
  const {
    slug,
    name,
    description,
    tags,
    skillCount,
    starCount,
    installCount,
    authorName,
    authorUsername,
  } = entry;

  const href = `/${locale}/skills/packages/${slug}`;
  const truncatedDesc =
    description && description.length > 140
      ? description.slice(0, 140) + "..."
      : description;

  return (
    <Link href={href} className="group block h-full focus:outline-none">
      <motion.article
        whileHover={{
          y: -5,
          transition: { duration: DURATION.normal, ease: EASE_APPLE },
        }}
        whileTap={{ scale: 0.98 }}
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-emerald-300/50 hover:shadow-lg hover:shadow-emerald-500/10 dark:bg-white/5 dark:hover:border-teal-500/30 dark:hover:shadow-teal-500/10"
      >
        {/* Hover gradient overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-br from-emerald-500/8 via-teal-500/4 to-cyan-500/8" />

        <div className="relative z-10 flex h-full flex-col gap-3">
          {/* --- Icon + Name row --- */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 text-white">
              <PackageIcon />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-1 text-base font-semibold leading-snug text-(--text-1) transition-colors group-hover:text-(--primary)">
                {name}
              </h2>
              <p className="mt-0.5 text-xs text-(--text-2)">
                {skillCount} skills
              </p>
            </div>
          </div>

          {/* --- Description --- */}
          {truncatedDesc && (
            <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-(--text-2)">
              {truncatedDesc}
            </p>
          )}

          {/* --- Tags --- */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-(--border) bg-(--surface)/60 px-2 py-0.5 text-xs text-(--text-2)"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="rounded-full border border-(--border) bg-(--surface)/60 px-2 py-0.5 text-xs text-(--text-2)">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* --- Footer --- */}
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-(--border) pt-3">
            {/* Author */}
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-500 text-xs font-bold text-white">
                {authorInitials(authorName, authorUsername)}
              </div>
              <span className="truncate text-xs text-(--text-2)">
                {authorName ?? authorUsername}
              </span>
            </div>

            {/* Stats */}
            <div className="flex shrink-0 items-center gap-3 text-xs text-(--text-2)">
              <span className="flex items-center gap-1">
                <StarIcon />
                {formatCount(starCount)}
              </span>
              <span className="flex items-center gap-1">
                <DownloadIcon />
                {formatCount(installCount)}
              </span>
              <span className="flex items-center gap-1">
                <LayersIcon />
                {skillCount}
              </span>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
