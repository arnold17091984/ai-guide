"use client";

import { useState, useTransition } from "react";
import {
  registerSkill,
  updateSkillStatus,
  unregisterSkill,
} from "@/lib/skills/user-skill-actions";

// ============================================================
// SkillAdoptButton
// ============================================================
// Sidebar widget for registering / tracking skill progress.
// Four states: null → registered → in_progress → completed
// Uses useTransition so the UI reflects the pending server action
// without a separate loading state variable.
// ============================================================

type SkillStatus = "registered" | "in_progress" | "completed" | null;

interface SkillAdoptButtonProps {
  skillId: string;
  initialStatus: SkillStatus;
}

export default function SkillAdoptButton({
  skillId,
  initialStatus,
}: SkillAdoptButtonProps) {
  const [status, setStatus] = useState<SkillStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  // ---------------------------------------------------------------------------
  // Action handlers — optimistic-update then sync with server
  // ---------------------------------------------------------------------------

  function handleRegister() {
    const prev = status;
    setStatus("registered");
    startTransition(async () => {
      try {
        await registerSkill(skillId);
      } catch {
        setStatus(prev);
      }
    });
  }

  function handleMarkInProgress() {
    const prev = status;
    setStatus("in_progress");
    startTransition(async () => {
      try {
        await updateSkillStatus(skillId, "in_progress");
      } catch {
        setStatus(prev);
      }
    });
  }

  function handleMarkComplete() {
    const prev = status;
    setStatus("completed");
    startTransition(async () => {
      try {
        await updateSkillStatus(skillId, "completed");
      } catch {
        setStatus(prev);
      }
    });
  }

  function handleUnregister() {
    const prev = status;
    setStatus(null);
    startTransition(async () => {
      try {
        await unregisterSkill(skillId);
      } catch {
        setStatus(prev);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-2">
      {status === null && (
        <RegisterButton onClick={handleRegister} pending={isPending} />
      )}

      {status === "registered" && (
        <>
          <InProgressButton onClick={handleMarkInProgress} pending={isPending} />
          <p className="text-xs text-(--text-3)">Started</p>
        </>
      )}

      {status === "in_progress" && (
        <>
          <CompleteButton onClick={handleMarkComplete} pending={isPending} />
          <UnregisterLink onClick={handleUnregister} pending={isPending} />
        </>
      )}

      {status === "completed" && (
        <>
          <CompletedBadge />
          <UnregisterLink onClick={handleUnregister} pending={isPending} />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ActionButtonProps {
  onClick: () => void;
  pending: boolean;
}

function RegisterButton({ onClick, pending }: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      aria-label="Register this skill"
      className={[
        "inline-flex w-full items-center justify-center gap-2 rounded-md",
        "border border-emerald-500/60 bg-emerald-500/15 px-4 py-2",
        "text-sm font-medium text-emerald-400 transition-colors duration-150",
        "hover:bg-emerald-500/25 hover:border-emerald-400/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50",
        pending ? "cursor-wait opacity-60" : "cursor-pointer",
      ].join(" ")}
    >
      <PlusIcon />
      Register Skill
    </button>
  );
}

function InProgressButton({ onClick, pending }: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      aria-label="Mark skill as in progress"
      className={[
        "inline-flex w-full items-center justify-center gap-2 rounded-md",
        "border border-(--border) bg-transparent px-4 py-2",
        "text-sm font-medium text-(--text-2) transition-colors duration-150",
        "hover:border-(--border-hover) hover:text-(--text-1)",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)/50",
        pending ? "cursor-wait opacity-60" : "cursor-pointer",
      ].join(" ")}
    >
      <PlayIcon />
      In Progress
    </button>
  );
}

function CompleteButton({ onClick, pending }: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      aria-label="Mark skill as completed"
      className={[
        "inline-flex w-full items-center justify-center gap-2 rounded-md",
        "border border-(--accent)/60 bg-(--accent-muted) px-4 py-2",
        "text-sm font-medium text-(--accent) transition-colors duration-150",
        "hover:bg-(--accent)/20 hover:border-(--accent)/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)/50",
        pending ? "cursor-wait opacity-60" : "cursor-pointer",
      ].join(" ")}
    >
      {pending ? <SpinnerIcon /> : <CheckIcon />}
      Mark Complete
    </button>
  );
}

function CompletedBadge() {
  return (
    <div
      role="status"
      aria-label="Skill completed"
      className={[
        "inline-flex w-full items-center justify-center gap-2 rounded-md",
        "border border-emerald-500/60 bg-emerald-500/15 px-4 py-2",
        "text-sm font-medium text-emerald-400",
      ].join(" ")}
    >
      <CheckCircleIcon />
      Completed
    </div>
  );
}

interface UnregisterLinkProps {
  onClick: () => void;
  pending: boolean;
}

function UnregisterLink({ onClick, pending }: UnregisterLinkProps) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      aria-label="Unregister this skill"
      className={[
        "w-full text-center text-xs text-(--text-3) underline-offset-2",
        "transition-colors duration-150 hover:text-(--text-2) hover:underline",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)/50 rounded",
        pending ? "cursor-wait opacity-50" : "cursor-pointer",
      ].join(" ")}
    >
      Unregister
    </button>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icons — avoids external icon library dependency
// ---------------------------------------------------------------------------

function PlusIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
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

function CheckCircleIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ animationDuration: "0.75s" }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
