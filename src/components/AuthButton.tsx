"use client";

import { useAuth } from "@/hooks/useAuth";
import { DURATION, EASE_APPLE } from "@/lib/motion";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// GitHub icon (inline SVG — no extra dependency)
// ---------------------------------------------------------------------------
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Dropdown menu item
// ---------------------------------------------------------------------------
function DropdownItem({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-(--text-2) transition-colors hover:bg-(--bg-elevated) hover:text-(--text-1)"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function AuthButton() {
  const { user, loading, signIn, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-(--surface)" />
    );
  }

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (!user) {
    return (
      <motion.button
        onClick={() => void signIn()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 rounded-md border border-(--border) bg-transparent h-9 px-4 text-sm font-medium text-(--text-1) transition-colors hover:bg-(--bg-elevated) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
      >
        <GitHubIcon className="h-4 w-4 text-(--text-2)" />
        Sign in
      </motion.button>
    );
  }

  // ── Authenticated ─────────────────────────────────────────────────────────
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.user_name as string | undefined) ??
    user.email ??
    "User";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      {/* Avatar trigger */}
      <motion.button
        onClick={() => setDropdownOpen((prev) => !prev)}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open account menu"
        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-(--border) bg-(--bg-surface) ring-offset-1 transition-all hover:border-(--accent) hover:ring-2 hover:ring-(--accent)/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-xs font-semibold text-(--text-1)">
            {initials}
          </span>
        )}
        {/* Online indicator */}
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-(--bg) bg-(--accent)" />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
            className="absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-lg border border-(--border) bg-(--bg-surface) p-1.5 shadow-lg"
          >
            {/* User info header */}
            <div className="mb-1 flex items-center gap-3 rounded-md bg-(--bg-elevated) px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--bg-elevated)">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-xs font-semibold text-(--text-1)">
                    {initials}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-(--text-1)">
                  {displayName}
                </p>
                {user.email && (
                  <p className="truncate text-xs text-(--text-2)">{user.email}</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="my-1 h-px bg-(--border)" />

            {/* Actions */}
            <DropdownItem
              onClick={() => {
                setDropdownOpen(false);
                void signOut();
              }}
            >
              {/* Sign-out icon */}
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign out
            </DropdownItem>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
