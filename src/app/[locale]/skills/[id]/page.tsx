import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getSkillBySlug, getSkillStarStatus } from "@/lib/db/queries/skills";
import { renderMarkdown } from "@/lib/markdown";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import StarButton from "@/components/StarButton";
import CommentSection from "@/components/CommentSection";
import {
  getComments,
  type CommentWithAuthor,
} from "@/lib/social/comment-actions";
import type { ClaudeCodeVersion } from "@/lib/skill-registry/types";

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
  const { id } = await params;
  const skill = await getSkillBySlug(id);

  if (!skill) return {};

  const title = `${skill.name} | AI Guide Skills`;
  const description = (skill.description ?? "").slice(0, 160);

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
// Claude Code version list for compatibility matrix
// ---------------------------------------------------------------------------

const CLAUDE_VERSIONS: ClaudeCodeVersion[] = [
  "1.0",
  "1.1",
  "1.2",
  "1.3",
  "1.4",
  "1.5",
  "latest",
];

// ---------------------------------------------------------------------------
// Category badge colors
// ---------------------------------------------------------------------------

const CATEGORY_STYLES: Record<string, string> = {
  workflow: "bg-violet-500/10 text-violet-400",
  "code-generation": "bg-(--accent-muted) text-(--accent)",
  testing: "bg-emerald-500/10 text-emerald-400",
  documentation: "bg-amber-500/10 text-amber-400",
  security: "bg-red-500/10 text-red-400",
  devops: "bg-(--accent-muted) text-(--accent)",
  refactoring: "bg-blue-500/10 text-blue-400",
  debugging: "bg-orange-500/10 text-orange-400",
  review: "bg-teal-500/10 text-teal-400",
  other: "bg-zinc-500/10 text-zinc-400",
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400",
  high: "bg-orange-500/10 text-orange-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-blue-500/10 text-blue-400",
  info: "bg-zinc-500/10 text-zinc-400",
};

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function ChevronRightIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function HomeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function DownloadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function TagIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function ShieldIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function GitBranchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

function LinkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authorInitials(name: string | null, username: string): string {
  const src = name ?? username ?? "?";
  return src
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function formatDate(date: Date | null, locale: string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function semverToNumber(v: string): number {
  if (v === "latest") return Infinity;
  const parts = v.split(".").map(Number);
  return (parts[0] ?? 0) * 10000 + (parts[1] ?? 0) * 100 + (parts[2] ?? 0);
}

function isVersionCompatible(
  version: ClaudeCodeVersion,
  minVersion: string | null,
  maxVersion: string | null,
): boolean {
  const vNum = semverToNumber(version);
  if (minVersion) {
    const minNum = semverToNumber(minVersion);
    if (vNum < minNum) return false;
  }
  if (maxVersion) {
    const maxNum = semverToNumber(maxVersion);
    if (vNum > maxNum) return false;
  }
  return true;
}

// Detect the primary category from tags
function detectCategory(tags: string[]): string | null {
  const categories = [
    "workflow",
    "code-generation",
    "testing",
    "documentation",
    "security",
    "devops",
    "refactoring",
    "debugging",
    "review",
    "other",
  ];
  for (const tag of tags) {
    if (categories.includes(tag)) return tag;
  }
  return null;
}

// ---------------------------------------------------------------------------
// InstallBlock — client island for copy-to-clipboard
// ---------------------------------------------------------------------------

import InstallBlock from "./InstallBlock";
import SkillAdoptButton from "@/components/SkillAdoptButton";
import { getUserSkillStatus } from "@/lib/skills/user-skill-actions";
import PrerequisitesList from "@/components/PrerequisitesList";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SkillDetailPage({ params }: PageProps) {
  const { locale, id } = await params;

  const [skill, t, user] = await Promise.all([
    getSkillBySlug(id),
    getTranslations("skills"),
    getCurrentUser(),
  ]);

  if (!skill) notFound();

  const [starred, rawComments, adoptionStatus] = await Promise.all([
    user ? getSkillStarStatus(skill.id, user.id) : Promise.resolve(false),
    getComments("skill", skill.id),
    getUserSkillStatus(skill.id),
  ]);

  const comments = rawComments as CommentWithAuthor[];
  const bodyHtml = renderMarkdown(skill.body ?? "");
  const category = detectCategory(skill.tags);

  const installCommand = `npx claude-skill install ${skill.slug}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
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
            href={`/${locale}/skills`}
            className="transition-colors hover:text-(--accent)"
          >
            {t("breadcrumb.skillRegistry")}
          </Link>
          <span className="opacity-40">
            <ChevronRightIcon />
          </span>
          <span className="truncate text-(--text-1)">{skill.name}</span>
        </nav>
      </ScrollFadeIn>

      {/* Main content + sidebar */}
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* === Article === */}
        <ScrollFadeIn>
          <article className="min-w-0 space-y-8">
            {/* Header */}
            <header className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {category && (
                  <span
                    className={`rounded px-3 py-0.5 text-xs font-mono font-medium ${CATEGORY_STYLES[category] ?? CATEGORY_STYLES.other}`}
                  >
                    {category}
                  </span>
                )}
                <span className="rounded border border-(--border) bg-(--bg-surface)/60 px-2.5 py-0.5 font-mono text-xs text-(--text-2)">
                  v{skill.currentVersion}
                </span>
                {skill.license && (
                  <span className="rounded border border-(--border) bg-(--bg-surface)/60 px-2.5 py-0.5 text-xs text-(--text-2)">
                    {skill.license}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold leading-tight tracking-tight text-(--text-1) sm:text-4xl">
                {skill.name}
              </h1>

              <p className="text-lg leading-relaxed text-(--text-2)">
                {skill.description}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-5 text-sm text-(--text-2)">
                <span className="flex items-center gap-1.5">
                  <DownloadIcon />
                  {skill.downloads.toLocaleString()} {t("detail.downloads")}
                </span>
                <span className="flex items-center gap-1.5">
                  <ClockIcon />
                  {skill.publishedAt
                    ? formatDate(skill.publishedAt, locale)
                    : formatDate(skill.createdAt, locale)}
                </span>
                {skill.homepageUrl && (
                  <a
                    href={skill.homepageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 transition-colors hover:text-(--accent)"
                  >
                    <LinkIcon />
                    {t("detail.homepage")}
                  </a>
                )}
              </div>

              {/* Star button */}
              <div className="flex items-center gap-3">
                <StarButton
                  skillId={skill.id}
                  initialStarred={starred}
                  initialCount={skill.stars}
                />
              </div>

              <hr className="border-(--border)" />
            </header>

            {/* Triggers */}
            {skill.triggers.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-(--text-1)">
                  {t("detail.triggers")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skill.triggers.map((trigger, i) => (
                    <code
                      key={i}
                      className="rounded-lg border border-(--border) bg-(--bg-surface)/60 px-3 py-1 font-mono text-sm text-(--text-1)"
                    >
                      {trigger}
                    </code>
                  ))}
                </div>
              </section>
            )}

            {/* Dependencies */}
            {skill.dependencies.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-(--text-1)">
                  {t("detail.dependencies")}
                </h2>
                <div className="divide-y divide-(--border) overflow-hidden rounded-lg border border-(--border)">
                  {skill.dependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between gap-4 bg-(--bg-surface)/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <GitBranchIcon className="h-4 w-4 shrink-0 text-(--text-2)" />
                        <Link
                          href={`/${locale}/skills/${dep.slug}`}
                          className="truncate text-sm font-medium text-(--text-1) transition-colors hover:text-(--accent)"
                        >
                          {dep.name}
                        </Link>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {dep.versionRange && (
                          <code className="rounded bg-(--bg-surface) px-2 py-0.5 font-mono text-xs text-(--text-2)">
                            {dep.versionRange}
                          </code>
                        )}
                        {!dep.required && (
                          <span className="rounded border border-(--border) px-2 py-0.5 text-xs text-(--text-2)">
                            {t("detail.optional")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skill body (rendered markdown) */}
            {bodyHtml && (
              <section>
                <div
                  className="prose-custom text-(--text-1)"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              </section>
            )}

            {/* Install instructions */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-(--text-1)">
                {t("detail.install")}
              </h2>
              <InstallBlock
                command={installCommand}
                skillId={skill.id}
                copyLabel={t("detail.copyCommand")}
                copiedLabel={t("detail.copied")}
              />
            </section>

            {/* Compatibility matrix */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-(--text-1)">
                {t("detail.compatibility")}
              </h2>
              <div className="overflow-hidden rounded-lg border border-(--border)">
                <div className="grid grid-cols-2 gap-0 divide-y divide-(--border) sm:grid-cols-4">
                  {CLAUDE_VERSIONS.map((v) => {
                    const compatible = isVersionCompatible(
                      v,
                      skill.compatibleMin,
                      skill.compatibleMax,
                    );
                    return (
                      <div
                        key={v}
                        className={`flex items-center justify-between gap-2 px-4 py-3 ${
                          compatible
                            ? "bg-(--bg-surface)/40"
                            : "bg-(--bg-surface)/20 opacity-50"
                        }`}
                      >
                        <span className="font-mono text-sm text-(--text-1)">
                          {v}
                        </span>
                        {compatible ? (
                          <span className="text-emerald-500">
                            <CheckIcon />
                          </span>
                        ) : (
                          <span className="text-(--text-2)">
                            <XIcon />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {(skill.compatibleMin || skill.compatibleMax) && (
                <p className="mt-2 text-xs text-(--text-2)">
                  {t("detail.compatibilityRange")}{" "}
                  {skill.compatibleMin ?? "any"} &ndash;{" "}
                  {skill.compatibleMax ?? t("detail.latest")}
                </p>
              )}
            </section>

            {/* Security scan */}
            {skill.securityScannedAt && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-(--text-1)">
                  <ShieldIcon />
                  {t("detail.securityScan")}
                </h2>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded px-3 py-1 text-sm font-mono font-medium ${
                      skill.securityPassed
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {skill.securityPassed ? <CheckIcon /> : <XIcon />}
                    {skill.securityPassed
                      ? t("detail.securityPassed")
                      : t("detail.securityFailed")}
                  </span>
                  {skill.securityRiskScore != null && (
                    <span className="text-sm text-(--text-2)">
                      {t("detail.riskScore")} {skill.securityRiskScore}/100
                    </span>
                  )}
                  <span className="text-xs text-(--text-2)">
                    {t("detail.scannedAt")}{" "}
                    {formatDate(skill.securityScannedAt, locale)}
                  </span>
                </div>

                {skill.securityFindings.length > 0 ? (
                  <div className="space-y-2">
                    {skill.securityFindings.map((finding) => (
                      <div
                        key={finding.id}
                        className="overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface)/50"
                      >
                        <div className="flex flex-wrap items-center gap-3 border-b border-(--border) px-4 py-2.5">
                          <span
                            className={`rounded px-2.5 py-0.5 text-xs font-mono font-semibold ${SEVERITY_STYLES[finding.level] ?? SEVERITY_STYLES.info}`}
                          >
                            {finding.level}
                          </span>
                          <code className="text-xs text-(--text-2)">
                            {finding.rule}
                          </code>
                          {finding.lines && finding.lines.length > 0 && (
                            <span className="text-xs text-(--text-2)">
                              {t("detail.lines")}{" "}
                              {finding.lines.join(", ")}
                            </span>
                          )}
                        </div>
                        <div className="px-4 py-3 space-y-1">
                          <p className="text-sm text-(--text-1)">
                            {finding.message}
                          </p>
                          {finding.suggestion && (
                            <p className="text-xs text-(--text-2)">
                              {t("detail.suggestion")}: {finding.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-(--text-2)">
                    {t("detail.noFindings")}
                  </p>
                )}
              </section>
            )}

            {/* Tags */}
            {skill.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <TagIcon className="h-4 w-4 text-(--text-2)" />
                {skill.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-(--border) bg-(--bg-surface) px-3 py-0.5 text-xs text-(--text-2)"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Comments */}
            <section>
              <CommentSection
                targetType="skill"
                targetId={skill.id}
                initialComments={comments}
                currentUserId={user?.id ?? null}
              />
            </section>
          </article>
        </ScrollFadeIn>

        {/* === Sidebar === */}
        <ScrollFadeIn delay={0.1}>
          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            {/* Skill adoption */}
            {user && (
              <div className="rounded-lg border border-(--border) bg-(--bg-surface)/80 p-4 backdrop-blur-xl">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                  {t("adoption.register")}
                </h3>
                <SkillAdoptButton
                  skillId={skill.id}
                  initialStatus={adoptionStatus as "registered" | "in_progress" | "completed" | null}
                />
              </div>
            )}

            <PrerequisitesList skillId={skill.id} userId={user?.id} locale={locale} />

            {/* Author card */}
            <div className="rounded-lg border border-(--border) bg-(--bg-surface)/80 p-4 backdrop-blur-xl">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                {t("detail.author")}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--bg-elevated) text-sm font-bold text-(--text-1)">
                  {authorInitials(skill.authorName, skill.authorUsername)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-(--text-1)">
                    {skill.authorName ?? skill.authorUsername}
                  </p>
                  <p className="truncate text-xs text-(--text-2)">
                    @{skill.authorUsername}
                  </p>
                </div>
              </div>
            </div>

            {/* Skill info */}
            <div className="rounded-lg border border-(--border) bg-(--bg-surface)/80 p-4 backdrop-blur-xl">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                {t("detail.info")}
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-(--text-2)">{t("detail.version")}</dt>
                  <dd className="font-mono text-right text-(--text-1)">
                    v{skill.currentVersion}
                  </dd>
                </div>
                {skill.license && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-(--text-2)">{t("detail.license")}</dt>
                    <dd className="text-right text-(--text-1)">
                      {skill.license}
                    </dd>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-(--text-2)">{t("detail.downloads")}</dt>
                  <dd className="text-right text-(--text-1)">
                    {skill.downloads.toLocaleString()}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-(--text-2)">{t("detail.stars")}</dt>
                  <dd className="text-right text-(--text-1)">
                    {skill.stars.toLocaleString()}
                  </dd>
                </div>
                {skill.publishedAt && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-(--text-2)">{t("detail.published")}</dt>
                    <dd className="text-right text-(--text-1)">
                      {formatDate(skill.publishedAt, locale)}
                    </dd>
                  </div>
                )}
                {skill.updatedAt && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-(--text-2)">{t("detail.updated")}</dt>
                    <dd className="text-right text-(--text-1)">
                      {formatDate(skill.updatedAt, locale)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Version history */}
            {skill.versions.length > 0 && (
              <div className="rounded-lg border border-(--border) bg-(--bg-surface)/80 p-4 backdrop-blur-xl">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                  {t("detail.versionHistory")}
                </h3>
                <div className="space-y-2">
                  {skill.versions.slice(0, 8).map((v) => (
                    <div key={v.id} className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 font-mono text-xs ${
                          v.yanked
                            ? "text-red-500 line-through"
                            : "text-(--text-1)"
                        }`}
                      >
                        v{v.version}
                      </span>
                      <div className="min-w-0 flex-1">
                        {v.changelog && (
                          <p className="line-clamp-1 text-xs text-(--text-2)">
                            {v.changelog}
                          </p>
                        )}
                        <p className="text-xs text-(--text-2) opacity-60">
                          {formatDate(v.publishedAt, locale)}
                        </p>
                      </div>
                      {v.yanked && (
                        <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">
                          {t("detail.yanked")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
