import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { listLearningPaths } from "@/lib/learning-paths/queries";
import PageHeader from "@/components/PageHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import LearningPathCard from "./LearningPathCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    role?: string;
    difficulty?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROLES = ["backend", "frontend", "devops", "fullstack", "data", "mobile"] as const;
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

// ---------------------------------------------------------------------------
// Inline icons
// ---------------------------------------------------------------------------

function BookIcon() {
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
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function BookIconSm() {
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
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PillLink({
  value,
  active,
  label,
  paramName,
}: {
  value: string;
  active: string;
  label: string;
  paramName: string;
}) {
  const isActive = active === value;
  const href = value ? `?${paramName}=${encodeURIComponent(value)}` : "?";
  return (
    <a
      href={href}
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
        <BookIconSm />
      </div>
      <p className="text-(--text-2)">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function LearningPathsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const role = sp.role ?? "";
  const difficulty = sp.difficulty ?? "";

  const t = await getTranslations("learningPaths");

  let items: Awaited<ReturnType<typeof listLearningPaths>>["items"] = [];
  let total = 0;
  try {
    ({ items, total } = await listLearningPaths({
      targetRole: role || undefined,
      difficultyLevel: difficulty || undefined,
    }));
  } catch {
    // DB not available — render empty state
  }

  // Resolve localized title/description and stepCount placeholder
  const cards = items.map((item) => {
    const title =
      (locale === "en" ? item.titleEn : locale === "ja" ? item.titleJa : null) ??
      item.titleKo;
    const description =
      (locale === "en"
        ? item.descriptionEn
        : locale === "ja"
          ? item.descriptionJa
          : null) ?? item.descriptionKo;
    return { ...item, title, description, stepCount: 0 };
  });

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={<BookIcon />}
      />

      <div className="space-y-6">
        {/* Role filter pills */}
        <ScrollFadeIn>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <PillLink value="" active={role} label={t("roles.all")} paramName="role" />
            {ROLES.map((r) => (
              <PillLink
                key={r}
                value={r}
                active={role}
                label={t(`roles.${r}`)}
                paramName="role"
              />
            ))}
          </div>
        </ScrollFadeIn>

        {/* Difficulty filter pills */}
        <ScrollFadeIn delay={0.05}>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <PillLink
              value=""
              active={difficulty}
              label={t("difficulty.all")}
              paramName="difficulty"
            />
            {DIFFICULTIES.map((d) => (
              <PillLink
                key={d}
                value={d}
                active={difficulty}
                label={t(`difficulty.${d}`)}
                paramName="difficulty"
              />
            ))}
          </div>
        </ScrollFadeIn>

        {/* Results count */}
        {(role || difficulty) && (
          <ScrollFadeIn delay={0.08}>
            <p className="text-sm text-(--text-2)">{total} paths</p>
          </ScrollFadeIn>
        )}

        {/* Grid */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-lg bg-(--bg-surface)"
                />
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cards.length === 0 ? (
              <EmptyState message={t("noResults")} />
            ) : (
              cards.map((card, i) => (
                <ScrollFadeIn key={card.id} delay={i * 0.04}>
                  <LearningPathCard
                    path={card}
                    locale={locale}
                    labels={{
                      estimatedHours: (h) => t("estimatedHours", { hours: h }),
                      steps: (c) => t("steps", { count: c }),
                    }}
                  />
                </ScrollFadeIn>
              ))
            )}
          </div>
        </Suspense>
      </div>
    </>
  );
}
