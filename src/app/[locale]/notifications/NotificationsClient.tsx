"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import { getRelativeTime } from "@/lib/utils/relative-time";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/notifications/actions";

// ── Notification type icons ──────────────────────────────────

function getNotificationIcon(type: string) {
  switch (type) {
    case "vote_received":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
        </svg>
      );
    case "comment_reply":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      );
    case "achievement_unlocked":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      );
    case "edit_approved":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "edit_rejected":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "mention":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      );
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case "vote_received":
      return "text-orange-500 bg-orange-500/10";
    case "comment_reply":
      return "text-green-500 bg-green-500/10";
    case "achievement_unlocked":
      return "text-yellow-500 bg-yellow-500/10";
    case "edit_approved":
      return "text-emerald-500 bg-emerald-500/10";
    case "edit_rejected":
      return "text-red-500 bg-red-500/10";
    case "mention":
      return "text-blue-500 bg-blue-500/10";
    default:
      return "text-(--text-2) bg-(--surface)";
  }
}

// ── Types ────────────────────────────────────────────────────

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date;
}

interface Translations {
  title: string;
  subtitle: string;
  markAllRead: string;
  noNotifications: string;
  unread: string;
  deleteConfirm: string;
  all: string;
  unreadFilter: string;
}

interface Props {
  userId: string;
  translations: Translations;
}

// ── Component ────────────────────────────────────────────────

export default function NotificationsClient({ userId, translations: t }: Props) {
  const locale = useLocale();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const rows = await getUserNotifications(userId, {
        limit: 50,
        unreadOnly: filter === "unread",
      });
      setItems(
        rows.map((r) => ({
          id: r.id,
          type: r.type,
          title: r.title,
          body: r.body,
          linkUrl: r.linkUrl,
          isRead: r.isRead,
          createdAt: r.createdAt,
        })),
      );
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(userId);
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch {
      // silently fail — state refreshes on next load
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id, userId);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isRead: true } : item,
        ),
      );
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await deleteNotification(id, userId);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // silently fail — item stays visible
    }
  };

  const hasUnread = items.some((item) => !item.isRead);

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        gradient="from-orange-500 to-amber-500"
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
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
        }
      />

      {/* Controls */}
      <ScrollFadeIn>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                  : "bg-(--surface) text-(--text-2) hover:bg-(--surface-hover)"
              }`}
            >
              {t.all}
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === "unread"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                  : "bg-(--surface) text-(--text-2) hover:bg-(--surface-hover)"
              }`}
            >
              {t.unreadFilter}
            </button>
          </div>
          {hasUnread && (
            <button
              onClick={() => void handleMarkAllRead()}
              className="text-sm font-medium text-(--primary) hover:underline"
            >
              {t.markAllRead}
            </button>
          )}
        </div>
      </ScrollFadeIn>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-(--surface)"
            />
          ))
        ) : fetchError ? (
          <ScrollFadeIn>
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-300/30 bg-red-500/5 py-12 text-center">
              <p className="text-sm text-red-500">Failed to load notifications. Please try again.</p>
              <button
                onClick={() => void fetchItems()}
                className="rounded-lg border border-red-300/30 px-4 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                Retry
              </button>
            </div>
          </ScrollFadeIn>
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
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
              <p className="text-sm">{t.noNotifications}</p>
            </div>
          </ScrollFadeIn>
        ) : (
          items.map((item, i) => (
            <ScrollFadeIn key={item.id} delay={i * 0.03}>
              <div
                className={`group relative overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-4 backdrop-blur-xl transition-all dark:bg-white/5 ${
                  !item.isRead
                    ? "border-blue-300/30 bg-blue-500/5"
                    : "hover:border-blue-300/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getNotificationColor(item.type)}`}
                  >
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-snug ${
                        !item.isRead
                          ? "font-semibold text-(--text-1)"
                          : "font-medium text-(--text-1)"
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-(--text-2)">{item.body}</p>
                    <p className="mt-2 text-xs text-(--text-2)">
                      {getRelativeTime(item.createdAt, locale)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!item.isRead && (
                      <button
                        onClick={() => void handleMarkRead(item.id)}
                        title={t.unread}
                        className="rounded-lg p-1.5 text-(--text-2) hover:bg-(--surface-hover) hover:text-(--text-1)"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => void handleDelete(item.id)}
                      className="rounded-lg p-1.5 text-(--text-2) hover:bg-red-500/10 hover:text-red-500"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </ScrollFadeIn>
          ))
        )}
      </div>
    </>
  );
}
