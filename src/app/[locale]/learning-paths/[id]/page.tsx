import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getLearningPathById, getUserPathProgress } from "@/lib/learning-paths/queries";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import EnrollButton from "./EnrollButton";
import PathStepList from "./PathStepList";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const path = await getLearningPathById(id, locale);

  if (!path) return {};

  const title = `${path.title} | AI Guide Learning`;
  const description = (path.description ?? "").slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ---------------------------------------------------------------------------
// Inline icons
// ---------------------------------------------------------------------------

function ChevronRightIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Badge style maps
// ---------------------------------------------------------------------------

const ROLE_STYLES: Record<string, string> = {
  backend: "bg-blue-500/10 text-blue-400",
  frontend: "bg-purple-500/10 text-purple-400",
  devops: "bg-orange-500/10 text-orange-400",
  fullstack: "bg-emerald-500/10 text-emerald-400",
  data: "bg-cyan-500/10 text-cyan-400",
  mobile: "bg-pink-500/10 text-pink-400",
};

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-400",
  intermediate: "bg-amber-500/10 text-amber-400",
  advanced: "bg-red-500/10 text-red-400",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function LearningPathDetailPage({ params }: PageProps) {
  const { locale, id } = await params;

  const [path, t, user] = await Promise.all([
    getLearningPathById(id, locale),
    getTranslations("learningPaths"),
    getCurrentUser(),
  ]);

  if (!path) notFound();

  const progress = user ? await getUserPathProgress(user.id, id) : [];

  // Determine enrollment: user has at least one progress row for this path
  const isEnrolled = progress.length > 0;

  const roleStyle = ROLE_STYLES[path.targetRole ?? ""] ?? "bg-zinc-500/10 text-zinc-400";
  const difficultyStyle =
    DIFFICULTY_STYLES[path.difficultyLevel ?? ""] ?? "bg-zinc-500/10 text-zinc-400";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Breadcrumb */}
      <ScrollFadeIn>
        <nav
          aria-label="breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-sm text-(--text-2)"
        >
          <Link
            href={`/${locale}`}
            className="flex items-center gap-1 transition-colors hover:text-(--accent)"
          >
            <HomeIcon />
            {t("breadcrumb.home")}
          </Link>
          <span className="opacity-40">
            <ChevronRightIcon />
          </span>
          <Link
            href={`/${locale}/learning-paths`}
            className="transition-colors hover:text-(--accent)"
          >
            {t("breadcrumb.learningPaths")}
          </Link>
          <span className="opacity-40">
            <ChevronRightIcon />
          </span>
          <span className="truncate text-(--text-1)">{path.title}</span>
        </nav>
      </ScrollFadeIn>

      {/* Path header */}
      <ScrollFadeIn delay={0.05}>
        <div className="space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {path.targetRole && (
              <span className={`rounded px-3 py-0.5 text-xs font-medium ${roleStyle}`}>
                {path.targetRole}
              </span>
            )}
            {path.difficultyLevel && (
              <span className={`rounded px-3 py-0.5 text-xs font-medium ${difficultyStyle}`}>
                {path.difficultyLevel}
              </span>
            )}
            {path.isOfficial && (
              <span className="rounded bg-(--accent-muted) px-3 py-0.5 text-xs font-medium text-(--accent)">
                official
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-(--text-1) sm:text-4xl">
            {path.title}
          </h1>

          {path.description && (
            <p className="text-lg leading-relaxed text-(--text-2)">{path.description}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-5 text-sm text-(--text-2)">
            {path.estimatedHours != null && (
              <span className="flex items-center gap-1.5">
                <ClockIcon />
                {t("estimatedHours", { hours: path.estimatedHours })}
              </span>
            )}
            <span>
              {t("steps", { count: path.steps.length })}
            </span>
            <span>
              by {path.authorDisplayName ?? path.authorUsername}
            </span>
          </div>

          <hr className="border-(--border)" />

          {/* Enroll / progress */}
          {user ? (
            <EnrollButton
              pathId={id}
              isEnrolled={isEnrolled}
              labels={{
                enroll: t("enroll"),
                enrolled: t("enrolled"),
                unenroll: t("unenroll"),
              }}
            />
          ) : (
            <p className="text-sm text-(--text-2)">
              <Link
                href={`/${locale}/auth/signin`}
                className="text-(--accent) underline underline-offset-2 hover:no-underline"
              >
                Sign in
              </Link>{" "}
              to track your progress.
            </p>
          )}
        </div>
      </ScrollFadeIn>

      {/* Steps */}
      {path.steps.length > 0 && (
        <ScrollFadeIn delay={0.1}>
          <section>
            <h2 className="mb-5 text-xl font-semibold text-(--text-1)">
              {t("detail.steps")}
            </h2>
            <PathStepList
              steps={path.steps}
              progress={progress}
              pathId={id}
              isEnrolled={isEnrolled}
              labels={{
                markComplete: t("markComplete"),
                completed: t("completed"),
                progress: (completed, total) =>
                  t("progress", { completed, total }),
              }}
            />
          </section>
        </ScrollFadeIn>
      )}
    </div>
  );
}
