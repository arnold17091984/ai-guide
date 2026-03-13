"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import { createDebtItem } from "@/lib/knowledge-debt/actions";
import PriorityBadge from "@/components/PriorityBadge";

// ============================================================
// Types
// ============================================================

interface NewDebtFormClientProps {
  locale: string;
  translations: {
    titleLabel: string;
    titlePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    categoryLabel: string;
    priorityLabel: string;
    tagsLabel: string;
    tagsPlaceholder: string;
    relatedEntryLabel: string;
    relatedEntryPlaceholder: string;
    submit: string;
    preview: string;
    backToEdit: string;
    categoryMissing: string;
    categoryOutdated: string;
    categoryIncomplete: string;
    categoryInaccurate: string;
    categoryMissingDesc: string;
    categoryOutdatedDesc: string;
    categoryIncompleteDesc: string;
    categoryInaccurateDesc: string;
    priorityCritical: string;
    priorityHigh: string;
    priorityMedium: string;
    priorityLow: string;
    previewTitle: string;
    submitting: string;
    errorTitle: string;
  };
}

// ============================================================
// Category icons
// ============================================================

function MissingIcon({ cls }: { cls: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function OutdatedIcon({ cls }: { cls: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IncompleteIcon({ cls }: { cls: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 0 20" />
      <path d="M12 2v20" />
    </svg>
  );
}

function InaccurateIcon({ cls }: { cls: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ============================================================
// Component
// ============================================================

export default function NewDebtFormClient({
  locale,
  translations: t,
}: NewDebtFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("missing");
  const [priority, setPriority] = useState("medium");
  const [tagsInput, setTagsInput] = useState("");
  const [relatedEntryId, setRelatedEntryId] = useState("");

  const categories = [
    {
      value: "missing",
      label: t.categoryMissing,
      desc: t.categoryMissingDesc,
      color: "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800",
      activeColor: "ring-2 ring-red-500",
      icon: <MissingIcon cls="h-5 w-5 text-red-500" />,
    },
    {
      value: "outdated",
      label: t.categoryOutdated,
      desc: t.categoryOutdatedDesc,
      color: "border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800",
      activeColor: "ring-2 ring-amber-500",
      icon: <OutdatedIcon cls="h-5 w-5 text-amber-500" />,
    },
    {
      value: "incomplete",
      label: t.categoryIncomplete,
      desc: t.categoryIncompleteDesc,
      color: "border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800",
      activeColor: "ring-2 ring-blue-500",
      icon: <IncompleteIcon cls="h-5 w-5 text-(--accent)" />,
    },
    {
      value: "inaccurate",
      label: t.categoryInaccurate,
      desc: t.categoryInaccurateDesc,
      color: "border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800",
      activeColor: "ring-2 ring-purple-500",
      icon: <InaccurateIcon cls="h-5 w-5 text-purple-500" />,
    },
  ];

  const priorities = [
    { value: "critical", label: t.priorityCritical },
    { value: "high", label: t.priorityHigh },
    { value: "medium", label: t.priorityMedium },
    { value: "low", label: t.priorityLow },
  ];

  const categoryLabels: Record<string, string> = {
    missing: t.categoryMissing,
    outdated: t.categoryOutdated,
    incomplete: t.categoryIncomplete,
    inaccurate: t.categoryInaccurate,
  };

  function handleSubmit() {
    setError(null);

    const tags = tagsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      const result = await createDebtItem({
        title,
        description,
        category,
        priority,
        tags,
        relatedEntryId: relatedEntryId || undefined,
      });

      if (result.success && result.id) {
        router.push(`/${locale}/knowledge/debt/${result.id}`);
      } else {
        setError(result.error ?? "Unknown error");
        setShowPreview(false);
      }
    });
  }

  return (
    <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-(--border) shadow-md rounded-lg p-6">
      <AnimatePresence mode="wait">
        {!showPreview ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
            className="space-y-6"
          >
            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
                {t.errorTitle}: {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-(--text-1) mb-1.5">
                {t.titleLabel}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.titlePlaceholder}
                className="w-full rounded-md border border-(--border) bg-(--bg-surface) px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-(--text-1) mb-1.5">
                {t.descriptionLabel}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descriptionPlaceholder}
                rows={5}
                className="w-full rounded-md border border-(--border) bg-(--bg-surface) px-4 py-3 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
              />
            </div>

            {/* Category selector */}
            <div>
              <label className="block text-sm font-medium text-(--text-1) mb-2">
                {t.categoryLabel}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${cat.color} ${category === cat.value ? cat.activeColor : "opacity-70 hover:opacity-100"}`}
                  >
                    <div className="shrink-0 mt-0.5">{cat.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-(--text-1)">
                        {cat.label}
                      </p>
                      <p className="text-xs text-(--text-2) mt-0.5">
                        {cat.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority selector */}
            <div>
              <label className="block text-sm font-medium text-(--text-1) mb-2">
                {t.priorityLabel}
              </label>
              <div className="flex flex-wrap gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`transition-all ${priority === p.value ? "scale-105" : "opacity-60 hover:opacity-100"}`}
                  >
                    <PriorityBadge priority={p.value} label={p.label} />
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-(--text-1) mb-1.5">
                {t.tagsLabel}
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder={t.tagsPlaceholder}
                className="w-full rounded-md border border-(--border) bg-(--bg-surface) px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
              />
            </div>

            {/* Related entry (simple text input for now) */}
            <div>
              <label className="block text-sm font-medium text-(--text-1) mb-1.5">
                {t.relatedEntryLabel}
              </label>
              <input
                type="text"
                value={relatedEntryId}
                onChange={(e) => setRelatedEntryId(e.target.value)}
                placeholder={t.relatedEntryPlaceholder}
                className="w-full rounded-md border border-(--border) bg-(--bg-surface) px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={!title.trim() || !description.trim()}
                className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.preview}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-(--text-1)">
              {t.previewTitle}
            </h2>

            <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-4 space-y-3">
              <h3 className="text-lg font-bold text-(--text-1)">{title}</h3>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {categoryLabels[category]}
                </span>
                <PriorityBadge
                  priority={priority}
                  label={
                    priorities.find((p) => p.value === priority)?.label ??
                    priority
                  }
                />
              </div>

              <p className="text-sm text-(--text-1) whitespace-pre-wrap">
                {description}
              </p>

              {tagsInput && (
                <div className="flex flex-wrap gap-1.5">
                  {tagsInput
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-(--bg-elevated) px-2.5 py-0.5 text-xs text-(--text-2)"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-amber-600 disabled:opacity-60"
              >
                {isPending ? t.submitting : t.submit}
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                disabled={isPending}
                className="rounded-lg border border-(--border) px-6 py-2.5 text-sm text-(--text-2) hover:bg-(--bg-elevated)"
              >
                {t.backToEdit}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
