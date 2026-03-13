"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import PriorityBadge from "./PriorityBadge";

// ============================================================
// Types
// ============================================================

export interface DebtItemCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  voteCount: number;
  commentCount: number;
  createdAt: Date;
  assigneeUsername: string | null;
  assigneeDisplayName: string | null;
  assigneeAvatar: string | null;
}

interface DebtItemCardProps {
  item: DebtItemCardData;
  locale: string;
  index?: number;
  translations: {
    vote: string;
    comments: string;
    priorityLabels: Record<string, string>;
    categoryLabels: Record<string, string>;
    statusLabels: Record<string, string>;
  };
  onVote?: (id: string) => void;
  hasVoted?: boolean;
}

// ============================================================
// Category styling
// ============================================================

const CATEGORY_COLORS: Record<string, string> = {
  missing: "text-red-500",
  outdated: "text-amber-500",
  incomplete: "text-blue-500",
  inaccurate: "text-purple-500",
};

const CATEGORY_BG: Record<string, string> = {
  missing: "bg-red-100 dark:bg-red-900/30",
  outdated: "bg-amber-100 dark:bg-amber-900/30",
  incomplete: "bg-blue-100 dark:bg-blue-900/30",
  inaccurate: "bg-purple-100 dark:bg-purple-900/30",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  resolved:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  wont_fix:
    "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
};

// ============================================================
// Category icons (inline SVG)
// ============================================================

function CategoryIcon({ category }: { category: string }) {
  const cls = `h-5 w-5 ${CATEGORY_COLORS[category] ?? "text-(--text-2)"}`;

  switch (category) {
    case "missing":
      // Circle with question mark
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "outdated":
      // Clock
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "incomplete":
      // Half circle / progress
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 0 20" />
          <path d="M12 2v20" />
        </svg>
      );
    case "inaccurate":
      // Alert triangle
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    default:
      return null;
  }
}

// ============================================================
// Component
// ============================================================

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.medium,
      ease: EASE_APPLE,
      delay: i * 0.04,
    },
  }),
};

export default function DebtItemCard({
  item,
  locale,
  index = 0,
  translations: t,
  onVote,
  hasVoted,
}: DebtItemCardProps) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-(--border) shadow-md rounded-2xl p-5 transition-all hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${CATEGORY_BG[item.category] ?? "bg-(--surface)"}`}
        >
          <CategoryIcon category={item.category} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/${locale}/knowledge/debt/${item.id}`}
              className="text-sm font-semibold text-(--text-1) hover:text-(--primary) transition-colors line-clamp-2"
            >
              {item.title}
            </Link>
          </div>

          {/* Badges row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_BG[item.category] ?? ""} ${CATEGORY_COLORS[item.category] ?? ""}`}
            >
              {t.categoryLabels[item.category] ?? item.category}
            </span>
            <PriorityBadge
              priority={item.priority}
              label={t.priorityLabels[item.priority] ?? item.priority}
            />
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status] ?? ""}`}
            >
              {t.statusLabels[item.status] ?? item.status}
            </span>
          </div>

          {/* Footer row */}
          <div className="mt-3 flex items-center gap-4 text-xs text-(--text-2)">
            {/* Vote button */}
            <button
              type="button"
              onClick={() => onVote?.(item.id)}
              className={`flex items-center gap-1 transition-colors ${
                hasVoted
                  ? "text-amber-600 dark:text-amber-400"
                  : "hover:text-amber-600 dark:hover:text-amber-400"
              }`}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill={hasVoted ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              {item.voteCount}
            </button>

            {/* Comments */}
            <span className="flex items-center gap-1">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {item.commentCount}
            </span>

            {/* Assignee */}
            {item.assigneeUsername && (
              <span className="flex items-center gap-1 ml-auto">
                {item.assigneeAvatar ? (
                  <img
                    src={item.assigneeAvatar}
                    alt=""
                    className="h-4 w-4 rounded-full"
                  />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-(--surface) text-[10px] font-medium">
                    {(item.assigneeDisplayName ?? item.assigneeUsername)?.[0]?.toUpperCase()}
                  </span>
                )}
                <span className="truncate max-w-[80px]">
                  {item.assigneeDisplayName ?? item.assigneeUsername}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
