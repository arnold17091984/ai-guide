"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import { inviteToTeam } from "@/lib/teams/actions";

// ============================================================
// InviteModal
// ============================================================

interface PendingInvite {
  id: string;
  email: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  pendingInvites: PendingInvite[];
}

export default function InviteModal({
  isOpen,
  onClose,
  teamId,
  pendingInvites,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    startTransition(async () => {
      try {
        await inviteToTeam(teamId, email.trim());
        setSuccess(true);
        setEmail("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send invite");
      }
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.normal }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
            className="fixed inset-x-4 top-[20%] z-50 mx-auto max-w-md rounded-2xl border border-(--border) bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:bg-gray-900/90 sm:inset-x-auto"
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-(--text-1)">
                Invite Members
              </h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-(--text-2) hover:bg-(--surface-hover) transition-colors"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Invite form */}
            <form onSubmit={handleSubmit} className="mb-5">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="min-w-0 flex-1 rounded-xl border border-(--border) bg-(--surface) px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  disabled={isPending}
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="shrink-0 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
                >
                  {isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    "Send"
                  )}
                </button>
              </div>

              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
              {success && (
                <p className="mt-2 text-sm text-emerald-500">
                  Invite sent successfully!
                </p>
              )}
            </form>

            {/* Pending invites */}
            {pendingInvites.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                  Pending Invites
                </h4>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-lg bg-(--surface) px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-(--text-1)">
                          {invite.email}
                        </p>
                        <p className="text-xs text-(--text-2)">
                          Expires{" "}
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
