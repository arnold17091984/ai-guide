import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserByUsername, getUserStats } from "@/lib/db/queries/users";
import { getUserAchievementsForProfile } from "./actions";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import ReputationBadge from "@/components/ReputationBadge";
import ProfileStats from "./ProfileStats";
import ProfileProgressRing from "./ProfileProgressRing";
import AchievementShowcase from "./AchievementShowcase";
import ProfileSkillBadges from "@/components/ProfileSkillBadges";

// ============================================================
// Public user profile page — Server Component
// ============================================================

const roleBadgeClass: Record<string, string> = {
  admin:
    "bg-red-500/10 text-red-400 border-red-500/30",
  moderator:
    "bg-orange-500/10 text-orange-400 border-orange-500/30",
  contributor:
    "bg-(--accent-muted) text-(--accent) border-(--accent)/30",
  viewer:
    "bg-(--bg-elevated) text-(--text-2) border-(--border)",
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  const t = await getTranslations({ locale, namespace: "users" });

  const profile = await getUserByUsername(username);
  if (!profile) {
    notFound();
  }

  const [stats, currentUser, achievements] = await Promise.all([
    getUserStats(profile.id),
    getCurrentUser(),
    getUserAchievementsForProfile(profile.id),
  ]);

  const isOwnProfile = currentUser?.id === profile.id;
  const roleClass = roleBadgeClass[profile.role] ?? roleBadgeClass.viewer;

  const memberSince = new Date(profile.createdAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <PageHeader
        title={t("publicProfile.title")}
        subtitle={`@${profile.username}`}
        
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

      <div className="mx-auto max-w-3xl space-y-6">
        {/* ── Avatar + Identity Card ── */}
        <ScrollFadeIn>
          <div className="overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface) p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName ?? profile.username}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-full object-cover ring-2 ring-(--border)"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-(--accent-muted) text-3xl font-bold text-(--accent) ring-2 ring-(--border)">
                    {(profile.displayName ?? profile.username)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                {profile.isVerified && (
                  <span
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-(--accent) ring-2 ring-(--bg-surface)"
                    title="Verified"
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

              {/* Identity + Progress Ring side by side on larger screens */}
              <div className="flex min-w-0 flex-1 flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h2 className="text-2xl font-bold text-(--text-1)">
                      {profile.displayName ?? profile.username}
                    </h2>
                  </div>

                  <p className="mb-3 text-sm text-(--text-2)">
                    @{profile.username}
                  </p>

                  {/* Badges */}
                  <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <span
                      className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-mono ${roleClass}`}
                    >
                      {profile.role}
                    </span>
                    <ReputationBadge reputation={profile.reputation} showScore />
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-sm leading-relaxed text-(--text-2)">
                      {profile.bio}
                    </p>
                  )}
                </div>

                {/* Progress Ring */}
                <div className="shrink-0">
                  <ProfileProgressRing reputation={profile.reputation} />
                </div>
              </div>
            </div>
          </div>
        </ScrollFadeIn>

        {/* ── Stats Grid ── */}
        <ScrollFadeIn delay={0.1}>
          <ProfileStats stats={stats} locale={locale} />
        </ScrollFadeIn>

        {/* ── Skill badges ── */}
        <ScrollFadeIn delay={0.15}>
          <ProfileSkillBadges userId={profile.id} />
        </ScrollFadeIn>

        {/* ── Links & Meta ── */}
        <ScrollFadeIn delay={0.2}>
          <div className="overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface) p-6">
            <div className="space-y-4">
              {/* Member since */}
              <div className="flex items-center gap-3 text-sm text-(--text-2)">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  {t("publicProfile.memberSince")} {memberSince}
                </span>
              </div>

              {/* GitHub */}
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
                    className="font-medium text-(--accent) transition-colors hover:underline"
                  >
                    @{profile.githubHandle}
                  </a>
                </div>
              )}

              {/* Website */}
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
                    className="truncate font-medium text-(--accent) transition-colors hover:underline"
                  >
                    {profile.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          </div>
        </ScrollFadeIn>

        {/* ── Achievement Showcase ── */}
        {achievements.length > 0 && (
          <ScrollFadeIn delay={0.2}>
            <div className="overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface) p-6">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-(--text-1)">
                    {t("achievementShowcase")}
                  </h3>
                  {achievements.length > 6 && (
                    <Link
                      href={`/${locale}/community/achievements`}
                      className="text-sm font-medium text-(--accent) hover:underline"
                    >
                      {t("viewAll")}
                    </Link>
                  )}
                </div>
                <AchievementShowcase achievements={achievements.slice(0, 6)} />
              </div>
            </div>
          </ScrollFadeIn>
        )}

        {/* ── Edit Profile link (own profile) ── */}
        {isOwnProfile && (
          <ScrollFadeIn delay={0.25}>
            <div className="flex justify-center">
              <Link
                href={`/${locale}/profile`}
                className="inline-flex items-center gap-2 rounded-md border border-(--border) bg-(--bg-surface) px-6 py-3 text-sm font-medium text-(--text-1) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-elevated)"
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
                {t("publicProfile.editProfile")}
              </Link>
            </div>
          </ScrollFadeIn>
        )}
      </div>
    </div>
  );
}
