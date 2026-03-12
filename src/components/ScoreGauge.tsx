"use client";

import { motion } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: number;
}

function getColor(score: number): { stroke: string; text: string; glow: string } {
  if (score >= 70) {
    return {
      stroke: "#22c55e",
      text: "text-green-500",
      glow: "drop-shadow(0 0 8px rgba(34,197,94,0.5))",
    };
  }
  if (score >= 40) {
    return {
      stroke: "#eab308",
      text: "text-yellow-500",
      glow: "drop-shadow(0 0 8px rgba(234,179,8,0.5))",
    };
  }
  return {
    stroke: "#ef4444",
    text: "text-red-500",
    glow: "drop-shadow(0 0 8px rgba(239,68,68,0.5))",
  };
}

export default function ScoreGauge({ score, label, size = 120 }: ScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clampedScore / 100);
  const center = size / 2;
  const { stroke, text, glow } = getColor(clampedScore);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Track ring */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={8}
            className="text-white/10"
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: DURATION.slow * 1.5, ease: EASE_APPLE, delay: 0.2 }}
            style={{ filter: glow }}
          />
        </svg>

        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-2xl font-bold tabular-nums ${text}`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DURATION.medium, ease: EASE_APPLE, delay: 0.4 }}
          >
            {clampedScore}
          </motion.span>
          <span className="text-xs text-(--text-2)">/100</span>
        </div>
      </div>

      <span className="text-sm font-medium text-(--text-1)">{label}</span>
    </div>
  );
}
