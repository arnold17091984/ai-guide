import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDebtItem } from "@/lib/knowledge-debt/actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import PriorityBadge from "@/components/PriorityBadge";
import DebtDetailClient from "./DebtDetailClient";

// ============================================================
// Types
// ============================================================

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

// ============================================================
// Category & status styles
// ============================================================

const CATEGORY_STYLES: Record<string, string> = {
  missing: "bg-red-500/10 text-red-400",
  outdated: "bg-amber-500/10 text-amber-400",
  incomplete: "bg-blue-500/10 text-blue-400",
  inaccurate: "bg-violet-500/10 text-violet-400",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  resolved: "bg-emerald-500/10 text-emerald-400",
  wont_fix: "bg-zinc-500/10 text-zinc-400",
};

// ============================================================
// Page
// ============================================================

export default async function DebtDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "knowledgeDebt" });

  const [item, user] = await Promise.all([
    getDebtItem(id),
    getCurrentUser(),
  ]);

  if (!item) {
    notFound();
  }

  const categoryLabels: Record<string, string> = {
    missing: t("categories.missing"),
    outdated: t("categories.outdated"),
    incomplete: t("categories.incomplete"),
    inaccurate: t("categories.inaccurate"),
  };

  const statusLabels: Record<string, string> = {
    open: t("status.open"),
    in_progress: t("status.inProgress"),
    resolved: t("status.resolved"),
    wont_fix: t("status.wontFix"),
  };

  const priorityLabels: Record<string, string> = {
    critical: t("priority.critical"),
    high: t("priority.high"),
    medium: t("priority.medium"),
    low: t("priority.low"),
  };

  const hasVoted = user
    ? item.votes.some((v) => v.userId === user.id)
    : false;

  const canEdit =
    user &&
    (item.reporterId === user.id || item.assigneeId === user.id);

  const canResolve =
    user &&
    (item.reporterId === user.id || item.assigneeId === user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <ScrollFadeIn>
        <a
          href={`/${locale}/knowledge/debt`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-(--text-2) hover:text-(--text-1) transition-colors"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t("backToList")}
        </a>
      </ScrollFadeIn>

      {/* Item header */}
      <ScrollFadeIn delay={0.05}>
        <div className="bg-(--bg-surface) border border-(--border) rounded-lg p-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-mono font-medium ${CATEGORY_STYLES[item.category] ?? ""}`}
            >
              {categoryLabels[item.category] ?? item.category}
            </span>
            <PriorityBadge
              priority={item.priority}
              label={priorityLabels[item.priority] ?? item.priority}
            />
            <span
              className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-mono font-medium ${STATUS_STYLES[item.status] ?? ""}`}
            >
              {statusLabels[item.status] ?? item.status}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-(--text-1) mb-4">
            {item.title}
          </h1>

          {/* Description */}
          <div className="prose prose-sm dark:prose-invert max-w-none text-(--text-1) whitespace-pre-wrap">
            {item.description}
          </div>

          {/* Tags */}
          {item.tags && (item.tags as string[]).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(item.tags as string[]).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-(--bg-elevated) px-2.5 py-0.5 text-xs text-(--text-2)"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta: reporter, assignee, dates */}
          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-(--text-2) border-t border-(--border) pt-4">
            <div>
              <span className="font-medium">{t("reportedBy")}:</span>{" "}
              {item.reporterDisplayName ?? item.reporterUsername}
            </div>
            {item.assigneeUsername && (
              <div>
                <span className="font-medium">{t("assignedTo")}:</span>{" "}
                {item.assigneeDisplayName ?? item.assigneeUsername}
              </div>
            )}
            <div className="ml-auto text-xs">
              {new Date(item.createdAt).toLocaleDateString(locale)}
            </div>
          </div>

          {/* Related entry */}
          {item.relatedEntry && (
            <div className="mt-4 rounded-lg bg-(--bg-elevated) p-3">
              <span className="text-xs font-medium text-(--text-2)">
                {t("relatedEntry")}:
              </span>
              <a
                href={`/${locale}/knowledge/${item.relatedEntry.slug}`}
                className="ml-2 text-sm text-(--accent) hover:underline"
              >
                {item.relatedEntry.title}
              </a>
            </div>
          )}

          {/* Resolution note */}
          {item.status === "resolved" && item.resolutionNote && (
            <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
              <span className="text-xs font-mono font-medium text-emerald-400">
                {t("resolutionNote")}:
              </span>
              <p className="mt-1 text-sm text-emerald-300">
                {item.resolutionNote}
              </p>
              {item.resolverDisplayName && (
                <p className="mt-1 text-xs text-emerald-400/70">
                  {t("resolvedBy")}: {item.resolverDisplayName ?? item.resolverUsername}
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollFadeIn>

      {/* Interactive actions and comments */}
      <ScrollFadeIn delay={0.1}>
        <DebtDetailClient
          itemId={item.id}
          locale={locale}
          voteCount={item.voteCount}
          hasVoted={hasVoted}
          comments={item.comments.map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt?.toISOString() ?? "",
            username: c.username,
            displayName: c.displayName,
            avatarUrl: c.avatarUrl,
          }))}
          canEdit={!!canEdit}
          canResolve={!!canResolve}
          isResolved={item.status === "resolved" || item.status === "wont_fix"}
          isLoggedIn={!!user}
          currentUserId={user?.id ?? null}
          assigneeId={item.assigneeId}
          translations={{
            vote: t("actions.vote"),
            voted: t("actions.voted"),
            assignToMe: t("actions.assignToMe"),
            resolve: t("actions.resolve"),
            reopen: t("actions.reopen"),
            edit: t("actions.edit"),
            resolutionNotePlaceholder: t("resolutionNotePlaceholder"),
            submitResolution: t("actions.submitResolution"),
            cancel: t("actions.cancel"),
            commentPlaceholder: t("comments.placeholder"),
            submitComment: t("comments.submit"),
            commentsTitle: t("comments.title"),
            loginToComment: t("comments.loginRequired"),
          }}
        />
      </ScrollFadeIn>
    </div>
  );
}
