import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { listSkills } from "@/lib/db/queries/skills";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import SkillCard from "@/components/SkillCard";
import type { SkillCardEntry } from "@/components/SkillCard";
import type { SkillCategory } from "@/lib/skill-registry/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PAGE_SIZE = 12;

const SKILL_CATEGORIES: SkillCategory[] = [
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

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function SearchIcon() {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PuzzleIcon() {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function PuzzleIconSm() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SearchBar({
  defaultValue,
  placeholder,
}: {
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <form method="GET" className="relative w-full max-w-xl">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--text-2)">
        <SearchIcon />
      </span>
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-md border border-(--border) bg-(--bg-surface) py-2.5 pl-10 pr-4 text-sm text-(--text-1) placeholder:text-(--text-2) transition-colors focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent)/20"
      />
    </form>
  );
}

function CategoryPills({
  active,
  allLabel,
  labels,
}: {
  active: string;
  allLabel: string;
  labels: Record<string, string>;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <PillLink value="" active={active} label={allLabel} />
      {SKILL_CATEGORIES.map((cat) => (
        <PillLink
          key={cat}
          value={cat}
          active={active}
          label={labels[cat] ?? cat}
        />
      ))}
    </div>
  );
}

function PillLink({
  value,
  active,
  label,
}: {
  value: string;
  active: string;
  label: string;
}) {
  const isActive = active === value;
  return (
    <a
      href={value ? `?category=${encodeURIComponent(value)}` : "?"}
      className={`shrink-0 rounded px-4 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-(--accent-muted) text-(--accent)"
          : "border border-(--border) bg-(--bg-surface) text-(--text-2) hover:bg-(--bg-elevated) hover:text-(--text-1)"
      }`}
    >
      {label}
    </a>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-4 rounded-lg border border-dashed border-(--border) py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-(--bg-surface) text-(--text-2)">
        <PuzzleIconSm />
      </div>
      <p className="text-(--text-2)">{message}</p>
    </div>
  );
}

function Pagination({
  page,
  total,
  pageSize,
  prevLabel,
  nextLabel,
  pageLabel,
}: {
  page: number;
  total: number;
  pageSize: number;
  prevLabel: string;
  nextLabel: string;
  pageLabel: string;
}) {
  const totalPages = Math.ceil(total / pageSize);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex items-center justify-center gap-4">
      {hasPrev ? (
        <a
          href={`?page=${page - 1}`}
          className="rounded-md border border-(--border) bg-(--bg-surface) px-4 py-2 text-sm font-medium text-(--text-1) transition-colors hover:bg-(--bg-elevated)"
        >
          {prevLabel}
        </a>
      ) : (
        <span className="cursor-not-allowed rounded-md border border-(--border) px-4 py-2 text-sm font-medium text-(--text-2) opacity-40">
          {prevLabel}
        </span>
      )}

      <span className="min-w-24 text-center text-sm text-(--text-2)">
        {pageLabel} {page} / {totalPages}
      </span>

      {hasNext ? (
        <a
          href={`?page=${page + 1}`}
          className="rounded-md border border-(--border) bg-(--bg-surface) px-4 py-2 text-sm font-medium text-(--text-1) transition-colors hover:bg-(--bg-elevated)"
        >
          {nextLabel}
        </a>
      ) : (
        <span className="cursor-not-allowed rounded-md border border-(--border) px-4 py-2 text-sm font-medium text-(--text-2) opacity-40">
          {nextLabel}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SkillsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const q = sp.q?.trim() ?? "";
  const category = (sp.category ?? "") as SkillCategory | "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const t = await getTranslations("skills");

  let items: Awaited<ReturnType<typeof listSkills>>["items"] = [];
  let total = 0;
  try {
    ({ items, total } = await listSkills({
      search: q || undefined,
      category: category || undefined,
      page,
      pageSize: PAGE_SIZE,
    }));
  } catch {
    // DB not available — render empty state
  }

  const entries: SkillCardEntry[] = items.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    currentVersion: s.currentVersion,
    stars: s.stars,
    downloads: s.downloads,
    tags: s.tags,
    authorName: s.authorName,
    authorUsername: s.authorUsername,
    publishedAt: s.publishedAt,
  }));

  const categoryLabels: Record<string, string> = {
    workflow: t("categories.workflow"),
    "code-generation": t("categories.codeGeneration"),
    testing: t("categories.testing"),
    documentation: t("categories.documentation"),
    security: t("categories.security"),
    devops: t("categories.devops"),
    refactoring: t("categories.refactoring"),
    debugging: t("categories.debugging"),
    review: t("categories.review"),
    other: t("categories.other"),
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={<PuzzleIcon />}
      />

      <div className="space-y-6">
        {/* Search bar */}
        <ScrollFadeIn>
          <SearchBar defaultValue={q} placeholder={t("searchPlaceholder")} />
        </ScrollFadeIn>

        {/* Category filter pills */}
        <ScrollFadeIn delay={0.05}>
          <CategoryPills
            active={category}
            allLabel={t("categories.all")}
            labels={categoryLabels}
          />
        </ScrollFadeIn>

        {/* Results count */}
        {(q || category) && (
          <ScrollFadeIn delay={0.08}>
            <p className="text-sm text-(--text-2)">
              {total} {t("resultsCount")}
            </p>
          </ScrollFadeIn>
        )}

        {/* Grid */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-lg bg-(--bg-surface)"
                />
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {entries.length === 0 ? (
              <EmptyState message={t("noResults")} />
            ) : (
              entries.map((entry, i) => (
                <ScrollFadeIn key={entry.id} delay={i * 0.04}>
                  <SkillCard entry={entry} locale={locale} />
                </ScrollFadeIn>
              ))
            )}
          </div>
        </Suspense>

        {/* Pagination */}
        <Pagination
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          prevLabel={t("pagination.prev")}
          nextLabel={t("pagination.next")}
          pageLabel={t("pagination.page")}
        />
      </div>
    </>
  );
}
