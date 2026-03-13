"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { starSkill } from "@/lib/skills/actions";

// ============================================================
// StarButton
// ============================================================
// Toggle star/unstar with optimistic UI.
// Animated star icon (filled/outline). Shows star count.
// ============================================================

interface StarButtonProps {
  skillId: string;
  initialStarred: boolean;
  initialCount: number;
}

export default function StarButton({
  skillId,
  initialStarred,
  initialCount,
}: StarButtonProps) {
  const [starred, setStarred] = useState(initialStarred);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  const handleStar = useCallback(async () => {
    if (pending) return;

    // Optimistic update
    const prevStarred = starred;
    const prevCount = count;
    const nextStarred = !starred;
    const nextCount = nextStarred ? count + 1 : Math.max(0, count - 1);

    setStarred(nextStarred);
    setCount(nextCount);
    setPending(true);

    try {
      const result = await starSkill(skillId);

      if (!result.success) {
        // Revert on failure
        setStarred(prevStarred);
        setCount(prevCount);
      } else {
        // Sync authoritative server state
        setStarred(result.starred);
        setCount(result.newCount);
      }
    } catch {
      setStarred(prevStarred);
      setCount(prevCount);
    } finally {
      setPending(false);
    }
  }, [pending, starred, count, skillId]);

  return (
    <motion.button
      type="button"
      aria-label={starred ? "Unstar skill" : "Star skill"}
      aria-pressed={starred}
      disabled={pending}
      onClick={handleStar}
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={[
        "inline-flex items-center gap-2 rounded-md border h-9 px-4 text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
        starred
          ? "border-amber-400/60 bg-amber-500/15 text-amber-400"
          : "border-(--border) bg-transparent text-(--text-2) hover:border-amber-400/50 hover:bg-amber-500/10 hover:text-amber-400",
        pending ? "cursor-wait opacity-70" : "cursor-pointer",
      ].join(" ")}
    >
      {/* Animated star icon */}
      <motion.span
        animate={starred ? { rotate: [0, -15, 10, 0], scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.4 }}
        aria-hidden="true"
      >
        <StarIcon filled={starred} />
      </motion.span>

      {/* Animated count */}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18 }}
          className="tabular-nums"
        >
          {count.toLocaleString()}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// StarIcon — inline SVG
// ---------------------------------------------------------------------------

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
