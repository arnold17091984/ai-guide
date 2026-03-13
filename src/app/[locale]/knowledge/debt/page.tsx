import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import DebtStatsBar from "@/components/DebtStatsBar";
import { listDebtItems, getDebtStats } from "@/lib/knowledge-debt/actions";
import DebtDashboardClient from "./DebtDashboardClient";

// ============================================================
// Types
// ============================================================

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

// ============================================================
// Icon
// ============================================================

function DebtIcon() {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ============================================================
// Page
// ============================================================

export default async function DebtDashboardPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "knowledgeDebt" });

  const category = sp.category ?? "";
  const priority = sp.priority ?? "";
  const status = sp.status || "open";
  const search = sp.search ?? "";
  const sortBy = (sp.sort ?? "newest") as "votes" | "newest" | "priority";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const [items, stats] = await Promise.all([
    listDebtItems({
      category: category || undefined,
      priority: priority || undefined,
      status: status === "all" ? undefined : status,
      search: search || undefined,
      sortBy,
      page,
      limit: 20,
    }),
    getDebtStats(),
  ]);

  const serializedItems = items.map((item) => ({
    ...item,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        gradient="from-amber-500 to-orange-500"
        icon={<DebtIcon />}
      />

      <div className="space-y-8">
        {/* Stats */}
        <ScrollFadeIn>
          <DebtStatsBar
            stats={stats}
            translations={{
              open: t("stats.open"),
              inProgress: t("stats.inProgress"),
              resolved: t("stats.resolved"),
              total: t("stats.total"),
              resolutionRate: t("stats.resolutionRate"),
              missing: t("categories.missing"),
              outdated: t("categories.outdated"),
              incomplete: t("categories.incomplete"),
              inaccurate: t("categories.inaccurate"),
            }}
          />
        </ScrollFadeIn>

        {/* Client-side interactive portion */}
        <DebtDashboardClient
          items={serializedItems}
          locale={locale}
          currentCategory={category}
          currentPriority={priority}
          currentStatus={status}
          currentSort={sortBy}
          currentSearch={search}
          currentPage={page}
          translations={{
            reportGap: t("reportGap"),
            filterAll: t("filter.all"),
            categoryMissing: t("categories.missing"),
            categoryOutdated: t("categories.outdated"),
            categoryIncomplete: t("categories.incomplete"),
            categoryInaccurate: t("categories.inaccurate"),
            statusOpen: t("status.open"),
            statusInProgress: t("status.inProgress"),
            statusResolved: t("status.resolved"),
            statusWontFix: t("status.wontFix"),
            statusAll: t("status.all"),
            sortVotes: t("sort.votes"),
            sortNewest: t("sort.newest"),
            sortPriority: t("sort.priority"),
            priorityCritical: t("priority.critical"),
            priorityHigh: t("priority.high"),
            priorityMedium: t("priority.medium"),
            priorityLow: t("priority.low"),
            vote: t("actions.vote"),
            comments: t("comments.title"),
            noResults: t("noResults"),
            searchPlaceholder: t("searchPlaceholder"),
          }}
        />
      </div>
    </div>
  );
}
