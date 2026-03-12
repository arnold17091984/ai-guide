"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import ActivityItem, { type ActivityItemProps } from "@/components/ActivityItem";
import { getPublicActivityFeed } from "@/lib/activity/actions";

type FilterTab = "all" | "entries" | "skills" | "social";

const filterToActionTypes: Record<FilterTab, string | undefined> = {
  all: undefined,
  entries: "published_entry",
  skills: "published_skill",
  social: "commented",
};

interface Translations {
  title: string;
  subtitle: string;
  all: string;
  entries: string;
  skills: string;
  social: string;
  loadMore: string;
  noActivity: string;
}

interface Props {
  translations: Translations;
}

export default function ActivityFeedClient({ translations: t }: Props) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [items, setItems] = useState<ActivityItemProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 20;

  const fetchItems = useCallback(
    async (offset: number, append: boolean) => {
      const setter = append ? setLoadingMore : setLoading;
      setter(true);
      try {
        const rows = await getPublicActivityFeed({
          limit: PAGE_SIZE,
          offset,
          actionType: filterToActionTypes[filter],
        });
        const mapped: ActivityItemProps[] = rows.map((r) => ({
          id: r.id,
          actorUsername: r.actorUsername,
          actorDisplayName: r.actorDisplayName,
          actorAvatarUrl: r.actorAvatarUrl,
          actionType: r.actionType,
          targetType: r.targetType,
          targetId: r.targetId,
          targetTitle: r.targetTitle,
          createdAt: r.createdAt,
        }));
        if (append) {
          setItems((prev) => [...prev, ...mapped]);
        } else {
          setItems(mapped);
        }
        setHasMore(mapped.length === PAGE_SIZE);
      } finally {
        setter(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    void fetchItems(0, false);
  }, [fetchItems]);

  const handleLoadMore = () => {
    void fetchItems(items.length, true);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: t.all },
    { key: "entries", label: t.entries },
    { key: "skills", label: t.skills },
    { key: "social", label: t.social },
  ];

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        gradient="from-green-500 to-emerald-600"
        icon={
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
            />
          </svg>
        }
      />

      {/* Filter tabs */}
      <ScrollFadeIn>
        <div className="mb-6 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === tab.key
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                  : "bg-(--surface) text-(--text-2) hover:bg-(--surface-hover) hover:text-(--text-1)"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </ScrollFadeIn>

      {/* Activity list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-(--surface)"
            />
          ))
        ) : items.length === 0 ? (
          <ScrollFadeIn>
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-(--border) bg-white/70 py-16 text-(--text-2) backdrop-blur-xl dark:bg-white/5">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
              <p className="text-sm">{t.noActivity}</p>
            </div>
          </ScrollFadeIn>
        ) : (
          items.map((item, i) => (
            <ScrollFadeIn key={item.id} delay={i * 0.05}>
              <ActivityItem {...item} />
            </ScrollFadeIn>
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && !loading && items.length > 0 && (
        <ScrollFadeIn>
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="rounded-full border border-(--border) bg-(--surface) px-6 py-2.5 text-sm font-medium text-(--text-1) transition-all hover:bg-(--surface-hover) hover:shadow-md disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--border) border-t-(--primary)" />
                  Loading...
                </span>
              ) : (
                t.loadMore
              )}
            </button>
          </div>
        </ScrollFadeIn>
      )}
    </>
  );
}
