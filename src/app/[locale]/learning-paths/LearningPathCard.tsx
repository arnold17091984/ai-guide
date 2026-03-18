import Link from "next/link";
import type { LearningPathSummary } from "@/lib/learning-paths/queries";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LearningPathCardProps {
  path: LearningPathSummary & { stepCount: number; title: string; description: string | null };
  locale: string;
  labels: {
    estimatedHours: (hours: number) => string;
    steps: (count: number) => string;
  };
}

// ---------------------------------------------------------------------------
// Role badge colors
// ---------------------------------------------------------------------------

const ROLE_STYLES: Record<string, string> = {
  backend: "bg-blue-500/10 text-blue-400",
  frontend: "bg-purple-500/10 text-purple-400",
  devops: "bg-orange-500/10 text-orange-400",
  fullstack: "bg-emerald-500/10 text-emerald-400",
  data: "bg-cyan-500/10 text-cyan-400",
  mobile: "bg-pink-500/10 text-pink-400",
};

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-400",
  intermediate: "bg-amber-500/10 text-amber-400",
  advanced: "bg-red-500/10 text-red-400",
};

// ---------------------------------------------------------------------------
// Inline icons
// ---------------------------------------------------------------------------

function ClockIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ListIcon() {
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
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LearningPathCard({ path, locale, labels }: LearningPathCardProps) {
  const roleStyle = ROLE_STYLES[path.targetRole ?? ""] ?? "bg-zinc-500/10 text-zinc-400";
  const difficultyStyle =
    DIFFICULTY_STYLES[path.difficultyLevel ?? ""] ?? "bg-zinc-500/10 text-zinc-400";

  return (
    <Link
      href={`/${locale}/learning-paths/${path.id}`}
      className="group flex flex-col rounded-lg border border-(--border) bg-(--bg-surface) p-5 transition-colors hover:border-(--accent)/40 hover:bg-(--bg-elevated)"
    >
      {/* Badges row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {path.targetRole && (
          <span className={`rounded px-2.5 py-0.5 text-xs font-medium ${roleStyle}`}>
            {path.targetRole}
          </span>
        )}
        {path.difficultyLevel && (
          <span className={`rounded px-2.5 py-0.5 text-xs font-medium ${difficultyStyle}`}>
            {path.difficultyLevel}
          </span>
        )}
        {path.isOfficial && (
          <span className="rounded bg-(--accent-muted) px-2.5 py-0.5 text-xs font-medium text-(--accent)">
            official
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="mb-2 text-base font-semibold leading-snug text-(--text-1) transition-colors group-hover:text-(--accent)">
        {path.title}
      </h2>

      {/* Description */}
      {path.description && (
        <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-(--text-2)">
          {path.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center gap-4 text-xs text-(--text-2)">
        {path.estimatedHours != null && (
          <span className="flex items-center gap-1">
            <ClockIcon />
            {labels.estimatedHours(path.estimatedHours)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <ListIcon />
          {labels.steps(path.stepCount)}
        </span>
      </div>
    </Link>
  );
}
