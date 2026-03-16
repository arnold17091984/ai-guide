"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { DURATION, EASE_APPLE } from "@/lib/motion";
import { getRelativeTime } from "@/lib/utils/relative-time";
import {
  getUnreadCount,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from "@/lib/notifications/actions";

// ── Notification type icons ──────────────────────────────────

function VoteReceivedIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
    </svg>
  );
}

function CommentReplyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function AchievementUnlockedIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.52.867m0 0c-.423.077-.856.132-1.296.164a48.108 48.108 0 01-.592.01m0 0a48.108 48.108 0 01-.592-.01m0 0a6.023 6.023 0 01-1.296-.164" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MentionIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "vote_received":
      return <VoteReceivedIcon />;
    case "comment_reply":
      return <CommentReplyIcon />;
    case "achievement_unlocked":
      return <AchievementUnlockedIcon />;
    case "edit_approved":
    case "edit_rejected":
      return <EditIcon />;
    case "mention":
      return <MentionIcon />;
    case "system":
    default:
      return <SystemIcon />;
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case "vote_received":
      return "text-orange-500";
    case "comment_reply":
      return "text-green-500";
    case "achievement_unlocked":
      return "text-yellow-500";
    case "edit_approved":
      return "text-emerald-500";
    case "edit_rejected":
      return "text-red-500";
    case "mention":
      return "text-(--info)";
    case "system":
    default:
      return "text-(--text-2)";
  }
}

// ── Types ────────────────────────────────────────────────────

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date;
}

// ── Main component ───────────────────────────────────────────

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const fetchCount = useCallback(async () => {
    try {
      const count = await getUnreadCount(userId);
      setUnreadCount(count);
    } catch {
      // silently fail
    }
  }, [userId]);

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(() => void fetchCount(), 30_000);
    // Initial fetch via zero-delay timer to avoid synchronous setState in effect
    const timer = setTimeout(() => void fetchCount(), 0);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [fetchCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getUserNotifications(userId, { limit: 10 })
      .then((rows) => {
        if (cancelled) return;
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
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, userId]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(userId);
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail — badge stays accurate on next poll
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await markAsRead(item.id, userId);
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silently fail — read status will sync on next open
      }
    }
    setOpen(false);
    if (item.linkUrl) {
      router.push(item.linkUrl);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <motion.button
        onClick={() => setOpen((prev) => {
          if (!prev) setLoading(true);
          return !prev;
        })}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t("title")}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-(--border) bg-(--bg-surface) text-(--text-2) transition-colors hover:bg-(--bg-elevated) hover:text-(--text-1) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
      >
        <svg
          className="h-5 w-5"
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
        {/* Unread badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
            className="absolute right-0 z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface) shadow-lg sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
              <h3 className="text-sm font-semibold text-(--text-1)">
                {t("title")}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => void handleMarkAllRead()}
                  className="text-xs font-medium text-(--accent) hover:underline"
                >
                  {t("markAllRead")}
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-(--border) border-t-(--accent)" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-(--text-2)">
                  <svg
                    className="h-8 w-8"
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
                  <p className="text-sm">{t("noNotifications")}</p>
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => void handleNotificationClick(item)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-(--bg-elevated) ${
                      !item.isRead ? "bg-(--accent-muted)" : ""
                    }`}
                  >
                    <div
                      className={`mt-0.5 shrink-0 ${getNotificationColor(item.type)}`}
                    >
                      {getNotificationIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-snug ${
                          !item.isRead
                            ? "font-medium text-(--text-1)"
                            : "text-(--text-2)"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-(--text-2)">
                        {item.body}
                      </p>
                      <p className="mt-1 text-[10px] text-(--text-2)">
                        {getRelativeTime(item.createdAt, locale)}
                      </p>
                    </div>
                    {!item.isRead && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-(--accent)" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-(--border) px-4 py-2.5">
              <Link
                href={`/${locale}/notifications`}
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-medium text-(--accent) hover:underline"
              >
                {t("viewAll")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
