"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

const SHOWN_KEY = "ai-guide-achievements-shown";

export type AchievementId = "firstSkill" | "knowledgeSeeker" | "conversationStarter";

export interface AchievementEvent {
  id: AchievementId;
}

// Emit an achievement event from anywhere in the app
export function triggerAchievement(id: AchievementId) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AchievementEvent>("ai-guide:achievement", { detail: { id } })
  );
}

function getShownAchievements(): Set<string> {
  try {
    const stored = localStorage.getItem(SHOWN_KEY);
    if (stored) {
      return new Set(JSON.parse(stored) as string[]);
    }
  } catch {
    // ignore
  }
  return new Set();
}

function markAchievementShown(id: string) {
  const shown = getShownAchievements();
  shown.add(id);
  localStorage.setItem(SHOWN_KEY, JSON.stringify([...shown]));
}

interface ToastData {
  id: AchievementId;
  title: string;
  description: string;
}

export default function AchievementToast() {
  const t = useTranslations("gamification.achievements");
  const [queue, setQueue] = useState<ToastData[]>([]);

  const handleAchievement = useCallback(
    (e: Event) => {
      const { id } = (e as CustomEvent<AchievementEvent>).detail;
      const shown = getShownAchievements();
      if (shown.has(id)) return;

      markAchievementShown(id);

      const toast: ToastData = {
        id,
        title: t(`${id}.title`),
        description: t(`${id}.desc`),
      };

      setQueue((prev) => [...prev, toast]);
    },
    [t]
  );

  useEffect(() => {
    window.addEventListener("ai-guide:achievement", handleAchievement);
    return () => {
      window.removeEventListener("ai-guide:achievement", handleAchievement);
    };
  }, [handleAchievement]);

  // Auto-dismiss the first toast in queue after 3 seconds
  useEffect(() => {
    if (queue.length === 0) return;
    const timer = setTimeout(() => {
      setQueue((prev) => prev.slice(1));
    }, 3000);
    return () => clearTimeout(timer);
  }, [queue]);

  const current = queue[0] ?? null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id + queue.length}
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex items-center gap-3 rounded-lg border border-(--accent)/30 bg-(--bg-surface) px-4 py-3 shadow-lg pointer-events-auto"
          >
            <span className="text-(--accent) text-base font-bold" aria-hidden="true">
              ✓
            </span>
            <div>
              <p className="text-sm font-medium text-(--text-1)">{current.title}</p>
              <p className="text-xs text-(--text-2)">{current.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
