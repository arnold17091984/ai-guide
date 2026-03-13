import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import ReputationBadge from "@/components/ReputationBadge";
import ProfileEditToggle from "@/components/ProfileEditToggle";

// ============================================================
// Profile page — Server Component
// ============================================================

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/${locale}`);
  }

  // Fetch the full profile row (getCurrentUser returns a subset)
  type UserRow = typeof users.$inferSelect;
  let profile: UserRow | null = null;
  try {
    profile = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1)
      .then((rows) => rows[0] ?? null);
  } catch {
    redirect(`/${locale}`);
  }

  if (!profile) {
    redirect(`/${locale}`);
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const roleBadgeClass: Record<string, string> = {
    admin:
      "bg-red-50 text-red-700 border-red-300/50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/40",
    moderator:
      "bg-orange-50 text-orange-700 border-orange-300/50 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700/40",
    contributor:
      "bg-blue-50 text-blue-700 border-blue-300/50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700/40",
    viewer:
      "bg-gray-50 text-gray-600 border-gray-300/50 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/40",
  };

  const roleClass = roleBadgeClass[profile.role] ?? roleBadgeClass.viewer;

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        gradient="from-blue-500 to-cyan-500"
        icon={
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        }
      />

      <div className="mx-auto max-w-2xl space-y-6">
        {/* ── Avatar + identity card ── */}
        <ScrollFadeIn>
          <div className="relative overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-6 shadow-md backdrop-blur-xl dark:bg-white/5">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-blue-500/5 via-cyan-500/3 to-teal-500/5" />

            <div className="relative z-10 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName ?? profile.username}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-2xl object-cover ring-2 ring-blue-400/30"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-cyan-500 text-3xl font-bold text-white ring-2 ring-blue-400/30">
                    {(profile.displayName ?? profile.username)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                {profile.isVerified && (
                  <span
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900"
                    title={t("verified")}
                  >
                    <svg
                      className="h-3.5 w-3.5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>

              {/* Identity */}
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h2 className="text-2xl font-bold text-(--text-1)">
                    {profile.displayName ?? profile.username}
                  </h2>
                  {profile.isVerified && (
                    <span className="text-xs font-medium text-blue-500">
                      {t("verified")}
                    </span>
                  )}
                </div>

                <p className="mb-3 text-sm text-(--text-2)">
                  @{profile.username}
                </p>

                {/* Badges row */}
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleClass}`}
                  >
                    {t(`roles.${profile.role}`)}
                  </span>
                  <ReputationBadge
                    reputation={profile.reputation}
                    showScore
                  />
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm leading-relaxed text-(--text-2)">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollFadeIn>

        {/* ── Stats + links card ── */}
        <ScrollFadeIn delay={0.1}>
          <div className="relative overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-6 shadow-md backdrop-blur-xl dark:bg-white/5">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-blue-500/5 via-cyan-500/3 to-teal-500/5" />

            <div className="relative z-10 space-y-4">
              {/* Member since */}
              <div className="flex items-center gap-3 text-sm text-(--text-2)">
                <svg
                  className="h-4 w-4 shrink-0 text-(--text-2)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  {t("memberSince")} {memberSince}
                </span>
              </div>

              {/* Reputation score */}
              <div className="flex items-center gap-3 text-sm text-(--text-2)">
                <svg
                  className="h-4 w-4 shrink-0 text-(--text-2)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span>
                  {t("reputation")}{" "}
                  <span className="font-semibold text-(--text-1)">
                    {profile.reputation.toLocaleString()}
                  </span>
                </span>
              </div>

              {/* GitHub link */}
              {profile.githubHandle && (
                <div className="flex items-center gap-3 text-sm">
                  <svg
                    className="h-4 w-4 shrink-0 text-(--text-2)"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <a
                    href={`https://github.com/${profile.githubHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-(--primary) transition-colors hover:underline"
                  >
                    @{profile.githubHandle}
                  </a>
                </div>
              )}

              {/* Website link */}
              {profile.websiteUrl && (
                <div className="flex items-center gap-3 text-sm">
                  <svg
                    className="h-4 w-4 shrink-0 text-(--text-2)"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate font-medium text-(--primary) transition-colors hover:underline"
                  >
                    {profile.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          </div>
        </ScrollFadeIn>

        {/* ── Edit profile toggle ── */}
        <ScrollFadeIn delay={0.2}>
          <ProfileEditToggle
            user={currentUser}
            bio={profile.bio}
            websiteUrl={profile.websiteUrl}
            editLabel={t("editProfile")}
          />
        </ScrollFadeIn>
      </div>
    </div>
  );
}
