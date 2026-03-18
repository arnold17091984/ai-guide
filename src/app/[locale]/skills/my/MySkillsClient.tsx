"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UserSkillRow = {
  id: string;
  skillId: string;
  status: string;
  registeredAt: Date | null;
  completedAt: Date | null;
  skillName: string;
  skillSlug: string;
  skillDescription: string | null;
  skillDownloads: number;
  skillStars: number;
};

type FilterValue = "all" | "registered" | "in_progress" | "completed";

interface MySkillsClientProps {
  skills: UserSkillRow[];
  locale: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("mySkills");

  const styles: Record<string, string> = {
    registered:
      "border border-(--border) text-(--text-2) bg-transparent",
    in_progress:
      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    completed:
      "bg-(--accent-muted) text-(--accent) border border-(--accent)/20",
  };

  const labels: Record<string, string> = {
    registered: t("filters.registered"),
    in_progress: t("filters.inProgress"),
    completed: t("filters.completed"),
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.registered}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skill row
// ---------------------------------------------------------------------------

function SkillRow({
  row,
  locale,
}: {
  row: UserSkillRow;
  locale: string;
}) {
  const t = useTranslations("mySkills");

  const dateLabel =
    row.status === "completed"
      ? t("completedAt")
      : row.status === "in_progress"
        ? t("startedAt")
        : t("registeredAt");

  const date =
    row.status === "completed"
      ? row.completedAt
      : row.registeredAt;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-(--border) bg-(--bg-surface) p-4 transition-colors hover:bg-(--bg-elevated) sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <Link
          href={`/${locale}/skills/${row.skillSlug}`}
          className="text-sm font-medium text-(--text-1) hover:text-(--accent) transition-colors"
        >
          {row.skillName}
        </Link>
        {row.skillDescription && (
          <p className="mt-0.5 line-clamp-1 text-xs text-(--text-3)">
            {row.skillDescription}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <StatusBadge status={row.status} />
        {date && (
          <span className="hidden text-xs text-(--text-3) sm:block">
            {dateLabel}: {formatDate(date)}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-(--border) py-16 text-center">
      <p className="text-sm text-(--text-2)">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MySkillsClient({ skills, locale }: MySkillsClientProps) {
  const t = useTranslations("mySkills");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");

  const filters: { value: FilterValue; label: string }[] = [
    { value: "all", label: t("filters.all") },
    { value: "registered", label: t("filters.registered") },
    { value: "in_progress", label: t("filters.inProgress") },
    { value: "completed", label: t("filters.completed") },
  ];

  const filtered =
    activeFilter === "all"
      ? skills
      : skills.filter((s) => s.status === activeFilter);

  const emptyMessage =
    skills.length === 0 ? t("emptyState") : t("emptyFiltered");

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`shrink-0 rounded px-4 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === f.value
                ? "bg-(--accent-muted) text-(--accent)"
                : "border border-(--border) bg-(--bg-surface) text-(--text-2) hover:bg-(--bg-elevated) hover:text-(--text-1)"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Skill list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          filtered.map((row) => (
            <SkillRow key={row.id} row={row} locale={locale} />
          ))
        )}
      </div>
    </div>
  );
}
