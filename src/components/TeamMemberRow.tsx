"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";
import { DURATION, EASE_APPLE } from "@/lib/motion";

// ============================================================
// TeamMemberRow
// ============================================================

interface TeamMemberRowProps {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  reputation: number;
  canManage: boolean;
  isOwner: boolean;
  onRemove?: (userId: string) => void;
  onChangeRole?: (userId: string, role: "admin" | "member") => void;
}

function RoleBadge({ role }: { role: string }) {
  const colorMap: Record<string, string> = {
    owner: "bg-amber-500/10 text-amber-400",
    admin: "bg-(--accent-muted) text-(--accent)",
    member: "bg-(--bg-elevated) text-(--text-2)",
  };

  return (
    <span className={`rounded px-2 py-0.5 text-xs font-mono ${colorMap[role] ?? colorMap.member}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}

export default function TeamMemberRow({
  userId,
  username,
  displayName,
  avatarUrl,
  role,
  reputation,
  canManage,
  isOwner,
  onRemove,
  onChangeRole,
}: TeamMemberRowProps) {
  const locale = useLocale();
  const name = displayName ?? username;
  const initial = name.charAt(0).toUpperCase();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      whileHover={{
        backgroundColor: "var(--bg-elevated)",
        transition: { duration: DURATION.fast, ease: EASE_APPLE },
      }}
      className="flex items-center gap-4 border-b border-(--border) px-4 py-3 transition-colors last:border-b-0"
    >
      {/* Avatar */}
      <Link href={`/${locale}/users/${username}`} className="shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="h-10 w-10 rounded-xl object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--bg-elevated) text-sm font-bold text-(--text-1)">
            {initial}
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/users/${username}`}
            className="truncate text-sm font-medium text-(--text-1) hover:text-(--accent)"
          >
            {name}
          </Link>
          <RoleBadge role={role} />
        </div>
        <span className="text-xs text-(--text-2)">@{username}</span>
      </div>

      {/* Reputation */}
      <span className="hidden text-xs tabular-nums text-(--text-2) sm:block">
        {reputation.toLocaleString()} rep
      </span>

      {/* Action menu */}
      {canManage && role !== "owner" && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md p-1.5 text-(--text-2) hover:bg-(--bg-elevated) transition-colors"
            aria-label="Member actions"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-(--border) bg-(--bg-surface) p-1 shadow-lg">
                {isOwner && onChangeRole && (
                  <button
                    onClick={() => {
                      onChangeRole(userId, role === "admin" ? "member" : "admin");
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-(--text-1) hover:bg-(--bg-elevated) transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {role === "admin" ? "Set as Member" : "Set as Admin"}
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={() => {
                      onRemove(userId);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
