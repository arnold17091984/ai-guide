"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  addComment,
  editComment,
  deleteComment,
} from "@/lib/social/comment-actions";
import type { CommentWithAuthor } from "@/lib/social/comment-actions";
import { DURATION, EASE_APPLE } from "@/lib/motion";

interface CommentSectionProps {
  targetType: string;
  targetId: string;
  initialComments: CommentWithAuthor[];
  /** Current user id — null when unauthenticated */
  currentUserId: string | null;
  /** Whether the current user can moderate (edit/delete any comment) */
  canModerate?: boolean;
}

// ============================================================
// CommentSection
// ============================================================
export default function CommentSection({
  targetType,
  targetId,
  initialComments,
  currentUserId,
  canModerate = false,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);
  const [isPending, startTransition] = useTransition();
  const [addError, setAddError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ---------- Add comment ----------
  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = textareaRef.current?.value.trim() ?? "";
    if (!body) return;

    setAddError(null);

    startTransition(async () => {
      try {
        const result = await addComment({ targetType, targetId, body });

        if (!result.success) {
          setAddError(result.error ?? "error");
          return;
        }

        // Optimistically prepend a placeholder comment while revalidation runs
        const newComment: CommentWithAuthor = {
          id: result.commentId ?? crypto.randomUUID(),
          authorId: currentUserId,
          parentId: null,
          targetType,
          targetId,
          body,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: null, // author detail refreshed on revalidation
        };

        setComments((prev) => [newComment, ...prev]);

        if (textareaRef.current) {
          textareaRef.current.value = "";
        }
      } catch {
        setAddError("serverError");
      }
    });
  }

  // ---------- Delete comment ----------
  function handleDelete(commentId: string) {
    startTransition(async () => {
      try {
        const result = await deleteComment(commentId);
        if (result.success) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId
                ? { ...c, isDeleted: true, body: "[deleted]" }
                : c,
            ),
          );
        } else {
          setAddError(result.error ?? "serverError");
        }
      } catch {
        setAddError("serverError");
      }
    });
  }

  return (
    <section aria-label="Comments" className="space-y-4">
      <h3 className="text-base font-semibold text-(--text-1)">
        Comments{" "}
        <span className="ml-1 rounded bg-(--bg-elevated) px-2 py-0.5 text-xs font-normal text-(--text-2)">
          {comments.filter((c) => !c.isDeleted).length}
        </span>
      </h3>

      {/* Comment list */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              canModerate={canModerate}
              onDelete={handleDelete}
              onEdited={(id, newBody) =>
                setComments((prev) =>
                  prev.map((c) =>
                    c.id === id ? { ...c, body: newBody, updatedAt: new Date() } : c,
                  ),
                )
              }
            />
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <p className="text-sm text-(--text-2)">
            No comments yet. Be the first!
          </p>
        )}
      </div>

      {/* Add comment form */}
      {currentUserId ? (
        <form onSubmit={handleAdd} className="space-y-2">
          <textarea
            ref={textareaRef}
            name="body"
            rows={3}
            maxLength={2000}
            placeholder="Add a comment..."
            disabled={isPending}
            className={[
              "w-full resize-none rounded-md border bg-(--bg-surface) px-4 py-3 text-sm",
              "text-(--text-1) placeholder:text-(--text-3)",
              "border-(--border) focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent)/20",
              "transition-colors duration-150",
              isPending ? "opacity-60" : "",
            ].join(" ")}
          />
          {addError && (
            <p className="text-xs text-red-500">
              {friendlyError(addError)}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className={[
                "rounded-md h-9 px-4 text-sm font-medium transition-all duration-150",
                "bg-(--accent) text-black hover:bg-(--accent-hover)",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)",
                isPending ? "cursor-wait opacity-60" : "cursor-pointer",
              ].join(" ")}
            >
              {isPending ? "Posting..." : "Post comment"}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-(--text-2)">
          Sign in to leave a comment.
        </p>
      )}
    </section>
  );
}

// ============================================================
// CommentCard
// ============================================================
interface CommentCardProps {
  comment: CommentWithAuthor;
  currentUserId: string | null;
  canModerate: boolean;
  onDelete: (id: string) => void;
  onEdited: (id: string, newBody: string) => void;
}

function CommentCard({
  comment,
  currentUserId,
  canModerate,
  onDelete,
  onEdited,
}: CommentCardProps) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [editError, setEditError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isOwn = comment.authorId === currentUserId;
  const canAct = isOwn || canModerate;
  const displayName =
    comment.author?.displayName ?? comment.author?.username ?? "Deleted user";

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    startTransition(async () => {
      const result = await editComment(comment.id, editBody);
      if (result.success) {
        onEdited(comment.id, editBody);
        setEditing(false);
      } else {
        setEditError(result.error ?? "error");
      }
    });
  }

  if (comment.isDeleted) {
    return (
      <div className="rounded-md border border-(--border) bg-(--bg-surface) px-4 py-3">
        <p className="text-sm italic text-(--text-2)">[deleted]</p>
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
      className="relative overflow-hidden rounded-md border border-(--border) bg-(--bg-surface)"
    >

      <div className="relative z-10 px-4 py-3 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Avatar */}
            {comment.author?.avatarUrl ? (
              <Image
                src={comment.author.avatarUrl}
                alt={displayName}
                width={24}
                height={24}
                className="h-6 w-6 rounded-full object-cover shrink-0"
                unoptimized
              />
            ) : (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--accent-muted) text-xs font-semibold text-(--accent)">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="truncate text-sm font-medium text-(--text-1)">
              {displayName}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <time
              dateTime={comment.createdAt.toISOString()}
              className="text-xs text-(--text-2)"
            >
              {formatRelative(comment.createdAt)}
            </time>

            {canAct && !editing && (
              <div className="flex items-center gap-1">
                {isOwn && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditBody(comment.body);
                      setEditing(true);
                    }}
                    className="rounded px-1.5 py-0.5 text-xs text-(--text-2) hover:bg-(--bg-elevated) hover:text-(--text-1) transition-colors"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(comment.id)}
                  disabled={isPending}
                  className="rounded px-1.5 py-0.5 text-xs text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        {editing ? (
          <form onSubmit={handleEdit} className="space-y-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={3}
              maxLength={2000}
              disabled={isPending}
              className={[
                "w-full resize-none rounded-md border bg-(--bg-surface) px-3 py-2 text-sm",
                "text-(--text-1) border-(--border)",
                "focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent)/20",
                "transition-colors duration-150",
              ].join(" ")}
            />
            {editError && (
              <p className="text-xs text-red-500">{friendlyError(editError)}</p>
            )}
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded px-3 py-1 text-xs text-(--text-2) hover:text-(--text-1) transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={[
                  "rounded-md px-3 py-1 text-xs font-medium",
                  "bg-(--accent) text-black hover:bg-(--accent-hover) transition-colors",
                  isPending ? "opacity-60 cursor-wait" : "",
                ].join(" ")}
              >
                {isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm leading-relaxed text-(--text-1) whitespace-pre-wrap">
            {comment.body}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Helpers
// ============================================================
function friendlyError(code: string): string {
  const map: Record<string, string> = {
    unauthenticated: "You must be signed in.",
    bodyTooShort: "Comment cannot be empty.",
    bodyTooLong: "Comment must be 2000 characters or fewer.",
    forbidden: "You do not have permission to do that.",
    notFound: "Comment not found.",
    serverError: "Something went wrong. Please try again.",
  };
  return map[code] ?? "An error occurred.";
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
