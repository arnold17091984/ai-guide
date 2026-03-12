"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { DURATION, EASE_APPLE } from "@/lib/motion";

// ============================================================
// StatCard — Individual stat display with animated count-up
// ============================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: { direction: "up" | "down"; percentage: number };
}

export default function StatCard({ icon, label, value, trend }: StatCardProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.2,
      ease: EASE_APPLE,
    });
    return controls.stop;
  }, [motionValue, value]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (displayRef.current) {
        displayRef.current.textContent = v.toLocaleString();
      }
    });
    return unsubscribe;
  }, [rounded]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.medium, ease: EASE_APPLE }}
      className="relative overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-5 shadow-md backdrop-blur-xl dark:bg-white/5"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-blue-500/5 via-cyan-500/3 to-teal-500/5" />
      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            {icon}
          </span>
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                trend.direction === "up"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    trend.direction === "up"
                      ? "M5 15l7-7 7 7"
                      : "M19 9l-7 7-7-7"
                  }
                />
              </svg>
              {trend.percentage}%
            </span>
          )}
        </div>
        <span
          ref={displayRef}
          className="block text-2xl font-bold tabular-nums text-(--text-1)"
        >
          0
        </span>
        <span className="mt-1 block text-xs font-medium text-(--text-2)">
          {label}
        </span>
      </div>
    </motion.div>
  );
}
