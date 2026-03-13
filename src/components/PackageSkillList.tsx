"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { EASE_APPLE, DURATION } from "@/lib/motion";

// ============================================================
// PackageSkillList
// ============================================================
// Ordered list of skills in a package. Shows drag handles in edit mode.

export interface PackageSkillItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  currentVersion: string;
  stars: number;
  downloads: number;
  order: number;
}

interface PackageSkillListProps {
  skills: PackageSkillItem[];
  locale: string;
  editMode?: boolean;
  onRemove?: (skillId: string) => void;
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

function GripIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="18" r="1" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PackageSkillList({
  skills,
  locale,
  editMode = false,
  onRemove,
}: PackageSkillListProps) {
  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-(--border) py-12 text-center">
        <p className="text-(--text-2)">No skills in this package yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-(--border) overflow-hidden rounded-lg border border-(--border)">
      {skills.map((skill, index) => (
        <motion.div
          key={skill.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: DURATION.normal,
            ease: EASE_APPLE,
            delay: index * 0.03,
          }}
          className="flex items-center gap-4 bg-(--bg-surface) px-4 py-3 transition-colors hover:bg-(--bg-elevated)"
        >
          {/* Drag handle (edit mode) */}
          {editMode && (
            <span className="cursor-grab text-(--text-2) active:cursor-grabbing">
              <GripIcon />
            </span>
          )}

          {/* Order number */}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-(--bg-elevated) text-xs font-semibold text-(--text-2)">
            {index + 1}
          </span>

          {/* Skill info */}
          <div className="min-w-0 flex-1">
            <Link
              href={`/${locale}/skills/${skill.slug}`}
              className="text-sm font-medium text-(--text-1) transition-colors hover:text-(--accent)"
            >
              {skill.name}
            </Link>
            <p className="line-clamp-1 text-xs text-(--text-2)">
              {skill.description}
            </p>
          </div>

          {/* Version */}
          <span className="hidden shrink-0 rounded border border-(--border) bg-(--bg-elevated) px-2 py-0.5 font-mono text-xs text-(--text-2) sm:inline">
            v{skill.currentVersion}
          </span>

          {/* Stats */}
          <div className="hidden shrink-0 items-center gap-3 text-xs text-(--text-2) sm:flex">
            <span className="flex items-center gap-1">
              <StarIcon />
              {formatCount(skill.stars)}
            </span>
            <span className="flex items-center gap-1">
              <DownloadIcon />
              {formatCount(skill.downloads)}
            </span>
          </div>

          {/* Remove button (edit mode) */}
          {editMode && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(skill.id)}
              className="shrink-0 rounded-lg p-1.5 text-(--text-2) transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
              aria-label="Remove skill"
            >
              <XIcon />
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
}
