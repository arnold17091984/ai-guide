import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPackageBySlug } from "@/lib/skills/package-actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import SkillCard from "@/components/SkillCard";
import type { SkillCardEntry } from "@/components/SkillCard";
import PackageSkillList from "@/components/PackageSkillList";
import PackageInstallBlock from "@/components/PackageInstallBlock";
import PackageStarButton from "./PackageStarButton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// ---------------------------------------------------------------------------
// Inline SVG icons
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

function PackageIcon() {
  return (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16.5 9.4l-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function StarIconSm() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function DownloadIcon() {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function LayersIcon() {
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
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
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

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PackageDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;

  const user = await getCurrentUser();
  const t = await getTranslations("skillPackages");

  const pkg = await getPackageBySlug(slug, user?.id);
  if (!pkg) notFound();

  const isAuthor = user?.id === pkg.authorId;
  const skillSlugs = pkg.skills.map((s) => s.slug);

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
            {t("breadcrumb.skills")}
          </Link>
          <span className="opacity-40">
            <ChevronRightIcon />
          </span>
          <Link
            href={`/${locale}/skills/packages`}
            className="transition-colors hover:text-(--accent)"
          >
            {t("breadcrumb.packages")}
          </Link>
          <span className="opacity-40">
            <ChevronRightIcon />
          </span>
          <span className="truncate text-(--text-1)">{pkg.name}</span>
        </nav>
      </ScrollFadeIn>

      {/* Main content + sidebar */}
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* === Main === */}
        <ScrollFadeIn>
          <article className="min-w-0 space-y-8">
            {/* Header */}
            <header className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-(--bg-elevated) text-(--accent)">
                  <PackageIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl font-bold leading-tight tracking-tight text-(--text-1) sm:text-4xl">
                    {pkg.name}
                  </h1>
                  <p className="mt-2 text-lg leading-relaxed text-(--text-2)">
                    {pkg.description}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-5 text-sm text-(--text-2)">
                <span className="flex items-center gap-1.5">
                  <StarIconSm />
                  {pkg.starCount.toLocaleString()} {t("detail.stars")}
                </span>
                <span className="flex items-center gap-1.5">
                  <DownloadIcon />
                  {pkg.installCount.toLocaleString()} {t("detail.installs")}
                </span>
                <span className="flex items-center gap-1.5">
                  <LayersIcon />
                  {pkg.skillCount} {t("detail.skills")}
                </span>
              </div>

              {/* Star button */}
              <div className="flex items-center gap-3">
                <PackageStarButton
                  packageId={pkg.id}
                  initialStarred={pkg.starred}
                  initialCount={pkg.starCount}
                />
              </div>

              {/* Tags */}
              {pkg.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pkg.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-(--border) bg-(--bg-surface) px-3 py-0.5 text-xs text-(--text-2)"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <hr className="border-(--border)" />
            </header>

            {/* Install block */}
            {skillSlugs.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-(--text-1)">
                  {t("detail.installAll")}
                </h2>
                <PackageInstallBlock
                  packageSlug={pkg.slug}
                  skillSlugs={skillSlugs}
                  packageId={pkg.id}
                  copyLabel={t("detail.copy")}
                  copiedLabel={t("detail.copied")}
                  installLabel={t("detail.installCommands")}
                />
              </section>
            )}

            {/* Skills list */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-(--text-1)">
                {t("detail.includedSkills")} ({pkg.skillCount})
              </h2>
              <PackageSkillList
                skills={pkg.skills.map((s) => ({
                  id: s.id,
                  slug: s.slug,
                  name: s.name,
                  description: s.description,
                  currentVersion: s.currentVersion,
                  stars: s.stars,
                  downloads: s.downloads,
                  order: s.order,
                }))}
                locale={locale}
              />
            </section>

            {/* Skill cards grid */}
            {pkg.skills.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-(--text-1)">
                  {t("detail.skillDetails")}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {pkg.skills.map((skill) => {
                    const entry: SkillCardEntry = {
                      id: skill.id,
                      slug: skill.slug,
                      name: skill.name,
                      description: skill.description,
                      currentVersion: skill.currentVersion,
                      stars: skill.stars,
                      downloads: skill.downloads,
                      tags: skill.tags,
                      authorName: skill.authorName,
                      authorUsername: skill.authorUsername,
                      publishedAt: skill.publishedAt,
                    };
                    return (
                      <ScrollFadeIn key={skill.id}>
                        <SkillCard entry={entry} locale={locale} />
                      </ScrollFadeIn>
                    );
                  })}
                </div>
              </section>
            )}
          </article>
        </ScrollFadeIn>

        {/* === Sidebar === */}
        <ScrollFadeIn delay={0.1}>
          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            {/* Author card */}
            <div className="rounded-lg border border-(--border) bg-(--bg-surface)/80 p-4 backdrop-blur-xl">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                {t("detail.author")}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--bg-elevated) text-sm font-bold text-(--text-1)">
                  {authorInitials(pkg.authorName, pkg.authorUsername)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-(--text-1)">
                    {pkg.authorName ?? pkg.authorUsername}
                  </p>
                  <p className="truncate text-xs text-(--text-2)">
                    @{pkg.authorUsername}
                  </p>
                </div>
              </div>
            </div>

            {/* Package info */}
            <div className="rounded-lg border border-(--border) bg-(--bg-surface)/80 p-4 backdrop-blur-xl">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                {t("detail.info")}
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-(--text-2)">{t("detail.skills")}</dt>
                  <dd className="text-right text-(--text-1)">
                    {pkg.skillCount}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-(--text-2)">{t("detail.stars")}</dt>
                  <dd className="text-right text-(--text-1)">
                    {pkg.starCount.toLocaleString()}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-(--text-2)">{t("detail.installs")}</dt>
                  <dd className="text-right text-(--text-1)">
                    {pkg.installCount.toLocaleString()}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-(--text-2)">{t("detail.created")}</dt>
                  <dd className="text-right text-(--text-1)">
                    {formatDate(pkg.createdAt, locale)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-(--text-2)">{t("detail.updated")}</dt>
                  <dd className="text-right text-(--text-1)">
                    {formatDate(pkg.updatedAt, locale)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Author actions */}
            {isAuthor && (
              <div className="rounded-lg border border-(--border) bg-(--bg-surface)/80 p-4 backdrop-blur-xl">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--text-2)">
                  {t("detail.actions")}
                </h3>
                <div className="space-y-2">
                  <Link
                    href={`/${locale}/skills/packages/new?edit=${pkg.id}`}
                    className="block w-full rounded-md border border-(--border) bg-(--bg-surface) px-4 py-2 text-center text-sm font-medium text-(--text-1) transition-colors hover:bg-(--bg-elevated)"
                  >
                    {t("detail.editPackage")}
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
