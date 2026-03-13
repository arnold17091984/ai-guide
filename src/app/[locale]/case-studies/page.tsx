import { Suspense } from "react";
import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import CaseStudyCard from "@/components/CaseStudyCard";
import {
  listCaseStudies,
  getCaseStudyCategories,
  getDistinctIndustries,
} from "@/lib/db/queries/case-studies";
import Link from "next/link";

// ============================================================
// Metadata
// ============================================================

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("caseStudies");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

// ============================================================
// Props
// ============================================================

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    industry?: string;
    q?: string;
    page?: string;
  }>;
}

// ============================================================
// Page
// ============================================================

export default async function CaseStudiesPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const { category, industry, q, page: pageParam } = await searchParams;

  const locale = (localeParam as "ko" | "en" | "ja") ?? "ko";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const t = await getTranslations("caseStudies");
  const tc = await getTranslations("common");

  const [result, categories, industries] = await Promise.all([
    listCaseStudies({
      locale,
      categorySlug: category,
      industry,
      query: q,
      page,
      pageSize: 12,
    }),
    getCaseStudyCategories(locale),
    getDistinctIndustries(),
  ]);

  const { items, total, totalPages } = result;

  // Build URL helper preserving other search params
  function buildUrl(overrides: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    if (category && overrides.category !== "") sp.set("category", overrides.category ?? category);
    if (industry && overrides.industry !== "") sp.set("industry", overrides.industry ?? industry);
    if (q) sp.set("q", q);
    if (overrides.page) sp.set("page", overrides.page);

    // explicit overrides
    if (overrides.category !== undefined) {
      if (overrides.category === "") sp.delete("category");
      else sp.set("category", overrides.category);
    }
    if (overrides.industry !== undefined) {
      if (overrides.industry === "") sp.delete("industry");
      else sp.set("industry", overrides.industry);
    }
    if (overrides.page !== undefined) sp.set("page", overrides.page);

    const str = sp.toString();
    return str ? `?${str}` : "";
  }

  return (
    <div className="min-h-screen">
      {/* Hero header */}
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        gradient="from-violet-600 via-purple-600 to-fuchsia-600"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-7 w-7"
            aria-hidden="true"
          >
            <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
          </svg>
        }
      />

      {/* Search + actions bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <form method="GET" className="relative w-full max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-(--text-2)"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          {category && <input type="hidden" name="category" value={category} />}
          {industry && <input type="hidden" name="industry" value={industry} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-(--border) bg-white/70 py-2.5 pl-9 pr-4 text-sm text-(--text-1) backdrop-blur-xl placeholder:text-(--text-2) focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 dark:bg-white/5"
          />
        </form>

        {/* New case study link */}
        <Link
          href={`/${locale}/case-studies/new`}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          {t("newCaseStudy")}
        </Link>
      </div>

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={buildUrl({ category: "", page: "1" })}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
              !category
                ? "bg-violet-600 text-white shadow-sm"
                : "border border-(--border) text-(--text-2) hover:border-violet-400 hover:text-violet-600"
            }`}
          >
            {t("categories")}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={buildUrl({ category: cat.slug, page: "1" })}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                category === cat.slug
                  ? "bg-violet-600 text-white shadow-sm"
                  : "border border-(--border) text-(--text-2) hover:border-violet-400 hover:text-violet-600"
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      )}

      {/* Industry filter pills */}
      {industries.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <span className="self-center text-xs font-semibold uppercase tracking-wider text-(--text-2) mr-1">
            {t("industry")}:
          </span>
          {industries.map((ind) => (
            <Link
              key={ind}
              href={buildUrl({ industry: industry === ind ? "" : ind, page: "1" })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                industry === ind
                  ? "border-purple-400 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "border-(--border) text-(--text-2) hover:border-purple-400 hover:text-purple-600"
              }`}
            >
              {ind}
            </Link>
          ))}
        </div>
      )}

      {/* Results count */}
      {(q || category || industry) && (
        <p className="mb-6 text-sm text-(--text-2)">
          {total} {total === 1 ? "result" : "results"}
          {q && <> for &quot;{q}&quot;</>}
        </p>
      )}

      {/* Grid */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-(--border) bg-white/50 dark:bg-white/5"
              />
            ))}
          </div>
        }
      >
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((study) => (
              <CaseStudyCard key={study.id} study={study} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-(--border) bg-white/70 py-20 text-center backdrop-blur-xl dark:bg-white/5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="mb-4 h-12 w-12 text-(--text-2)"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <p className="text-lg font-semibold text-(--text-1)">{t("noResults")}</p>
          </div>
        )}
      </Suspense>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildUrl({ page: String(page - 1) })}
              className="inline-flex items-center gap-1 rounded-lg border border-(--border) px-3 py-2 text-sm text-(--text-2) hover:border-violet-400 hover:text-violet-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
              {tc("prev")}
            </Link>
          )}

          <span className="px-4 text-sm text-(--text-2)">
            {page} / {totalPages}
          </span>

          {page < totalPages && (
            <Link
              href={buildUrl({ page: String(page + 1) })}
              className="inline-flex items-center gap-1 rounded-lg border border-(--border) px-3 py-2 text-sm text-(--text-2) hover:border-violet-400 hover:text-violet-600 transition-colors"
            >
              {tc("next")}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
