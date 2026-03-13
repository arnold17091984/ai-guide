import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getEntryBySlug } from "@/lib/db/queries/knowledge";
import { getVersionHistory } from "@/lib/db/queries/versioning";
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

function ClockIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function GitCommitIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="1.05" y1="12" x2="7" y2="12" />
      <line x1="17.01" y1="12" x2="22.96" y2="12" />
    </svg>
  );
}

function EyeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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

function HistoryIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidLocale(locale: string): locale is "ko" | "en" | "ja" {
  return locale === "ko" || locale === "en" || locale === "ja";
}

function formatDate(date: Date | string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

const CHANGE_TYPE_STYLES: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-400",
  edit: "bg-(--accent-muted) text-(--accent)",
  revert: "bg-amber-500/10 text-amber-400",
  accept_suggestion: "bg-violet-500/10 text-violet-400",
  locale_add: "bg-(--accent-muted) text-(--accent)",
  metadata_update: "bg-zinc-500/10 text-zinc-400",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function VersionHistoryPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const safeLocale = isValidLocale(locale) ? locale : "ko";

  const [entry, t] = await Promise.all([
    getEntryBySlug(slug, safeLocale),
    getTranslations("knowledge"),
  ]);

  if (!entry) notFound();

  const versions = await getVersionHistory("knowledge_entry", entry.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <ScrollFadeIn>
        <nav
          aria-label="breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-sm text-(--text-2)"
        >
          <Link
            href={`/${locale}`}
            className="flex items-center gap-1 hover:text-(--accent) transition-colors"
          >
            <HomeIcon />
            {t("breadcrumb.home")}
          </Link>
          <span className="opacity-40"><ChevronRightIcon /></span>
          <Link
            href={`/${locale}/knowledge`}
            className="hover:text-(--accent) transition-colors"
          >
            {t("breadcrumb.knowledgeBase")}
          </Link>
          <span className="opacity-40"><ChevronRightIcon /></span>
          <Link
            href={`/${locale}/knowledge/${slug}`}
            className="hover:text-(--accent) transition-colors"
          >
            {entry.title ?? slug}
          </Link>
          <span className="opacity-40"><ChevronRightIcon /></span>
          <span className="text-(--text-1)">{t("history.title")}</span>
        </nav>
      </ScrollFadeIn>

      {/* Page header */}
      <ScrollFadeIn delay={0.05}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--accent-muted) text-(--accent)">
            <HistoryIcon />
          </div>
          <div>
            <h1 className="text-xl font-bold text-(--text-1)">{t("history.title")}</h1>
            <p className="text-sm text-(--text-2)">{entry.title}</p>
          </div>
        </div>
      </ScrollFadeIn>

      {/* Timeline */}
      {versions.length === 0 ? (
        <ScrollFadeIn delay={0.1}>
          <div className="rounded-lg border border-dashed border-(--border) py-16 text-center text-(--text-2)">
            {t("history.noVersions")}
          </div>
        </ScrollFadeIn>
      ) : (
        <div className="relative space-y-0">
          {/* Vertical connecting line */}
          <div className="absolute left-4.75 top-6 bottom-6 w-0.5 bg-(--border)" />

          {versions.map((version, index) => {
            const isLatest = index === 0;
            const changeTypeStyle =
              CHANGE_TYPE_STYLES[version.changeType ?? "edit"] ??
              "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300";

            return (
              <ScrollFadeIn key={version.id} delay={index * 0.04}>
                <div className="group relative flex gap-4 py-4">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      isLatest
                        ? "border-(--accent) bg-(--accent) text-black shadow-md"
                        : "border-(--border) bg-(--bg-surface) text-(--text-2) group-hover:border-(--accent)/50"
                    }`}
                  >
                    <GitCommitIcon />
                  </div>

                  {/* Version card */}
                  <div className="min-w-0 flex-1 rounded-lg border border-(--border) bg-(--bg-surface)/80 p-4 backdrop-blur-xl transition-all duration-200 hover:border-(--border-hover) hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Version number */}
                        <span className="rounded bg-(--accent-muted) px-2.5 py-0.5 text-xs font-mono font-semibold text-(--accent)">
                          v{version.versionNumber}
                        </span>

                        {/* Change type badge */}
                        {version.changeType && (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${changeTypeStyle}`}
                          >
                            {version.changeType.replace("_", " ")}
                          </span>
                        )}

                        {isLatest && (
                          <span className="rounded bg-(--accent-muted) px-2.5 py-0.5 text-xs font-mono font-medium text-(--accent)">
                            {t("history.latest")}
                          </span>
                        )}
                      </div>

                      {/* View link */}
                      <Link
                        href={`/${locale}/knowledge/${slug}?version=${version.versionNumber}`}
                        className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium text-(--text-2) transition-colors hover:bg-(--bg-elevated) hover:text-(--text-1)"
                      >
                        <EyeIcon />
                        {t("history.viewVersion")}
                      </Link>
                    </div>

                    {/* Change summary */}
                    {version.changeSummary && (
                      <p className="mt-2 text-sm text-(--text-1)">
                        {version.changeSummary}
                      </p>
                    )}

                    {/* Author + date */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-(--text-2)">
                      {/* Author avatar */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-(--bg-elevated) text-[9px] font-bold text-(--text-1)">
                          {authorInitials(version.authorName ?? null, version.authorUsername ?? null)}
                        </div>
                        <span>
                          {version.authorName ??
                            version.authorUsername ??
                            t("history.unknownAuthor")}
                        </span>
                      </div>

                      {/* Date */}
                      <span className="flex items-center gap-1">
                        <ClockIcon />
                        {formatDate(version.createdAt, locale)}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollFadeIn>
            );
          })}
        </div>
      )}

      {/* Back link */}
      <ScrollFadeIn delay={0.1}>
        <div className="pt-4">
          <Link
            href={`/${locale}/knowledge/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-(--text-2) hover:text-(--accent) transition-colors"
          >
            <span className="rotate-180 inline-block"><ChevronRightIcon /></span>
            {t("history.backToEntry")}
          </Link>
        </div>
      </ScrollFadeIn>
    </div>
  );
}
