"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { castVote } from "@/lib/social/vote-actions";
import type { VoteTargetType } from "@/lib/social/vote-actions";

interface VoteButtonProps {
  targetType: VoteTargetType;
  targetId: string;
  initialScore: number;
  initialUserVote: 1 | -1 | 0;
}

// ============================================================
// VoteButton
// ============================================================
// Up/down voting with optimistic UI. Reverts on server error.
// Each arrow animates with a scale bounce on click.
// ============================================================
export default function VoteButton({
  targetType,
  targetId,
  initialScore,
  initialUserVote,
}: VoteButtonProps) {
  const [score, setScore] = useState<number>(initialScore);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(initialUserVote);
  const [pending, setPending] = useState<1 | -1 | null>(null);

  const handleVote = useCallback(
    async (value: 1 | -1) => {
      if (pending !== null) return;

      // --- Optimistic update ---
      const prevScore = score;
      const prevVote = userVote;

      // Compute what the new state would be
      let nextVote: 1 | -1 | 0;
      let scoreDelta: number;

      if (userVote === value) {
        // Toggle off
        nextVote = 0;
        scoreDelta = -value;
      } else if (userVote !== 0) {
        // Flip direction: remove old, add new (+2 or -2 net)
        nextVote = value;
        scoreDelta = value * 2;
      } else {
        // Fresh vote
        nextVote = value;
        scoreDelta = value;
      }

      setScore(prevScore + scoreDelta);
      setUserVote(nextVote);
      setPending(value);

      try {
        const result = await castVote({ targetType, targetId, value });

        if (!result.success) {
          // Revert on failure
          setScore(prevScore);
          setUserVote(prevVote);
        } else {
          // Sync with authoritative server score
          setScore(result.newScore);
          setUserVote(result.userVote);
        }
      } catch {
        setScore(prevScore);
        setUserVote(prevVote);
      } finally {
        setPending(null);
      }
    },
    [pending, score, userVote, targetType, targetId],
  );

  const upActive = userVote === 1;
  const downActive = userVote === -1;

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Upvote */}
      <ArrowButton
        direction="up"
        active={upActive}
        loading={pending === 1}
        onClick={() => handleVote(1)}
        aria-label="Upvote"
      />

      {/* Score */}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={score}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18 }}
          className={[
            "min-w-[2rem] text-center text-sm font-semibold tabular-nums",
            score > 0
              ? "text-(--accent)"
              : score < 0
                ? "text-red-500 dark:text-red-400"
                : "text-[var(--text-2)]",
          ].join(" ")}
        >
          {score > 0 ? `+${score}` : score}
        </motion.span>
      </AnimatePresence>

      {/* Downvote */}
      <ArrowButton
        direction="down"
        active={downActive}
        loading={pending === -1}
        onClick={() => handleVote(-1)}
        aria-label="Downvote"
      />
    </div>
  );
}

// ============================================================
// ArrowButton — internal helper
// ============================================================
interface ArrowButtonProps {
  direction: "up" | "down";
  active: boolean;
  loading: boolean;
  onClick: () => void;
  "aria-label": string;
}

function ArrowButton({
  direction,
  active,
  loading,
  onClick,
  "aria-label": ariaLabel,
}: ArrowButtonProps) {
  const isUp = direction === "up";

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={loading}
      onClick={onClick}
      whileTap={{ scale: 0.75 }}
      whileHover={{ scale: 1.15 }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)",
        active
          ? isUp
            ? "border-(--accent)/60 bg-(--accent-muted) text-(--accent)"
            : "border-red-400/60 bg-red-500/15 text-red-400"
          : "border-(--border) bg-transparent text-(--text-2) hover:border-(--accent) hover:text-(--accent)",
        loading ? "cursor-wait opacity-60" : "cursor-pointer",
      ].join(" ")}
    >
      {isUp ? (
        // Up chevron
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        // Down chevron
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </motion.button>
  );
}
