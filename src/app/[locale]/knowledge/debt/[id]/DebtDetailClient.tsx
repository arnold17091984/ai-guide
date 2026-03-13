"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  voteDebtItem,
  assignDebtItem,
  resolveDebtItem,
  reopenDebtItem,
  addDebtComment,
} from "@/lib/knowledge-debt/actions";

// ============================================================
// Types
// ============================================================

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

interface DebtDetailClientProps {
  itemId: string;
  locale: string;
  voteCount: number;
  hasVoted: boolean;
  comments: Comment[];
  canEdit: boolean;
  canResolve: boolean;
  isResolved: boolean;
  isLoggedIn: boolean;
  currentUserId: string | null;
  assigneeId: string | null;
  translations: {
    vote: string;
    voted: string;
    assignToMe: string;
    resolve: string;
    reopen: string;
    edit: string;
    resolutionNotePlaceholder: string;
    submitResolution: string;
    cancel: string;
    commentPlaceholder: string;
    submitComment: string;
    commentsTitle: string;
    loginToComment: string;
  };
}

// ============================================================
// Component
// ============================================================

export default function DebtDetailClient({
  itemId,
  locale,
  voteCount,
  hasVoted,
  comments,
  canResolve,
  isResolved,
  isLoggedIn,
  currentUserId,
  assigneeId,
  translations: t,
}: DebtDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [commentText, setCommentText] = useState("");

  function handleVote() {
    startTransition(async () => {
      await voteDebtItem(itemId);
    });
  }

  function handleAssign() {
    if (!currentUserId) return;
    startTransition(async () => {
      await assignDebtItem(itemId, currentUserId);
    });
  }

  function handleResolve() {
    startTransition(async () => {
      await resolveDebtItem(itemId, resolutionNote);
      setShowResolveForm(false);
      setResolutionNote("");
    });
  }

  function handleReopen() {
    startTransition(async () => {
      await reopenDebtItem(itemId);
    });
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    startTransition(async () => {
      await addDebtComment(itemId, commentText);
      setCommentText("");
    });
  }

  function handleEdit() {
    router.push(`/${locale}/knowledge/debt/${itemId}`);
  }

  const canSelfAssign =
    isLoggedIn && currentUserId !== assigneeId && !isResolved;

  return (
    <div className={`mt-6 space-y-6 ${isPending ? "opacity-70 transition-opacity" : ""}`}>
      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Vote */}
        {isLoggedIn && (
          <button
            type="button"
            onClick={handleVote}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              hasVoted
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-1 ring-amber-500/30"
                : "border border-(--border) bg-(--surface) text-(--text-2) hover:bg-(--surface-hover) hover:text-(--text-1)"
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
            {hasVoted ? t.voted : t.vote} ({voteCount})
          </button>
        )}

        {/* Assign to me */}
        {canSelfAssign && (
          <button
            type="button"
            onClick={handleAssign}
            className="inline-flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-4 py-2.5 text-sm font-medium text-(--text-2) transition-all hover:bg-(--surface-hover) hover:text-(--text-1)"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            {t.assignToMe}
          </button>
        )}

        {/* Resolve / Reopen */}
        {canResolve && !isResolved && (
          <button
            type="button"
            onClick={() => setShowResolveForm(!showResolveForm)}
            className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-green-600"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {t.resolve}
          </button>
        )}

        {isLoggedIn && isResolved && (
          <button
            type="button"
            onClick={handleReopen}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400 transition-all hover:bg-amber-100 dark:hover:bg-amber-900/30"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            {t.reopen}
          </button>
        )}
      </div>

      {/* Resolution form */}
      {showResolveForm && (
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-(--border) shadow-md rounded-2xl p-4">
          <textarea
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            placeholder={t.resolutionNotePlaceholder}
            rows={3}
            className="w-full rounded-xl border border-(--border) bg-(--surface) p-3 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleResolve}
              className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
            >
              {t.submitResolution}
            </button>
            <button
              type="button"
              onClick={() => setShowResolveForm(false)}
              className="rounded-xl border border-(--border) px-4 py-2 text-sm text-(--text-2) hover:bg-(--surface-hover)"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Comments section */}
      <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-(--border) shadow-md rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-(--text-1) mb-4">
          {t.commentsTitle} ({comments.length})
        </h2>

        {/* Comment list */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 border-b border-(--border) pb-4 last:border-0 last:pb-0"
            >
              {comment.avatarUrl ? (
                <img
                  src={comment.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full shrink-0"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--surface) text-sm font-medium text-(--text-2) shrink-0">
                  {(
                    comment.displayName ??
                    comment.username ??
                    "?"
                  )[0]?.toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-(--text-1)">
                    {comment.displayName ?? comment.username}
                  </span>
                  <span className="text-xs text-(--text-2)">
                    {new Date(comment.createdAt).toLocaleDateString(locale)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-(--text-1) whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Add comment */}
        {isLoggedIn ? (
          <form onSubmit={handleComment} className="mt-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t.commentPlaceholder}
              rows={2}
              className="w-full rounded-xl border border-(--border) bg-(--surface) p-3 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="rounded-xl bg-(--primary) px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.submitComment}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-4 text-sm text-(--text-2)">{t.loginToComment}</p>
        )}
      </div>
    </div>
  );
}
