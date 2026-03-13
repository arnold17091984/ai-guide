"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite, declineInvite } from "@/lib/teams/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Labels {
  acceptInvite: string;
  declineInvite: string;
}

interface InviteActionsProps {
  token: string;
  locale: string;
  teamSlug: string;
  isLoggedIn: boolean;
  labels: Labels;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InviteActions({
  token,
  locale,
  teamSlug,
  isLoggedIn,
  labels,
}: InviteActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      try {
        await acceptInvite(token);
        router.push(`/${locale}/teams/${teamSlug}`);
        router.refresh();
      } catch {
        // acceptInvite throws on error; redirect to login is handled server-side
      }
    });
  }

  function handleDecline() {
    startTransition(async () => {
      try {
        await declineInvite(token);
        router.push(`/${locale}/teams`);
        router.refresh();
      } catch {
        // ignore
      }
    });
  }

  if (!isLoggedIn) {
    // Redirect to login; after login the user can come back to this URL
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          href={`/${locale}/auth/login?next=/${locale}/teams/invite/${token}`}
          className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-600"
        >
          {labels.acceptInvite}
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <button
        onClick={handleAccept}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
      >
        {isPending ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
        {labels.acceptInvite}
      </button>

      <button
        onClick={handleDecline}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl border border-(--border) px-6 py-3 text-sm font-medium text-(--text-2) transition-colors hover:bg-(--surface-hover) disabled:opacity-50"
      >
        {labels.declineInvite}
      </button>
    </div>
  );
}
