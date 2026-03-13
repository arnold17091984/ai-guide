"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { EASE_APPLE } from "@/lib/motion";

// ============================================================
// ProgressRing — SVG circular progress for reputation level
// ============================================================

interface LevelDef {
  name: string;
  minScore: number;
}

const LEVELS: LevelDef[] = [
  { name: "Sage", minScore: 15000 },
  { name: "Master", minScore: 5000 },
  { name: "Expert", minScore: 2000 },
  { name: "Practitioner", minScore: 500 },
  { name: "Apprentice", minScore: 100 },
  { name: "Novice", minScore: 0 },
];

function getLevel(reputation: number) {
  for (const level of LEVELS) {
    if (reputation >= level.minScore) return level;
  }
  return LEVELS[LEVELS.length - 1];
}

function getProgress(reputation: number): number {
  const current = getLevel(reputation);
  const currentIndex = LEVELS.indexOf(current);
  const nextLevel = currentIndex > 0 ? LEVELS[currentIndex - 1] : null;
  if (!nextLevel) return 1; // Max level
  const range = nextLevel.minScore - current.minScore;
  const progress = (reputation - current.minScore) / range;
  return Math.min(Math.max(progress, 0), 1);
}

interface ProgressRingProps {
  reputation: number;
  size?: number;
}

export default function ProgressRing({
  reputation,
  size = 140,
}: ProgressRingProps) {
  const level = getLevel(reputation);
  const progress = getProgress(reputation);

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const motionProgress = useMotionValue(0);
  const strokeDashoffset = useTransform(
    motionProgress,
    (v) => circumference * (1 - v),
  );

  useEffect(() => {
    const controls = animate(motionProgress, progress, {
      duration: 1.4,
      ease: EASE_APPLE,
    });
    return controls.stop;
  }, [motionProgress, progress, circumference]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-(--bg-elevated)"
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-(--accent)">
          {level.name}
        </span>
        <span className="text-xs text-(--text-3)">
          {reputation.toLocaleString()} XP
        </span>
      </div>
    </div>
  );
}
