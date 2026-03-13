"use client";

import { motion } from "framer-motion";
import { DURATION, EASE_APPLE } from "@/lib/motion";

// ============================================================
// Tier color mappings — left border accent per spec
// ============================================================

const TIER_COLORS: Record<string, { borderLeft: string; text: string }> = {
  bronze: {
    borderLeft: "border-l-amber-700",
    text: "text-amber-700 dark:text-amber-600",
  },
  silver: {
    borderLeft: "border-l-zinc-400",
    text: "text-zinc-400",
  },
  gold: {
    borderLeft: "border-l-amber-400",
    text: "text-amber-400",
  },
  platinum: {
    borderLeft: "border-l-emerald-400",
    text: "text-emerald-400",
  },
};

// ============================================================
// Inline SVG icons (no external libraries)
// ============================================================

function AchievementIcon({ name, className }: { name: string; className?: string }) {
  const cn = className ?? "h-6 w-6";
  const props = {
    className: cn,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "document":
      return (
        <svg {...props}>
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "heart":
      return (
        <svg {...props}>
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case "pencil":
      return (
        <svg {...props}>
          <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      );
    case "chat":
      return (
        <svg {...props}>
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case "star":
      return (
        <svg {...props}>
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...props}>
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case "edit":
      return (
        <svg {...props}>
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case "crown":
      return (
        <svg {...props}>
          <path d="M2 17l2-11 5 4 3-6 3 6 5-4 2 11H2z" />
          <path d="M2 17h20v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2z" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

// ============================================================
// Component Props
// ============================================================

export interface AchievementCardProps {
  name: string;
  description: string;
  iconName: string;
  tier: string;
  isUnlocked: boolean;
  isSecret: boolean;
  progress: number;
  requiredValue: number;
  unlockCount: number;
  secretLabel: string;
  unlockedLabel: string;
  lockedLabel: string;
  progressLabel: string;
}

export default function AchievementCard({
  name,
  description,
  iconName,
  tier,
  isUnlocked,
  isSecret,
  progress,
  requiredValue,
  unlockCount,
  secretLabel,
  unlockedLabel,
  lockedLabel,
  progressLabel,
}: AchievementCardProps) {
  const colors = TIER_COLORS[tier] ?? TIER_COLORS.bronze;
  const progressPct = Math.min((progress / requiredValue) * 100, 100);

  // Secret + locked = show mystery card
  if (isSecret && !isUnlocked) {
    return (
      <motion.div
        whileHover={{ y: -2, transition: { duration: DURATION.normal, ease: EASE_APPLE } }}
        className="relative overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface) p-5 opacity-50 grayscale"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-(--bg-elevated)">
            <LockIcon className="h-5 w-5 text-(--text-3)" />
          </div>
          <div>
            <p className="font-semibold text-(--text-1)">???</p>
            <p className="text-sm text-(--text-2)">{secretLabel}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{
        y: -2,
        transition: { duration: DURATION.normal, ease: EASE_APPLE },
      }}
      className={`relative overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface) p-5 border-l-2 ${colors.borderLeft} ${
        !isUnlocked ? "opacity-50 grayscale" : "shadow-[0_0_20px_rgba(16,185,129,0.15)]"
      }`}
    >
      <div className="relative">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
              isUnlocked
                ? `bg-(--bg-elevated) ${colors.text}`
                : "bg-(--bg-elevated) text-(--text-3)"
            }`}
          >
            {isUnlocked ? (
              <AchievementIcon name={iconName} className="h-5 w-5" />
            ) : (
              <LockIcon className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`font-semibold ${isUnlocked ? "text-(--text-1)" : "text-(--text-2)"}`}>
              {name}
            </p>
            <p className="mt-0.5 text-sm text-(--text-2)">
              {description}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {!isUnlocked && requiredValue > 1 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-(--text-2)">
              <span>{progressLabel}</span>
              <span>
                {progress} / {requiredValue}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-md bg-(--bg-elevated)">
              <div
                className="h-full rounded-md bg-(--accent)"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between text-xs text-(--text-2)">
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono ${
              isUnlocked
                ? `${colors.text} bg-(--accent-muted)`
                : "bg-(--bg-elevated) text-(--text-3)"
            }`}
          >
            {isUnlocked ? unlockedLabel : lockedLabel}
          </span>
          <span>
            {unlockCount} {unlockedLabel.toLowerCase()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
