"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import { getTrendingFeed } from "@/lib/trending/actions";
import TrendingCard from "@/components/TrendingCard";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import type { TrendingItem } from "@/lib/db/schema/trending";

// ============================================================
// Source filter config
// ============================================================
const SOURCES = [
  { key: "all", icon: null },
  {
    key: "github",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    ),
  },
  {
    key: "hackernews",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M0 0h16v16H0V0zm8.7 7.6L12 2h-1.6L8 6.3 5.6 2H4l3.3 5.6V13h1.4V7.6z" />
      </svg>
    ),
  },
  {
    key: "reddit",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-3.828-1.165a1.09 1.09 0 00-1.09-1.09 1.075 1.075 0 00-.752.308 5.3 5.3 0 00-2.898-.876l.567-2.678 1.848.393a.775.775 0 10.123-.59L7.87 1.88a.308.308 0 00-.37.232l-.63 2.986a5.34 5.34 0 00-2.955.876 1.075 1.075 0 00-.752-.308 1.09 1.09 0 00-.472 2.075c-.013.098-.02.197-.02.297 0 2.105 2.453 3.812 5.482 3.812s5.482-1.707 5.482-3.812c0-.1-.007-.199-.02-.297a1.088 1.088 0 00.617-1.006zM5.33 9.124a.775.775 0 111.55 0 .775.775 0 01-1.55 0zm4.468 2.068c-.547.547-1.586.59-1.798.59-.212 0-1.251-.043-1.798-.59a.26.26 0 01.37-.368c.344.344 1.08.465 1.428.465.348 0 1.084-.121 1.428-.465a.26.26 0 01.37.368zm-.087-1.293a.775.775 0 110-1.55.775.775 0 010 1.55z" />
      </svg>
    ),
  },
  {
    key: "twitter",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M9.333 6.929L14.546 1h-1.235L8.783 6.147 5.17 1H1l5.466 7.783L1 15h1.235l4.779-5.436L10.83 15H15L9.333 6.929zM7.64 8.852l-.554-.776L2.68 1.911h1.898l3.557 4.979.554.776 4.623 6.47h-1.898L7.64 8.852z" />
      </svg>
    ),
  },
  {
    key: "producthunt",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1.2 8.4H7.2V5.6h2c.883 0 1.6.717 1.6 1.4s-.717 1.4-1.6 1.4zM9.2 4H5.6v8h1.6V10h2a3 3 0 003-3 3 3 0 00-3-3z" />
      </svg>
    ),
  },
] as const;

// ============================================================
// Skeleton card
// ============================================================
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-(--border) bg-(--bg-surface) p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-white/10" />
        <div className="h-3 w-8 rounded bg-gray-200 dark:bg-white/10" />
      </div>
      <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-white/10 mb-2" />
      <div className="h-3 w-full rounded bg-gray-200 dark:bg-white/10 mb-1" />
      <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-white/10 mb-3" />
      <div className="flex gap-1 mb-3">
        <div className="h-4 w-12 rounded-full bg-gray-200 dark:bg-white/10" />
        <div className="h-4 w-10 rounded-full bg-gray-200 dark:bg-white/10" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="h-3 w-16 rounded bg-gray-200 dark:bg-white/10" />
          <div className="h-3 w-12 rounded bg-gray-200 dark:bg-white/10" />
        </div>
        <div className="h-6 w-6 rounded bg-gray-200 dark:bg-white/10" />
      </div>
    </div>
  );
}

// ============================================================
// Main client component
// ============================================================
interface TrendingFeedClientProps {
  initialItems: TrendingItem[];
  itemCounts: Record<string, number>;
  translations: {
    sourcesAll: string;
    sourcesGithub: string;
    sourcesHackernews: string;
    sourcesReddit: string;
    sourcesTwitter: string;
    sourcesProducthunt: string;
    sortHot: string;
    sortNew: string;
    loadMore: string;
    noResults: string;
    cardComments: string;
    cardPoints: string;
    cardBookmark: string;
    cardBookmarked: string;
  };
}

const SOURCE_LABEL_KEYS: Record<string, keyof TrendingFeedClientProps["translations"]> = {
  all: "sourcesAll",
  github: "sourcesGithub",
  hackernews: "sourcesHackernews",
  reddit: "sourcesReddit",
  twitter: "sourcesTwitter",
  producthunt: "sourcesProducthunt",
};

const PAGE_SIZE = 12;

export default function TrendingFeedClient({
  initialItems,
  itemCounts,
  translations: t,
}: TrendingFeedClientProps) {
  const [activeSource, setActiveSource] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score" | "publishedAt">("score");
  const [items, setItems] = useState<TrendingItem[]>(initialItems);
  const [offset, setOffset] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(initialItems.length >= PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [, startTransition] = useTransition();

  const totalCount = Object.values(itemCounts).reduce((a, b) => a + b, 0);

  const handleSourceChange = (source: string) => {
    setActiveSource(source);
    setIsLoading(true);
    setFetchError(false);
    startTransition(async () => {
      try {
        const newItems = await getTrendingFeed({
          source: source === "all" ? undefined : source,
          sortBy,
          limit: PAGE_SIZE,
          offset: 0,
        });
        setItems(newItems);
        setOffset(PAGE_SIZE);
        setHasMore(newItems.length >= PAGE_SIZE);
      } catch {
        setFetchError(true);
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleSortChange = (newSort: "score" | "publishedAt") => {
    setSortBy(newSort);
    setIsLoading(true);
    setFetchError(false);
    startTransition(async () => {
      try {
        const newItems = await getTrendingFeed({
          source: activeSource === "all" ? undefined : activeSource,
          sortBy: newSort,
          limit: PAGE_SIZE,
          offset: 0,
        });
        setItems(newItems);
        setOffset(PAGE_SIZE);
        setHasMore(newItems.length >= PAGE_SIZE);
      } catch {
        setFetchError(true);
      } finally {
        setIsLoading(false);
      }
    });
  };

  const loadMore = () => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const newItems = await getTrendingFeed({
          source: activeSource === "all" ? undefined : activeSource,
          sortBy,
          limit: PAGE_SIZE,
          offset,
        });
        setItems((prev) => [...prev, ...newItems]);
        setOffset((prev) => prev + PAGE_SIZE);
        setHasMore(newItems.length >= PAGE_SIZE);
      } catch {
        // load-more failure is non-critical — existing items stay visible
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Source filter pills */}
      <div className="flex flex-wrap gap-2">
        {SOURCES.map(({ key, icon }) => {
          const labelKey = SOURCE_LABEL_KEYS[key]!;
          const label = t[labelKey];
          const count = key === "all" ? totalCount : (itemCounts[key] ?? 0);
          const isActive = activeSource === key;

          return (
            <button
              key={key}
              onClick={() => handleSourceChange(key)}
              className={`inline-flex items-center gap-1.5 rounded px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-(--accent-muted) text-(--accent)"
                  : "border border-(--border) bg-(--bg-surface) text-(--text-2) hover:bg-(--bg-elevated)"
              }`}
            >
              {icon}
              {label}
              <span
                className={`ml-0.5 text-xs ${
                  isActive ? "text-white/70" : "text-(--text-2)/60"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sort toggle */}
      <div className="flex items-center gap-1 rounded-md border border-(--border) bg-(--bg-surface) p-1 w-fit">
        <button
          onClick={() => handleSortChange("score")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
            sortBy === "score"
              ? "bg-(--accent-muted) text-(--accent)"
              : "text-(--text-2) hover:text-(--text-1)"
          }`}
        >
          {t.sortHot}
        </button>
        <button
          onClick={() => handleSortChange("publishedAt")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
            sortBy === "publishedAt"
              ? "bg-(--accent-muted) text-(--accent)"
              : "text-(--text-2) hover:text-(--text-1)"
          }`}
        >
          {t.sortNew}
        </button>
      </div>

      {/* Grid */}
      {isLoading && items.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 py-12 text-center">
          <p className="text-sm text-red-500">Failed to load trending items. Please try again.</p>
          <button
            onClick={() => handleSourceChange(activeSource)}
            className="rounded-lg border border-red-300/30 px-4 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-(--border) bg-(--bg-surface) py-16 text-center">
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
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm text-(--text-2)">{t.noResults}</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item, i) => (
            <ScrollFadeIn key={item.id} delay={i * 0.05}>
              <TrendingCard
                item={item}
                translations={{
                  comments: t.cardComments,
                  points: t.cardPoints,
                  bookmark: t.cardBookmark,
                  bookmarked: t.cardBookmarked,
                }}
              />
            </ScrollFadeIn>
          ))}
        </motion.div>
      )}

      {/* Load more */}
      {hasMore && items.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="rounded-md border border-(--border) bg-(--bg-surface) px-6 py-2.5 text-sm font-medium text-(--text-1) transition-all hover:bg-(--bg-elevated) disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                {t.loadMore}
              </span>
            ) : (
              t.loadMore
            )}
          </button>
        </div>
      )}
    </div>
  );
}
