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
// Category styling — Terminal Native
// ============================================================

const CATEGORY_COLORS: Record<string, string> = {
  missing: "text-red-400",
  outdated: "text-amber-400",
  incomplete: "text-(--accent)",
  inaccurate: "text-amber-400",
};

const CATEGORY_BG: Record<string, string> = {
  missing: "bg-red-500/10",
  outdated: "bg-amber-500/10",
  incomplete: "bg-(--accent-muted)",
  inaccurate: "bg-amber-500/10",
};

const CATEGORY_BADGE: Record<string, string> = {
  missing: "bg-red-500/10 text-red-400",
  outdated: "bg-amber-500/10 text-amber-400",
  incomplete: "bg-(--accent-muted) text-(--accent)",
  inaccurate: "bg-amber-500/10 text-amber-400",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  resolved: "bg-(--accent-muted) text-(--accent)",
  wont_fix: "bg-(--bg-elevated) text-(--text-3)",
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
      className="border border-(--border) bg-(--bg-surface) rounded-lg p-5 transition-all hover:border-(--border-hover)"
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${CATEGORY_BG[item.category] ?? "bg-(--bg-elevated)"}`}
        >
          <CategoryIcon category={item.category} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/${locale}/knowledge/debt/${item.id}`}
              className="text-sm font-semibold text-(--text-1) hover:text-(--accent) transition-colors line-clamp-2"
            >
              {item.title}
            </Link>
          </div>

          {/* Badges row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-mono ${CATEGORY_BADGE[item.category] ?? "bg-(--bg-elevated) text-(--text-2)"}`}
            >
              {t.categoryLabels[item.category] ?? item.category}
            </span>
            <PriorityBadge
              priority={item.priority}
              label={t.priorityLabels[item.priority] ?? item.priority}
            />
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-mono ${STATUS_COLORS[item.status] ?? "bg-(--bg-elevated) text-(--text-2)"}`}
            >
              {t.statusLabels[item.status] ?? item.status}
            </span>
          </div>

          {/* Footer row */}
          <div className="mt-3 flex items-center gap-4 text-xs text-(--text-3)">
            {/* Vote button */}
            <button
              type="button"
              onClick={() => onVote?.(item.id)}
              className={`flex items-center gap-1 transition-colors ${
                hasVoted
                  ? "text-(--accent)"
                  : "hover:text-(--accent)"
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
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-(--bg-elevated) text-[10px] font-medium text-(--text-1)">
                    {(item.assigneeDisplayName ?? item.assigneeUsername)?.[0]?.toUpperCase()}
                  </span>
                )}
                <span className="truncate max-w-20">
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
