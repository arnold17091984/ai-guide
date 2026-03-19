"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "ai-guide-streak-dates";

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sorted = [...new Set(dates)].sort().reverse();
  const today = getTodayISO();

  // If neither today nor yesterday is present, streak is broken
  if (sorted[0] !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().slice(0, 10);
    if (sorted[0] !== yesterdayISO) return 0;
  }

  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = new Date(sorted[i]);
    const next = new Date(sorted[i + 1]);
    const diffDays = Math.round(
      (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function recordTodayAndGetStreak(): { streak: number; isNew: boolean } {
  const today = getTodayISO();
  let dates: string[] = [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      dates = JSON.parse(stored) as string[];
    }
  } catch {
    dates = [];
  }

  const alreadyRecorded = dates.includes(today);
  if (!alreadyRecorded) {
    dates.push(today);
    // Keep only the last 90 days to avoid unbounded growth
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffISO = cutoff.toISOString().slice(0, 10);
    dates = dates.filter((d) => d >= cutoffISO);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
  }

  const streak = calculateStreak(dates);
  return { streak, isNew: !alreadyRecorded };
}

export default function StreakBadge() {
  const t = useTranslations("gamification");
  const [streak, setStreak] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const { streak: s, isNew } = recordTodayAndGetStreak();
    setStreak(s);
    if (isNew && s > 1) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  if (streak === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={streak}
        initial={animate ? { scale: 1.2 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex items-center gap-1 rounded-full bg-(--bg-elevated) px-2.5 py-1 text-xs font-mono"
        title={t("streak", { count: streak })}
      >
        <span className="text-orange-400" aria-hidden="true">
          🔥
        </span>
        <span className="text-(--text-1) tabular-nums">{streak}</span>
      </motion.div>
    </AnimatePresence>
  );
}
