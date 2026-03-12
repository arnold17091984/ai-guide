"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import TrendingCard from "@/components/TrendingCard";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import type { TrendingItem, UserBookmark } from "@/lib/db/schema/trending";

interface BookmarksClientProps {
  initialBookmarks: { bookmark: UserBookmark; item: TrendingItem }[];
  translations: {
    empty: string;
    remove: string;
    comments: string;
    points: string;
    bookmark: string;
    bookmarked: string;
  };
}

export default function BookmarksClient({
  initialBookmarks,
  translations: t,
}: BookmarksClientProps) {
  if (initialBookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-(--border) bg-white/50 py-16 text-center backdrop-blur-xl dark:bg-white/5">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="mb-4 h-12 w-12 text-(--text-2)/40"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
        <p className="text-sm text-(--text-2)">{t.empty}</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {initialBookmarks.map(({ item }, i) => (
        <ScrollFadeIn key={item.id} delay={i * 0.05}>
          <TrendingCard
            item={item}
            initialBookmarked={true}
            translations={{
              comments: t.comments,
              points: t.points,
              bookmark: t.bookmark,
              bookmarked: t.bookmarked,
            }}
          />
        </ScrollFadeIn>
      ))}
    </motion.div>
  );
}
