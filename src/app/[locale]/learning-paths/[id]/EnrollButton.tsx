"use client";

import { useTransition } from "react";
import { enrollInPath, unenrollFromPath } from "@/lib/learning-paths/actions";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
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
// Props
// ---------------------------------------------------------------------------

interface EnrollButtonProps {
  pathId: string;
  isEnrolled: boolean;
  labels: {
    enroll: string;
    enrolled: string;
    unenroll: string;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EnrollButton({ pathId, isEnrolled, labels }: EnrollButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleEnroll() {
    startTransition(async () => {
      await enrollInPath(pathId);
    });
  }

  function handleUnenroll() {
    startTransition(async () => {
      await unenrollFromPath(pathId);
    });
  }

  if (isEnrolled) {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400">
          <CheckIcon />
          {labels.enrolled}
        </span>
        <button
          onClick={handleUnenroll}
          disabled={isPending}
          className="text-xs text-(--text-2) underline underline-offset-2 transition-colors hover:text-(--text-1) disabled:opacity-50"
        >
          {isPending ? <LoaderIcon /> : labels.unenroll}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
    >
      {isPending && <LoaderIcon />}
      {labels.enroll}
    </button>
  );
}
