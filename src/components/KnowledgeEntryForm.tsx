"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, DURATION, EASE_APPLE } from "@/lib/motion";
import MarkdownEditor from "@/components/MarkdownEditor";
import { createEntry, updateEntry } from "@/lib/knowledge/actions";
import type { Category } from "@/lib/db/schema/taxonomy";
import type { KnowledgeEntry } from "@/lib/db/schema/knowledge";

// ============================================================
// Types
// ============================================================

interface LocaleContent {
  title: string;
  body: string;
}

type LocaleKey = "ko" | "en" | "ja";

const LOCALES: { key: LocaleKey; label: string; flag: string }[] = [
  { key: "ko", label: "한국어", flag: "🇰🇷" },
  { key: "en", label: "English", flag: "🇺🇸" },
  { key: "ja", label: "日本語", flag: "🇯🇵" },
];

const DIFFICULTY_OPTIONS = [
  { value: "", label: "— Select level —" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const CONTENT_TYPE_OPTIONS = [
  { value: "article", label: "Article" },
  { value: "tip", label: "Tip" },
  { value: "workflow", label: "Workflow" },
  { value: "tutorial", label: "Tutorial" },
] as const;

// ============================================================
// Toast sub-component
// ============================================================

interface ToastProps {
  message: string;
  type: "success" | "error";
}

function Toast({ message, type }: ToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
        type === "success"
          ? "border-green-300/50 bg-green-50 text-green-800 dark:border-green-700/50 dark:bg-green-900/30 dark:text-green-300"
          : "border-red-300/50 bg-red-50 text-red-800 dark:border-red-700/50 dark:bg-red-900/30 dark:text-red-300"
      }`}
    >
      {type === "success" ? (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
        </svg>
      )}
      {message}
    </motion.div>
  );
}

// ============================================================
// Field wrapper
// ============================================================

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-(--text-1)"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) outline-none transition-all focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 dark:focus:border-cyan-500/60 dark:focus:ring-cyan-500/20";

// ============================================================
// Props
// ============================================================

interface KnowledgeEntryFormProps {
  categories: Category[];
  locale: string;
  /** When provided, the form is in edit mode. */
  entry?: KnowledgeEntry;
  /** Tag slugs that are currently associated with the entry (for edit mode). */
  initialTagSlugs?: string;
}

// ============================================================
// KnowledgeEntryForm
// ============================================================

export default function KnowledgeEntryForm({
  categories,
  locale,
  entry,
  initialTagSlugs = "",
}: KnowledgeEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [activeLocale, setActiveLocale] = useState<LocaleKey>("ko");

  // Per-locale content state
  const [content, setContent] = useState<Record<LocaleKey, LocaleContent>>({
    ko: { title: entry?.titleKo ?? "", body: entry?.bodyKo ?? "" },
    en: { title: entry?.titleEn ?? "", body: entry?.bodyEn ?? "" },
    ja: { title: entry?.titleJa ?? "", body: entry?.bodyJa ?? "" },
  });

  const [categoryId, setCategoryId] = useState(entry?.categoryId ?? "");
  const [difficulty, setDifficulty] = useState(entry?.difficultyLevel ?? "");
  const [contentType, setContentType] = useState(
    entry?.contentType ?? "article",
  );
  const [tags, setTags] = useState(initialTagSlugs);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }

  function updateLocaleField(
    loc: LocaleKey,
    field: keyof LocaleContent,
    value: string,
  ) {
    setContent((prev) => ({
      ...prev,
      [loc]: { ...prev[loc], [field]: value },
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    startTransition(async () => {
      const formData = new FormData();

      // Locale content
      formData.set("titleKo", content.ko.title);
      formData.set("titleEn", content.en.title);
      formData.set("titleJa", content.ja.title);
      formData.set("bodyKo", content.ko.body);
      formData.set("bodyEn", content.en.body);
      formData.set("bodyJa", content.ja.body);

      // Metadata
      formData.set("categoryId", categoryId);
      formData.set("difficulty", difficulty);
      formData.set("contentType", contentType);
      formData.set("tags", tags);

      let result;

      if (entry) {
        result = await updateEntry(entry.id, formData);
      } else {
        result = await createEntry(formData);
      }

      if (result.success) {
        showToast(
          entry ? "Entry updated successfully." : "Entry created successfully.",
          "success",
        );
        setTimeout(() => {
          if (result.slug) {
            router.push(`/${locale}/knowledge/${result.slug}`);
          } else {
            router.push(`/${locale}/knowledge`);
          }
        }, 1200);
      } else {
        showToast(result.error ?? "Something went wrong.", "error");
      }
    });
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      {/* Glass card */}
      <div className="relative overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-6 shadow-md backdrop-blur-xl dark:bg-white/5">
        {/* Shimmer overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-blue-500/5 via-cyan-500/3 to-teal-500/5" />

        <div className="relative z-10">
          {/* Toast */}
          <div className="mb-4 min-h-[1px]">
            <AnimatePresence>
              {toast && <Toast message={toast.message} type={toast.type} />}
            </AnimatePresence>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Locale tabs ── */}
            <div>
              <div className="mb-4 flex gap-1 rounded-xl border border-(--border) bg-(--surface) p-1">
                {LOCALES.map((loc) => (
                  <button
                    key={loc.key}
                    type="button"
                    onClick={() => setActiveLocale(loc.key)}
                    className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      activeLocale === loc.key
                        ? "bg-white text-(--text-1) shadow-sm dark:bg-white/10"
                        : "text-(--text-2) hover:text-(--text-1)"
                    }`}
                  >
                    <span>{loc.flag}</span>
                    <span>{loc.label}</span>
                    {activeLocale === loc.key && (
                      <motion.span
                        layoutId="locale-tab-bg"
                        className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-white/10"
                        style={{ zIndex: -1 }}
                        transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Per-locale fields */}
              {LOCALES.map((loc) => (
                <AnimatePresence key={loc.key} mode="wait" initial={false}>
                  {activeLocale === loc.key && (
                    <motion.div
                      key={loc.key}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
                      className="space-y-4"
                    >
                      <Field
                        label={`Title (${loc.label})${loc.key === "ko" ? " *" : ""}`}
                        htmlFor={`title-${loc.key}`}
                      >
                        <input
                          id={`title-${loc.key}`}
                          type="text"
                          value={content[loc.key].title}
                          onChange={(e) =>
                            updateLocaleField(loc.key, "title", e.target.value)
                          }
                          placeholder={`Enter title in ${loc.label}…`}
                          required={loc.key === "ko"}
                          minLength={loc.key === "ko" ? 3 : undefined}
                          maxLength={200}
                          className={inputCls}
                        />
                      </Field>

                      <MarkdownEditor
                        name={`body-${loc.key}`}
                        value={content[loc.key].body}
                        onChange={(val) =>
                          updateLocaleField(loc.key, "body", val)
                        }
                        label={`Body (${loc.label})${loc.key === "ko" ? " *" : ""}`}
                        placeholder={`Write content in ${loc.label}…`}
                        rows={14}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>

            {/* ── Metadata row ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Category *" htmlFor="categoryId">
                <select
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">— Select category —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.labelEn}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Difficulty" htmlFor="difficulty">
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className={inputCls}
                >
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Content Type" htmlFor="contentType">
                <select
                  id="contentType"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className={inputCls}
                >
                  {CONTENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Tags (comma-separated slugs)" htmlFor="tags">
                <input
                  id="tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. react, typescript, nextjs"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* ── Actions ── */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-600 hover:to-cyan-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Saving…
                  </>
                ) : entry ? (
                  "Save Changes"
                ) : (
                  "Create Entry"
                )}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                disabled={isPending}
                className="rounded-xl border border-(--border) bg-(--surface) px-5 py-2.5 text-sm font-medium text-(--text-2) transition-all hover:bg-(--surface-hover) hover:text-(--text-1) disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
