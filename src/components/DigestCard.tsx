"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";

interface DigestCardProps {
  rank: number;
  title: string;
  author?: string;
  metric: number;
  metricLabel: string;
  href: string;
  type: "entry" | "skill" | "contributor";
}

export default function DigestCard({
  rank,
  title,
  author,
  metric,
  metricLabel,
  href,
  type,
}: DigestCardProps) {
  const locale = useLocale();

  const metricIcon =
    type === "entry" ? (
      // Upvote arrow icon
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    ) : type === "skill" ? (
      // Download icon
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ) : (
      // Star icon
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    );

  return (
    <Link href={`/${locale}${href}`}>
      <motion.div
        whileHover={{
          y: -2,
          transition: { duration: DURATION.fast, ease: EASE_APPLE },
        }}
        className="group flex items-center gap-4 rounded-lg border border-(--border) bg-(--bg-surface) p-4 transition-colors hover:border-(--border-hover)"
      >
        {/* Rank */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-(--accent) text-lg font-bold text-black">
          {rank}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-(--text-1) group-hover:text-(--accent) transition-colors">
            {title}
          </h4>
          {author && (
            <p className="truncate text-xs text-(--text-2)">{author}</p>
          )}
        </div>

        {/* Metric */}
        <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-(--text-3)">
          {metricIcon}
          <span>{metric.toLocaleString()}</span>
        </div>
      </motion.div>
    </Link>
  );
}
