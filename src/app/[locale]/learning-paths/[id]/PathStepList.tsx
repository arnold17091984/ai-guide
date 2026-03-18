"use client";

import { useTransition } from "react";
import { completeStep } from "@/lib/learning-paths/actions";
import type { LearningPathStep } from "@/lib/learning-paths/queries";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProgressRow = {
  stepId: string;
  status: string;
};

interface PathStepListProps {
  steps: LearningPathStep[];
  progress: ProgressRow[];
  pathId: string;
  isEnrolled: boolean;
  labels: {
    markComplete: string;
    completed: string;
    progress: (completed: number, total: number) => string;
  };
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckCircleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function CircleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function LoaderIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Content type badge styles
// ---------------------------------------------------------------------------

const CONTENT_TYPE_STYLES: Record<string, string> = {
  knowledge_entry: "bg-violet-500/10 text-violet-400",
  skill: "bg-(--accent-muted) text-(--accent)",
  case_study: "bg-amber-500/10 text-amber-400",
  claude_config: "bg-cyan-500/10 text-cyan-400",
};

// ---------------------------------------------------------------------------
// StepRow — individual step with optimistic completion
// ---------------------------------------------------------------------------

function StepRow({
  step,
  status,
  pathId,
  isEnrolled,
  isLast,
  labels,
}: {
  step: LearningPathStep;
  status: string;
  pathId: string;
  isEnrolled: boolean;
  isLast: boolean;
  labels: { markComplete: string; completed: string };
}) {
  const [isPending, startTransition] = useTransition();

  const isCompleted = status === "completed";
  const badgeStyle =
    CONTENT_TYPE_STYLES[step.contentType] ?? "bg-zinc-500/10 text-zinc-400";

  function handleComplete() {
    startTransition(async () => {
      await completeStep(pathId, step.id);
    });
  }

  return (
    <li className="relative flex gap-4">
      {/* Vertical connector line */}
      {!isLast && (
        <span
          className="absolute left-[9px] top-9 h-full w-px bg-(--border)"
          aria-hidden="true"
        />
      )}

      {/* Step indicator */}
      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center mt-0.5">
        {isCompleted ? (
          <span className="text-emerald-500">
            <CheckCircleIcon />
          </span>
        ) : (
          <span className="text-(--text-2)">
            <CircleIcon />
          </span>
        )}
      </div>

      {/* Step content */}
      <div
        className={`flex-1 rounded-lg border p-4 mb-3 transition-colors ${
          isCompleted
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-(--border) bg-(--bg-surface)"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-(--text-2)">
              {step.stepNumber}
            </span>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${badgeStyle}`}>
              {step.contentType.replace(/_/g, " ")}
            </span>
            {!step.isRequired && (
              <span className="rounded border border-(--border) px-2 py-0.5 text-xs text-(--text-2)">
                optional
              </span>
            )}
          </div>

          {/* Mark complete button */}
          {isEnrolled && !isCompleted && (
            <button
              onClick={handleComplete}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded border border-(--border) px-2.5 py-1 text-xs text-(--text-2) transition-colors hover:border-emerald-500/40 hover:text-emerald-400 disabled:opacity-50"
            >
              {isPending ? <LoaderIcon /> : labels.markComplete}
            </button>
          )}
          {isCompleted && (
            <span className="text-xs font-medium text-emerald-400">
              {labels.completed}
            </span>
          )}
        </div>

        {/* Notes */}
        {(step.notesEn || step.notesKo) && (
          <p className="mt-2 text-sm text-(--text-2)">
            {step.notesEn ?? step.notesKo}
          </p>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// PathStepList
// ---------------------------------------------------------------------------

export default function PathStepList({
  steps,
  progress,
  pathId,
  isEnrolled,
  labels,
}: PathStepListProps) {
  const progressMap = new Map(progress.map((p) => [p.stepId, p.status]));
  const completedCount = progress.filter((p) => p.status === "completed").length;
  const totalCount = steps.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {isEnrolled && totalCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-(--text-2)">
              {labels.progress(completedCount, totalCount)}
            </span>
            <span className="font-medium text-(--text-1)">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-(--bg-surface)">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Step list */}
      <ol className="space-y-0">
        {steps.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            status={progressMap.get(step.id) ?? "not_started"}
            pathId={pathId}
            isEnrolled={isEnrolled}
            isLast={i === steps.length - 1}
            labels={{ markComplete: labels.markComplete, completed: labels.completed }}
          />
        ))}
      </ol>
    </div>
  );
}
