"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { reviewSuggestion } from "@/lib/social/edit-suggestion-actions";
import type { EditSuggestion } from "@/lib/db/schema/social";
import type { UserRole } from "@/lib/auth/rbac";
import { canModerate } from "@/lib/auth/rbac";
import { DURATION, EASE_APPLE } from "@/lib/motion";

// ============================================================
// Types
// ============================================================

type SuggestionStatus = "pending" | "accepted" | "rejected" | "superseded";

interface SuggestedEditCardProps {
  suggestion: EditSuggestion;
  currentUserRole: UserRole | null;
  /** Optional callback fired after a successful review action */
  onReviewed?: (id: string, action: "approve" | "reject") => void;
}

// ============================================================
// SuggestedEditCard
// ============================================================
export default function SuggestedEditCard({
  suggestion,
  currentUserRole,
  onReviewed,
}: SuggestedEditCardProps) {
  const [status, setStatus] = useState<SuggestionStatus>(
    suggestion.status as SuggestionStatus,
  );
  const [rejectionNote, setRejectionNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isMod = currentUserRole !== null && canModerate(currentUserRole);
  const isPendingStatus = status === "pending";

  function handleReview(action: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      const result = await reviewSuggestion(
        suggestion.id,
        action,
        action === "reject" ? rejectionNote : undefined,
      );

      if (!result.success) {
        setError(result.error ?? "error");
        return;
      }

      setStatus(action === "approve" ? "accepted" : "rejected");
      setShowRejectForm(false);
      onReviewed?.(suggestion.id, action);
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
      className="relative overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface)"
    >
      <div className="relative z-10 p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-(--accent) bg-(--accent-muted) rounded px-2 py-0.5">
                {suggestion.field}
              </span>
              <StatusBadge status={status} />
            </div>
            {suggestion.summary && (
              <p className="text-sm font-medium text-(--text-1) mt-1">
                {suggestion.summary}
              </p>
            )}
          </div>

          <time className="text-xs text-(--text-3) shrink-0">
            {suggestion.createdAt.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </div>

        {/* Diff — side-by-side on wider screens, stacked on mobile */}
        <div className="grid gap-2 sm:grid-cols-2">
          <DiffPanel label="Original" content={suggestion.originalBody} variant="removed" />
          <DiffPanel label="Proposed" content={suggestion.suggestedBody} variant="added" />
        </div>

        {/* Rejection reason (on rejected suggestions) */}
        {status === "rejected" && suggestion.rejectionReason && (
          <div className="rounded-md border border-red-400/20 bg-red-500/5 px-3 py-2">
            <p className="text-xs font-medium text-red-400">Rejection reason</p>
            <p className="text-sm text-(--text-2) mt-0.5">
              {suggestion.rejectionReason}
            </p>
          </div>
        )}

        {/* Moderator actions */}
        {isMod && isPendingStatus && (
          <div className="space-y-2 border-t border-(--border) pt-3">
            {!showRejectForm ? (
              <div className="flex items-center gap-2">
                <ReviewButton
                  label="Approve"
                  variant="approve"
                  loading={isPending}
                  onClick={() => handleReview("approve")}
                />
                <ReviewButton
                  label="Reject"
                  variant="reject"
                  loading={isPending}
                  onClick={() => setShowRejectForm(true)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Optional rejection reason..."
                  rows={2}
                  maxLength={500}
                  disabled={isPending}
                  className={[
                    "w-full resize-none rounded-md border bg-(--bg-surface) px-3 py-2 text-sm",
                    "text-(--text-1) placeholder:text-(--text-3)",
                    "border-(--border) focus:border-red-400/60 focus:outline-none focus:ring-1 focus:ring-red-400/30",
                    "transition-colors",
                  ].join(" ")}
                />
                <div className="flex items-center gap-2">
                  <ReviewButton
                    label="Confirm reject"
                    variant="reject"
                    loading={isPending}
                    onClick={() => handleReview("reject")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="rounded-md px-3 py-1.5 text-xs text-(--text-2) hover:text-(--text-1) transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400">{friendlyError(error)}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// StatusBadge
// ============================================================
function StatusBadge({ status }: { status: SuggestionStatus }) {
  const styles: Record<SuggestionStatus, string> = {
    pending: "bg-amber-500/10 text-amber-400 border border-amber-400/30",
    accepted: "bg-(--accent-muted) text-(--accent) border border-(--accent)/30",
    rejected: "bg-red-500/10 text-red-400 border border-red-400/30",
    superseded: "bg-(--bg-elevated) text-(--text-3) border border-(--border)",
  };

  const labels: Record<SuggestionStatus, string> = {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
    superseded: "Superseded",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-mono",
        styles[status],
      ].join(" ")}
    >
      {labels[status]}
    </span>
  );
}

// ============================================================
// DiffPanel — shows original or proposed text
// ============================================================
function DiffPanel({
  label,
  content,
  variant,
}: {
  label: string;
  content: string;
  variant: "removed" | "added";
}) {
  const borderColor =
    variant === "removed" ? "border-red-400/20" : "border-(--accent)/20";
  const bgColor =
    variant === "removed" ? "bg-red-500/5" : "bg-(--accent-muted)";
  const labelColor =
    variant === "removed" ? "text-red-400" : "text-(--accent)";

  // Truncate very long bodies for display
  const displayContent =
    content.length > 600 ? content.slice(0, 600) + "…" : content;

  return (
    <div className={["rounded-md border px-3 py-2 space-y-1", borderColor, bgColor].join(" ")}>
      <p className={["text-xs font-mono uppercase tracking-wider", labelColor].join(" ")}>
        {label}
      </p>
      <p className="text-xs leading-relaxed text-(--text-2) whitespace-pre-wrap font-mono wrap-break-word">
        {displayContent}
      </p>
    </div>
  );
}

// ============================================================
// ReviewButton — approve/reject CTA
// ============================================================
function ReviewButton({
  label,
  variant,
  loading,
  onClick,
}: {
  label: string;
  variant: "approve" | "reject";
  loading: boolean;
  onClick: () => void;
}) {
  const base =
    "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2";
  const styles =
    variant === "approve"
      ? "bg-(--accent) text-black hover:bg-(--accent-hover) focus-visible:ring-(--accent)"
      : "border border-red-500/30 text-red-400 hover:bg-red-500/10 focus-visible:ring-red-500";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      disabled={loading}
      onClick={onClick}
      className={[base, styles, loading ? "opacity-60 cursor-wait" : "cursor-pointer"].join(" ")}
    >
      {loading ? "..." : label}
    </motion.button>
  );
}

// ============================================================
// Helpers
// ============================================================
function friendlyError(code: string): string {
  const map: Record<string, string> = {
    unauthenticated: "You must be signed in.",
    forbidden: "Moderator access required.",
    notFound: "Suggestion not found.",
    alreadyReviewed: "This suggestion has already been reviewed.",
    serverError: "Something went wrong. Please try again.",
  };
  return map[code] ?? "An error occurred.";
}
