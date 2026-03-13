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
      transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
      className="relative overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface) p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-(--bg-elevated) text-(--text-2)">
          {icon}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-mono font-semibold ${
              trend.direction === "up"
                ? "text-(--accent)"
                : "text-(--danger)"
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
      <span className="mt-1 block text-xs font-mono text-(--text-3)">
        {label}
      </span>
    </motion.div>
  );
}
