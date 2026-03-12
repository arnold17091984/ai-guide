import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getEntryBySlug } from "@/lib/db/queries/knowledge";
import { renderMarkdown } from "@/lib/markdown";
import ScrollFadeIn from "@/components/ScrollFadeIn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function ChevronRightIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CalendarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function TagIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function HistoryIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  );
}

function PencilIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function GitPullRequestIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <line x1="6" y1="9" x2="6" y2="21" />
    </svg>
  );
}

function HomeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidLocale(locale: string): locale is "ko" | "en" | "ja" {
  return locale === "ko" || locale === "en" || locale === "ja";
}

function formatDate(date: Date | null, locale: string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function authorInitials(name: string | null, username: string | null): string {
  const src = name ?? username ?? "?";
  return src
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  intermediate:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  advanced:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const CONTENT_TYPE_STYLES: Record<string, string> = {
  article: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  tip: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  workflow:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  tutorial:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function KnowledgeDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const safeLocale = isValidLocale(locale) ? locale : "ko";

  const [entry, t] = await Promise.all([
    getEntryBySlug(slug, safeLocale),
    getTranslations("knowledge"),
  ]);

  if (!entry) notFound();

  const bodyHtml = renderMarkdown(entry.body ?? "");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <ScrollFadeIn>
        <nav
          aria-label="breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-sm text-(--text-2)"
        >
          <Link
            href={`/${locale}`}
            className="flex items-center gap-1 hover:text-(--primary) transition-colors"
          >
            <HomeIcon />
            {t("breadcrumb.home")}
          </Link>
          <span className="opacity-40"><ChevronRightIcon /></span>
          <Link
            href={`/${locale}/knowledge`}
            className="hover:text-(--primary) transition-colors"
          >
            {t("breadcrumb.knowledgeBase")}
          </Link>
          {entry.categoryLabel && (
            <>
              <span className="opacity-40"><ChevronRightIcon /></span>
              <Link
                href={`/${locale}/knowledge?category=${entry.categorySlug}`}
                className="hover:text-(--primary) transition-colors"
              >
                {entry.categoryLabel}
              </Link>
            </>
          )}
          <span className="opacity-40"><ChevronRightIcon /></span>
          <span className="truncate text-(--text-1)">{entry.title ?? slug}</span>
        </nav>
      </ScrollFadeIn>

      {/* Main content + sidebar */}
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* --- Article body --- */}
        <ScrollFadeIn>
          <article className="min-w-0">
            {/* Header */}
            <header className="mb-8 space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {entry.contentType && (
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-medium ${CONTENT_TYPE_STYLES[entry.contentType] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {entry.contentType}
                  </span>
                )}
                {entry.difficultyLevel && (
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[entry.difficultyLevel] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {entry.difficultyLevel.charAt(0).toUpperCase() +
                      entry.difficultyLevel.slice(1)}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold leading-tight tracking-tight text-(--text-1) sm:text-4xl">
                {entry.title}
              </h1>

              {entry.summary && (
                <p className="text-lg leading-relaxed text-(--text-2)">
                  {entry.summary}
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-(--text-2)">
                {entry.readTimeMins != null && (
                  <span className="flex items-center gap-1.5">
                    <ClockIcon />
                    {entry.readTimeMins} {t("detail.minuteRead")}
                  </span>
                )}
                {entry.publishedAt && (
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon />
                    {formatDate(entry.publishedAt, locale)}
                  </span>
                )}
              </div>

              <hr className="border-(--border)" />
            </header>

            {/* Rendered markdown body */}
            {bodyHtml ? (
              <div
                className="prose-custom text-(--text-1)"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            ) : (
              <p className="text-(--text-2) italic">{t("detail.noContent")}</p>
            )}

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2">
                <TagIcon />
                {entry.tags.map((tag) => (
                  <span
                    key={tag.slug}
                    className="rounded-full border border-(--border) bg-(--surface) px-3 py-0.5 text-xs text-(--text-2)"
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-10 flex flex-wrap gap-3 border-t border-(--border) pt-6">
              <Link
                href={`/${locale}/knowledge/${slug}/history`}
                className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium text-(--text-2) transition-colors hover:bg-(--surface-hover) hover:text-(--text-1)"
              >
                <HistoryIcon />
                {t("detail.versionHistory")}
              </Link>

              <Link
                href={`/${locale}/knowledge/${slug}/edit`}
                className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium text-(--text-2) transition-colors hover:bg-(--surface-hover) hover:text-(--text-1)"
              >
                <PencilIcon />
                {t("detail.edit")}
              </Link>

              <Link
                href={`/${locale}/knowledge/${slug}/suggest`}
                className="flex items-center gap-2 rounded-lg bg-(--primary)/10 px-4 py-2 text-sm font-medium text-(--primary) transition-colors hover:bg-(--primary)/20"
              >
                <GitPullRequestIcon />
                {t("detail.suggestEdit")}
              </Link>
            </div>

            {/* Vote / Comment placeholders */}
            <div className="mt-8 space-y-8">
              {/* VoteButton — component assumed to exist */}
              {/* <VoteButton targetType="knowledge_entry" targetId={entry.id} /> */}

              {/* CommentSection — component assumed to exist */}
              {/* <CommentSection targetType="knowledge_entry" targetId={entry.id} /> */}
            </div>
          </article>
        </ScrollFadeIn>

        {/* --- Sidebar --- */}
        <ScrollFadeIn delay={0.1}>
          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            {/* Author card */}
            <div className="rounded-2xl border border-(--border) bg-(--surface)/80 p-4 backdrop-blur-xl">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                {t("detail.author")}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-cyan-500 text-sm font-bold text-white">
                  {authorInitials(entry.authorName, entry.authorUsername)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-(--text-1)">
                    {entry.authorName ?? entry.authorUsername ?? t("detail.unknownAuthor")}
                  </p>
                  {entry.authorUsername && (
                    <p className="truncate text-xs text-(--text-2)">
                      @{entry.authorUsername}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Entry info */}
            <div className="rounded-2xl border border-(--border) bg-(--surface)/80 p-4 backdrop-blur-xl">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                {t("detail.info")}
              </h3>
              <dl className="space-y-2 text-sm">
                {entry.categoryLabel && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-(--text-2)">{t("detail.category")}</dt>
                    <dd className="text-right font-medium text-(--text-1)">
                      <Link
                        href={`/${locale}/knowledge?category=${entry.categorySlug}`}
                        className="hover:text-(--primary) transition-colors"
                      >
                        {entry.categoryLabel}
                      </Link>
                    </dd>
                  </div>
                )}
                {entry.difficultyLevel && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-(--text-2)">{t("detail.difficulty")}</dt>
                    <dd className="text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[entry.difficultyLevel] ?? ""}`}
                      >
                        {entry.difficultyLevel.charAt(0).toUpperCase() +
                          entry.difficultyLevel.slice(1)}
                      </span>
                    </dd>
                  </div>
                )}
                {entry.publishedAt && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-(--text-2)">{t("detail.published")}</dt>
                    <dd className="text-right text-(--text-1)">
                      {formatDate(entry.publishedAt, locale)}
                    </dd>
                  </div>
                )}
                {entry.updatedAt && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-(--text-2)">{t("detail.updated")}</dt>
                    <dd className="text-right text-(--text-1)">
                      {formatDate(entry.updatedAt, locale)}
                    </dd>
                  </div>
                )}
                {entry.readTimeMins != null && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-(--text-2)">{t("detail.readTime")}</dt>
                    <dd className="text-right text-(--text-1)">
                      {entry.readTimeMins} {t("detail.minutes")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="rounded-2xl border border-(--border) bg-(--surface)/80 p-4 backdrop-blur-xl">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                  {t("detail.tags")}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag.slug}
                      className="rounded-full border border-(--border) bg-(--surface) px-2.5 py-0.5 text-xs text-(--text-2) transition-colors hover:bg-(--surface-hover)"
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="rounded-2xl border border-(--border) bg-(--surface)/80 p-4 backdrop-blur-xl">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                {t("detail.actions")}
              </h3>
              <div className="space-y-1">
                <Link
                  href={`/${locale}/knowledge/${slug}/history`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-(--text-2) transition-colors hover:bg-(--surface-hover) hover:text-(--text-1)"
                >
                  <HistoryIcon />
                  {t("detail.versionHistory")}
                </Link>
                <Link
                  href={`/${locale}/knowledge/${slug}/edit`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-(--text-2) transition-colors hover:bg-(--surface-hover) hover:text-(--text-1)"
                >
                  <PencilIcon />
                  {t("detail.edit")}
                </Link>
                <Link
                  href={`/${locale}/knowledge/${slug}/suggest`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-(--primary) transition-colors hover:bg-(--primary)/10"
                >
                  <GitPullRequestIcon />
                  {t("detail.suggestEdit")}
                </Link>
              </div>
            </div>
          </aside>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
