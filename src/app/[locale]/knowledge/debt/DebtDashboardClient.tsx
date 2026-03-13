"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import DebtItemCard from "@/components/DebtItemCard";
import type { DebtItemCardData } from "@/components/DebtItemCard";
import { voteDebtItem } from "@/lib/knowledge-debt/actions";

// ============================================================
// Types
// ============================================================

interface DebtDashboardClientProps {
  items: DebtItemCardData[];
  locale: string;
  currentCategory: string;
  currentPriority: string;
  currentStatus: string;
  currentSort: string;
  currentSearch: string;
  currentPage: number;
  translations: {
    reportGap: string;
    filterAll: string;
    categoryMissing: string;
    categoryOutdated: string;
    categoryIncomplete: string;
    categoryInaccurate: string;
    statusOpen: string;
    statusInProgress: string;
    statusResolved: string;
    statusWontFix: string;
    statusAll: string;
    sortVotes: string;
    sortNewest: string;
    sortPriority: string;
    priorityCritical: string;
    priorityHigh: string;
    priorityMedium: string;
    priorityLow: string;
    vote: string;
    comments: string;
    noResults: string;
    searchPlaceholder: string;
  };
}

// ============================================================
// Helpers
// ============================================================

function buildUrl(
  base: string,
  params: Record<string, string>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

// ============================================================
// Icons
// ============================================================

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
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg
      className="h-12 w-12 text-(--text-2)"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12h6M12 9v6" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

// ============================================================
// Component
// ============================================================

export default function DebtDashboardClient({
  items,
  locale,
  currentCategory,
  currentPriority,
  currentStatus,
  currentSort,
  currentSearch,
  currentPage,
  translations: t,
}: DebtDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const basePath = `/${locale}/knowledge/debt`;

  function navigate(overrides: Record<string, string>) {
    const params: Record<string, string> = {
      category: currentCategory,
      priority: currentPriority,
      status: currentStatus,
      sort: currentSort,
      search: currentSearch,
      ...overrides,
    };
    // Remove defaults
    if (params.status === "open") delete params.status;
    if (params.sort === "newest") delete params.sort;

    startTransition(() => {
      router.push(buildUrl(basePath, params));
    });
  }

  function handleVote(id: string) {
    startTransition(async () => {
      await voteDebtItem(id);
    });
  }

  const categoryPills = [
    { value: "", label: t.filterAll },
    { value: "missing", label: t.categoryMissing },
    { value: "outdated", label: t.categoryOutdated },
    { value: "incomplete", label: t.categoryIncomplete },
    { value: "inaccurate", label: t.categoryInaccurate },
  ];

  const statusTabs = [
    { value: "open", label: t.statusOpen },
    { value: "in_progress", label: t.statusInProgress },
    { value: "resolved", label: t.statusResolved },
    { value: "all", label: t.statusAll },
  ];

  const sortOptions = [
    { value: "votes", label: t.sortVotes },
    { value: "newest", label: t.sortNewest },
    { value: "priority", label: t.sortPriority },
  ];

  const priorityLabels: Record<string, string> = {
    critical: t.priorityCritical,
    high: t.priorityHigh,
    medium: t.priorityMedium,
    low: t.priorityLow,
  };

  const categoryLabels: Record<string, string> = {
    missing: t.categoryMissing,
    outdated: t.categoryOutdated,
    incomplete: t.categoryIncomplete,
    inaccurate: t.categoryInaccurate,
  };

  const statusLabels: Record<string, string> = {
    open: t.statusOpen,
    in_progress: t.statusInProgress,
    resolved: t.statusResolved,
    wont_fix: t.statusWontFix,
  };

  return (
    <div className={`space-y-6 ${isPending ? "opacity-70 transition-opacity" : ""}`}>
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/${locale}/knowledge/debt/new`}
          className="inline-flex items-center gap-2 rounded-md bg-(--accent) px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-(--accent-hover)"
        >
          <PlusIcon />
          {t.reportGap}
        </Link>

        {/* Search */}
        <form
          method="GET"
          action={basePath}
          className="relative w-full max-w-xs"
        >
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-2) pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="search"
            name="search"
            defaultValue={currentSearch}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-md border border-(--border) bg-(--bg-surface) py-2 pl-10 pr-4 text-sm text-(--text-1) placeholder:text-(--text-2) transition-colors focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent)/20"
          />
          {/* Preserve current filters */}
          {currentCategory && (
            <input type="hidden" name="category" value={currentCategory} />
          )}
          {currentStatus && currentStatus !== "open" && (
            <input type="hidden" name="status" value={currentStatus} />
          )}
          {currentSort && currentSort !== "newest" && (
            <input type="hidden" name="sort" value={currentSort} />
          )}
        </form>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categoryPills.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => navigate({ category: pill.value })}
            className={`shrink-0 rounded px-4 py-1.5 text-sm font-medium transition-colors ${
              currentCategory === pill.value
                ? "bg-(--accent-muted) text-(--accent)"
                : "border border-(--border) bg-(--bg-surface) text-(--text-2) hover:bg-(--bg-elevated) hover:text-(--text-1)"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Status tabs + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status tabs */}
        <div className="flex gap-1 rounded-lg bg-(--bg-surface) border border-(--border) p-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => navigate({ status: tab.value })}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                currentStatus === tab.value
                  ? "bg-(--accent-muted) text-(--accent)"
                  : "text-(--text-2) hover:text-(--text-1)"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => navigate({ sort: opt.value })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                currentSort === opt.value
                  ? "bg-(--accent-muted) text-(--accent)"
                  : "text-(--text-2) hover:bg-(--bg-elevated) hover:text-(--text-1)"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-(--border) py-20 text-center">
          <EmptyIcon />
          <p className="text-(--text-2)">{t.noResults}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item, i) => (
            <DebtItemCard
              key={item.id}
              item={item}
              locale={locale}
              index={i}
              onVote={handleVote}
              translations={{
                vote: t.vote,
                comments: t.comments,
                priorityLabels,
                categoryLabels,
                statusLabels,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
