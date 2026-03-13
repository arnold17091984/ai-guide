"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, DURATION, EASE_APPLE } from "@/lib/motion";
import ProfileEditForm from "./ProfileEditForm";
import type { CurrentUser } from "@/lib/auth/get-current-user";

// ============================================================
// ProfileEditToggle
// ============================================================
// Client wrapper that owns the open/closed state for the
// edit form so the parent Profile page can remain a Server
// Component.

interface ProfileEditToggleProps {
  user: CurrentUser;
  bio: string | null;
  websiteUrl: string | null;
  editLabel: string;
}

export default function ProfileEditToggle({
  user,
  bio,
  websiteUrl,
  editLabel,
}: ProfileEditToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <AnimatePresence mode="wait">
        {isOpen ? (
          <ProfileEditForm
            key="form"
            user={user}
            bio={bio}
            websiteUrl={websiteUrl}
            onClose={() => setIsOpen(false)}
          />
        ) : (
          <motion.button
            key="button"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -8, transition: { duration: DURATION.fast, ease: EASE_APPLE } }}
            onClick={() => setIsOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-(--border) bg-transparent h-9 px-6 text-sm font-medium text-(--text-1) transition-all hover:bg-(--bg-elevated) hover:border-(--border-hover)"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            {editLabel}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
