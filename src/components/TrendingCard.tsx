"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import { bookmarkItem } from "@/lib/trending/actions";
import SourceBadge from "./SourceBadge";
import type { TrendingItem } from "@/lib/db/schema/trending";

interface TrendingCardProps {
  item: TrendingItem;
  initialBookmarked?: boolean;
  translations: {
    comments: string;
    points: string;
    bookmark: string;
    bookmarked: string;
  };
}

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export default function TrendingCard({
  item,
  initialBookmarked = false,
  translations: t,
}: TrendingCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  const handleBookmark = () => {
    // Optimistic update
    setIsBookmarked((prev) => !prev);
    startTransition(async () => {
      try {
        const result = await bookmarkItem(item.id);
        setIsBookmarked(result.bookmarked);
      } catch {
        // Revert optimistic update
        setIsBookmarked((prev) => !prev);
      }
    });
  };

  const tags = Array.isArray(item.tags) ? (item.tags as string[]) : [];

  return (
    <motion.div
      whileHover={{
        y: -2,
        transition: { duration: DURATION.normal, ease: EASE_APPLE },
      }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface) p-5 shadow-sm transition-all duration-300 hover:border-(--border-hover)"
    >
      <div className="flex flex-col gap-3">
        {/* Header: source badge + time */}
        <div className="flex items-center justify-between">
          <SourceBadge source={item.source} />
          <span className="text-xs text-(--text-3)">
            {relativeTime(new Date(item.publishedAt))}
          </span>
        </div>

        {/* Title */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold leading-snug text-(--text-1) hover:text-(--accent) transition-colors line-clamp-2"
        >
          {item.title}
        </a>

        {/* Description */}
        {item.description && (
          <p className="text-xs leading-relaxed text-(--text-2) line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded px-2 py-0.5 text-[10px] font-mono bg-(--bg-elevated) text-(--text-3)"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: author, stats, bookmark */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            {/* Author */}
            {item.authorName && (
              <div className="flex items-center gap-1.5">
                {item.authorAvatarUrl ? (
                  <img
                    src={item.authorAvatarUrl}
                    alt={item.authorName}
                    className="h-4 w-4 rounded-full"
                  />
                ) : (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-(--bg-elevated)">
                    <span className="text-[8px] font-bold text-(--text-3)">
                      {item.authorName[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs text-(--text-2)">{item.authorName}</span>
              </div>
            )}

            {/* Score */}
            <span className="flex items-center gap-0.5 text-xs text-(--text-3)">
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path d="M8 1l2.5 5 5.5.8-4 3.9.9 5.5L8 13.4l-4.9 2.8.9-5.5-4-3.9L5.5 6z" />
              </svg>
              {item.score} {t.points}
            </span>

            {/* Comments */}
            <span className="flex items-center gap-0.5 text-xs text-(--text-3)">
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path d="M1 2.5A1.5 1.5 0 012.5 1h11A1.5 1.5 0 0115 2.5v8A1.5 1.5 0 0113.5 12H5l-4 4V2.5z" />
              </svg>
              {item.commentCount} {t.comments}
            </span>
          </div>

          {/* Bookmark button */}
          <button
            onClick={handleBookmark}
            disabled={isPending}
            aria-label={isBookmarked ? t.bookmarked : t.bookmark}
            className="rounded-md p-1.5 transition-colors hover:bg-(--bg-elevated)"
          >
            <svg
              viewBox="0 0 16 16"
              className={`h-4 w-4 transition-colors ${
                isBookmarked
                  ? "fill-rose-500 text-rose-500"
                  : "fill-none text-(--text-3) hover:text-rose-400"
              }`}
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
