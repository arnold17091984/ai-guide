import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { listEntries, searchEntries, listKnowledgeCategories } from "@/lib/db/queries/knowledge";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import KnowledgeCard from "@/components/KnowledgeCard";
import type { KnowledgeCardEntry } from "@/components/KnowledgeCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    difficulty?: string;
    page?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PAGE_SIZE = 12;
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidLocale(locale: string): locale is "ko" | "en" | "ja" {
  return locale === "ko" || locale === "en" || locale === "ja";
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function SearchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function BookOpenIconLg() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
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
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-2) pointer-events-none">
        <SearchIcon />
      </span>
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-(--border) bg-(--surface) py-2.5 pl-10 pr-4 text-sm text-(--text-1) placeholder:text-(--text-2) backdrop-blur-xl transition-colors focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20"
      />
    </form>
  );
}

function CategoryPills({
  categories,
  active,
  allLabel,
}: {
  categories: Array<{ slug: string; label: string }>;
  active: string;
  allLabel: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <PillLink slug="" active={active} label={allLabel} />
      {categories.map((cat) => (
        <PillLink key={cat.slug} slug={cat.slug} active={active} label={cat.label} />
      ))}
    </div>
  );
}

function PillLink({
  slug,
  active,
  label,
}: {
  slug: string;
  active: string;
  label: string;
}) {
  const isActive = active === slug;
  return (
    <a
      href={slug ? `?category=${encodeURIComponent(slug)}` : "?"}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-(--primary) text-white shadow-sm"
          : "border border-(--border) bg-(--surface) text-(--text-2) hover:bg-(--surface-hover) hover:text-(--text-1)"
      }`}
    >
      {label}
    </a>
  );
}

function DifficultyFilter({
  active,
  allLabel,
  labels,
}: {
  active: string;
  allLabel: string;
  labels: Record<string, string>;
}) {
  const options = [
    { value: "", label: allLabel },
    ...DIFFICULTIES.map((d) => ({ value: d, label: labels[d] ?? d })),
  ];

  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const isActive = active === opt.value;
        return (
          <a
            key={opt.value}
            href={opt.value ? `?difficulty=${opt.value}` : "?"}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              isActive
                ? "bg-(--primary)/15 text-(--primary) ring-1 ring-(--primary)/30"
                : "text-(--text-2) hover:bg-(--surface-hover) hover:text-(--text-1)"
            }`}
          >
            {opt.label}
          </a>
        );
      })}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-4 rounded-2xl border border-dashed border-(--border) py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--surface) text-(--text-2)">
        <BookOpenIcon />
      </div>
      <p className="text-(--text-2)">{message}</p>
    </div>
  );
}

function Pagination({
  page,
  hasNext,
  hasPrev,
  prevLabel,
  nextLabel,
  pageLabel,
}: {
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  prevLabel: string;
  nextLabel: string;
  pageLabel: string;
}) {
  return (
    <div className="mt-10 flex items-center justify-center gap-4">
      {hasPrev ? (
        <a
          href={`?page=${page - 1}`}
          className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium text-(--text-1) transition-colors hover:bg-(--surface-hover)"
        >
          {prevLabel}
        </a>
      ) : (
        <span className="rounded-lg border border-(--border) px-4 py-2 text-sm font-medium text-(--text-2) opacity-40 cursor-not-allowed">
          {prevLabel}
        </span>
      )}

      <span className="min-w-20 text-center text-sm text-(--text-2)">
        {pageLabel} {page}
      </span>

      {hasNext ? (
        <a
          href={`?page=${page + 1}`}
          className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium text-(--text-1) transition-colors hover:bg-(--surface-hover)"
        >
          {nextLabel}
        </a>
      ) : (
        <span className="rounded-lg border border-(--border) px-4 py-2 text-sm font-medium text-(--text-2) opacity-40 cursor-not-allowed">
          {nextLabel}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function KnowledgePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const safeLocale = isValidLocale(locale) ? locale : "ko";
  const q = sp.q?.trim() ?? "";
  const category = sp.category ?? "";
  const difficulty = sp.difficulty ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const t = await getTranslations("knowledge");

  // --- Fetch data in parallel (graceful fallback when DB is unavailable) ---
  let rawCategories: Awaited<ReturnType<typeof listKnowledgeCategories>> = [];
  let rawEntries: Array<Record<string, unknown>> = [];
  try {
    [rawCategories, rawEntries] = await Promise.all([
      listKnowledgeCategories(safeLocale),
      q
        ? searchEntries({
            query: q,
            locale: safeLocale,
            categorySlug: category || undefined,
            difficulty: difficulty || undefined,
            page,
            pageSize: PAGE_SIZE,
          })
        : listEntries({
            locale: safeLocale,
            categorySlug: category || undefined,
            difficulty: difficulty || undefined,
            page,
            pageSize: PAGE_SIZE,
          }),
    ]) as [typeof rawCategories, Array<Record<string, unknown>>];
  } catch {
    // DB not available — render empty state
  }

  // Normalize search results to same shape as list results
  const entries = (rawEntries as Array<Record<string, unknown>>).map((e): KnowledgeCardEntry => ({
    slug: String(e.slug ?? ""),
    title: e.title != null ? String(e.title) : null,
    summary: e.summary != null ? String(e.summary) : null,
    contentType: String(e.content_type ?? e.contentType ?? "article"),
    difficultyLevel: e.difficulty_level != null ? String(e.difficulty_level) : e.difficultyLevel != null ? String(e.difficultyLevel) : null,
    readTimeMins: e.read_time_mins != null ? Number(e.read_time_mins) : e.readTimeMins != null ? Number(e.readTimeMins) : null,
    publishedAt: e.published_at ? new Date(String(e.published_at)) : e.publishedAt ? new Date(e.publishedAt as string) : null,
    authorName: e.author_name != null ? String(e.author_name) : e.authorName != null ? String(e.authorName) : null,
    authorUsername: e.author_username != null ? String(e.author_username) : e.authorUsername != null ? String(e.authorUsername) : null,
  }));

  const categories = rawCategories.map((c) => ({
    slug: c.slug,
    label: c.label,
  }));

  const hasNext = entries.length === PAGE_SIZE;
  const hasPrev = page > 1;

  const difficultyLabels: Record<string, string> = {
    beginner: t("difficulty.beginner"),
    intermediate: t("difficulty.intermediate"),
    advanced: t("difficulty.advanced"),
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        gradient="from-blue-600 via-indigo-600 to-cyan-600"
        icon={<BookOpenIconLg />}
      />

      <div className="space-y-6">
        {/* Search bar */}
        <ScrollFadeIn>
          <SearchBar defaultValue={q} placeholder={t("searchPlaceholder")} />
        </ScrollFadeIn>

        {/* Category pills */}
        {categories.length > 0 && (
          <ScrollFadeIn delay={0.05}>
            <CategoryPills
              categories={categories}
              active={category}
              allLabel={t("categories.all")}
            />
          </ScrollFadeIn>
        )}

        {/* Difficulty filter */}
        <ScrollFadeIn delay={0.1}>
          <DifficultyFilter
            active={difficulty}
            allLabel={t("difficulty.all")}
            labels={difficultyLabels}
          />
        </ScrollFadeIn>

        {/* Grid */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-2xl bg-(--surface)"
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
                <ScrollFadeIn key={entry.slug} delay={i * 0.04}>
                  <KnowledgeCard entry={entry} locale={locale} />
                </ScrollFadeIn>
              ))
            )}
          </div>
        </Suspense>

        {/* Pagination */}
        {(hasNext || hasPrev) && (
          <Pagination
            page={page}
            hasNext={hasNext}
            hasPrev={hasPrev}
            prevLabel={t("pagination.prev")}
            nextLabel={t("pagination.next")}
            pageLabel={t("pagination.page")}
          />
        )}
      </div>
    </>
  );
}
