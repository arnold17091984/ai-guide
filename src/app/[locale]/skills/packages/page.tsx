import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listPackages, getFeaturedPackages } from "@/lib/skills/package-actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import PackageCard from "@/components/PackageCard";
import type { PackageCardEntry } from "@/components/PackageCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 12;

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function PackageIconLg() {
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
      <path d="M16.5 9.4l-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

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

function PlusIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-4 rounded-lg border border-dashed border-(--border) py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-(--bg-surface) text-(--text-2)">
        <PackageIconLg />
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

export default async function PackagesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const t = await getTranslations("skillPackages");
  const user = await getCurrentUser();

  let items: Awaited<ReturnType<typeof listPackages>>["items"] = [];
  let total = 0;
  let featured: Awaited<ReturnType<typeof getFeaturedPackages>> = [];
  try {
    ([{ items, total }, featured] = await Promise.all([
      listPackages({ search: q || undefined, page, limit: PAGE_SIZE }),
      page === 1 && !q ? getFeaturedPackages(4) : Promise.resolve([]),
    ]));
  } catch {
    // DB not available — render empty state
  }

  const toEntry = (pkg: (typeof items)[number]): PackageCardEntry => ({
    id: pkg.id,
    slug: pkg.slug,
    name: pkg.name,
    description: pkg.description,
    iconName: pkg.iconName,
    tags: pkg.tags,
    skillCount: pkg.skillCount,
    starCount: pkg.starCount,
    installCount: pkg.installCount,
    authorName: pkg.authorName,
    authorUsername: pkg.authorUsername,
  });

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={<PackageIconLg />}
      />

      <div className="space-y-6">
        {/* Top bar: search + create */}
        <ScrollFadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SearchBar defaultValue={q} placeholder={t("searchPlaceholder")} />
            {user && (
              <Link
                href={`/${locale}/skills/packages/new`}
                className="inline-flex shrink-0 items-center gap-2 rounded-md bg-(--accent) px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-(--accent-hover)"
              >
                <PlusIcon />
                {t("createPackage")}
              </Link>
            )}
          </div>
        </ScrollFadeIn>

        {/* Featured packages (first page, no search) */}
        {featured.length > 0 && (
          <ScrollFadeIn delay={0.05}>
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-(--text-1)">
                {t("featured")}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {featured.map((pkg, i) => (
                  <ScrollFadeIn key={pkg.id} delay={i * 0.04}>
                    <PackageCard entry={toEntry(pkg)} locale={locale} />
                  </ScrollFadeIn>
                ))}
              </div>
            </div>
          </ScrollFadeIn>
        )}

        {/* Results count */}
        {q && (
          <ScrollFadeIn delay={0.08}>
            <p className="text-sm text-(--text-2)">
              {total} {t("resultsCount")}
            </p>
          </ScrollFadeIn>
        )}

        {/* All packages heading */}
        {!q && featured.length > 0 && (
          <ScrollFadeIn delay={0.1}>
            <h2 className="text-lg font-semibold text-(--text-1)">
              {t("allPackages")}
            </h2>
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
            {items.length === 0 ? (
              <EmptyState message={t("noResults")} />
            ) : (
              items.map((pkg, i) => (
                <ScrollFadeIn key={pkg.id} delay={i * 0.04}>
                  <PackageCard entry={toEntry(pkg)} locale={locale} />
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
