import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { getTeamInviteByToken } from "@/lib/teams/actions";
import InviteActions from "./InviteActions";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function EnvelopeIcon() {
  return (
    <svg
      className="h-12 w-12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { locale, token } = await params;
  const t = await getTranslations("teams");
  const currentUser = await getCurrentUser();

  const inviteData = await getTeamInviteByToken(token);

  // Invalid or not found
  if (!inviteData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto max-w-md rounded-2xl border border-(--border) bg-white/70 p-10 text-center shadow-md backdrop-blur-xl dark:bg-white/5">
          <div className="mb-4 flex justify-center text-red-400">
            <svg
              className="h-12 w-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-(--text-1)">{t("inviteInvalid")}</h1>
        </div>
      </div>
    );
  }

  const { invite, teamName, teamSlug, teamAvatarUrl, inviterUsername, inviterDisplayName } =
    inviteData;

  // Expired
  const isExpired =
    invite.status !== "pending" || new Date() > new Date(invite.expiresAt);

  if (isExpired) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto max-w-md rounded-2xl border border-(--border) bg-white/70 p-10 text-center shadow-md backdrop-blur-xl dark:bg-white/5">
          <div className="mb-4 flex justify-center text-amber-400">
            <svg
              className="h-12 w-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-(--text-1)">{t("inviteExpired")}</h1>
        </div>
      </div>
    );
  }

  const inviterName = inviterDisplayName ?? inviterUsername;
  const teamInitial = teamName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-(--border) bg-white/70 p-10 text-center shadow-md backdrop-blur-xl dark:bg-white/5">
        {/* Envelope icon */}
        <div className="mb-6 flex justify-center text-cyan-500">
          <EnvelopeIcon />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-(--text-1)">
          {t("inviteTitle")}
        </h1>

        <p className="mb-6 text-sm text-(--text-2)">
          {t("inviteBy")}:{" "}
          <span className="font-medium text-(--text-1)">{inviterName}</span>
        </p>

        {/* Team card */}
        <div className="mb-8 flex items-center gap-4 rounded-xl border border-(--border) bg-(--surface) p-4 text-left">
          {teamAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={teamAvatarUrl}
              alt={teamName}
              className="h-14 w-14 rounded-xl object-cover ring-2 ring-cyan-400/20"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-500 text-xl font-bold text-white ring-2 ring-cyan-400/20">
              {teamInitial}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-(--text-1)">{teamName}</p>
            <p className="text-sm text-(--text-2)">/{teamSlug}</p>
          </div>
        </div>

        {/* Accept / Decline buttons */}
        <InviteActions
          token={token}
          locale={locale}
          teamSlug={teamSlug}
          isLoggedIn={!!currentUser}
          labels={{
            acceptInvite: t("acceptInvite"),
            declineInvite: t("declineInvite"),
          }}
        />
      </div>
    </div>
  );
}
