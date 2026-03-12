"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import { getRelativeTime } from "@/lib/utils/relative-time";

// ── Action type icons (inline SVG) ──────────────────────────

function PublishIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function VoteIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
    </svg>
  );
}

function AchievementIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function SkillIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function LevelIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function getActionIcon(actionType: string) {
  switch (actionType) {
    case "published_entry":
      return <PublishIcon />;
    case "published_skill":
      return <SkillIcon />;
    case "commented":
      return <CommentIcon />;
    case "voted":
      return <VoteIcon />;
    case "earned_achievement":
      return <AchievementIcon />;
    case "reached_level":
      return <LevelIcon />;
    case "edited_entry":
      return <EditIcon />;
    default:
      return <PublishIcon />;
  }
}

function getActionColor(actionType: string) {
  switch (actionType) {
    case "published_entry":
      return "text-blue-500 bg-blue-500/10";
    case "published_skill":
      return "text-purple-500 bg-purple-500/10";
    case "commented":
      return "text-green-500 bg-green-500/10";
    case "voted":
      return "text-orange-500 bg-orange-500/10";
    case "earned_achievement":
      return "text-yellow-500 bg-yellow-500/10";
    case "reached_level":
      return "text-cyan-500 bg-cyan-500/10";
    case "edited_entry":
      return "text-teal-500 bg-teal-500/10";
    default:
      return "text-(--text-2) bg-(--surface)";
  }
}

// ── Action descriptions by locale ────────────────────────────

const actionDescriptions: Record<string, Record<string, string>> = {
  en: {
    published_entry: "published an entry",
    published_skill: "published a skill",
    commented: "commented on",
    voted: "voted on",
    earned_achievement: "earned an achievement",
    reached_level: "reached a new level",
    edited_entry: "edited",
  },
  ko: {
    published_entry: "아티클을 게시했습니다",
    published_skill: "스킬을 게시했습니다",
    commented: "에 댓글을 남겼습니다",
    voted: "에 투표했습니다",
    earned_achievement: "업적을 달성했습니다",
    reached_level: "새로운 레벨에 도달했습니다",
    edited_entry: "을(를) 편집했습니다",
  },
  ja: {
    published_entry: "記事を公開しました",
    published_skill: "スキルを公開しました",
    commented: "にコメントしました",
    voted: "に投票しました",
    earned_achievement: "実績を獲得しました",
    reached_level: "新しいレベルに到達しました",
    edited_entry: "を編集しました",
  },
};

// ── Props ────────────────────────────────────────────────────

export interface ActivityItemProps {
  id: string;
  actorUsername: string | null;
  actorDisplayName: string | null;
  actorAvatarUrl: string | null;
  actionType: string;
  targetType: string;
  targetId: string;
  targetTitle: string;
  createdAt: Date;
}

export default function ActivityItem({
  actorUsername,
  actorDisplayName,
  actorAvatarUrl,
  actionType,
  targetTitle,
  createdAt,
}: ActivityItemProps) {
  const locale = useLocale();
  const descriptions = actionDescriptions[locale] ?? actionDescriptions.en;
  const actionText = descriptions[actionType] ?? actionType;
  const displayName = actorDisplayName ?? actorUsername ?? "User";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      whileHover={{
        y: -2,
        transition: { duration: DURATION.fast, ease: EASE_APPLE },
      }}
      className="group relative overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-4 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-blue-300/50 hover:shadow-md hover:shadow-blue-500/10 dark:bg-white/5 dark:hover:border-cyan-500/30"
    >
      <div className="flex items-start gap-3">
        {/* Action icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getActionColor(actionType)}`}
        >
          {getActionIcon(actionType)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {/* Actor avatar */}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--surface) text-xs font-semibold text-(--text-2)">
              {actorAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={actorAvatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <Link
              href="#"
              className="truncate text-sm font-medium text-(--text-1) hover:text-(--primary)"
            >
              {displayName}
            </Link>
          </div>

          <p className="mt-1 text-sm text-(--text-2)">
            {locale === "ko" || locale === "ja" ? (
              <>
                <span className="font-medium text-(--text-1)">{targetTitle}</span>
                {actionText}
              </>
            ) : (
              <>
                {actionText}{" "}
                <span className="font-medium text-(--text-1)">{targetTitle}</span>
              </>
            )}
          </p>
        </div>

        {/* Timestamp */}
        <span className="shrink-0 text-xs text-(--text-2)">
          {getRelativeTime(createdAt, locale)}
        </span>
      </div>
    </motion.div>
  );
}
