"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DURATION, EASE_APPLE } from "@/lib/motion";
import { createCaseStudy } from "@/lib/case-studies/actions";
import type { CaseStudyActionResult } from "@/lib/case-studies/actions";
import { renderMarkdown } from "@/lib/markdown";

// ============================================================
// Types
// ============================================================

interface Category {
  id: string;
  slug: string;
  label: string | null;
}

interface CaseStudyFormProps {
  categories: Category[];
}

type Tab = "write" | "preview";

// ============================================================
// CaseStudyForm
// ============================================================

export default function CaseStudyForm({ categories }: CaseStudyFormProps) {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? "en";

  const [activeTab, setActiveTab] = useState<Tab>("write");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state — primary locale is English for new case studies
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const [techStackRaw, setTechStackRaw] = useState("");

  const previewHtml = renderMarkdown(body);

  // ============================================================
  // Submit
  // ============================================================

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    startTransition(async () => {
      const techStack = techStackRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const result: CaseStudyActionResult = await createCaseStudy({
        titleKo: title.trim(),
        titleEn: title.trim(),
        summaryKo: summary.trim() || undefined,
        summaryEn: summary.trim() || undefined,
        bodyKo: body.trim() || undefined,
        bodyEn: body.trim() || undefined,
        categoryId: categoryId || undefined,
        industry: industry.trim() || undefined,
        teamSize: teamSize ? parseInt(teamSize, 10) : undefined,
        projectDurationWeeks: durationWeeks
          ? parseInt(durationWeeks, 10)
          : undefined,
        techStack: techStack.length > 0 ? techStack : undefined,
      });

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      // Redirect to the new case study
      router.push(`/${locale}/case-studies`);
    });
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metadata grid */}
      <div className="rounded-2xl border border-(--border) bg-white/70 p-6 backdrop-blur-xl shadow-md dark:bg-white/5">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-(--text-2)">
          Metadata
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Title */}
          <div className="sm:col-span-2">
            <label
              htmlFor="cs-title"
              className="mb-1.5 block text-sm font-medium text-(--text-1)"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="cs-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How we cut deploy time by 70% using Claude Code"
              className="w-full rounded-xl border border-(--border) bg-white/80 px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 dark:bg-white/5"
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="cs-category"
              className="mb-1.5 block text-sm font-medium text-(--text-1)"
            >
              Category
            </label>
            <select
              id="cs-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-(--border) bg-white/80 px-4 py-2.5 text-sm text-(--text-1) focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 dark:bg-white/5"
            >
              <option value="">Select category…</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label ?? cat.slug}
                </option>
              ))}
            </select>
          </div>

          {/* Industry */}
          <div>
            <label
              htmlFor="cs-industry"
              className="mb-1.5 block text-sm font-medium text-(--text-1)"
            >
              Industry
            </label>
            <input
              id="cs-industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. SaaS, Fintech, Healthcare"
              className="w-full rounded-xl border border-(--border) bg-white/80 px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 dark:bg-white/5"
            />
          </div>

          {/* Team size */}
          <div>
            <label
              htmlFor="cs-team"
              className="mb-1.5 block text-sm font-medium text-(--text-1)"
            >
              Team size
            </label>
            <input
              id="cs-team"
              type="number"
              min={1}
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              placeholder="e.g. 1, 5, 20"
              className="w-full rounded-xl border border-(--border) bg-white/80 px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 dark:bg-white/5"
            />
          </div>

          {/* Duration */}
          <div>
            <label
              htmlFor="cs-duration"
              className="mb-1.5 block text-sm font-medium text-(--text-1)"
            >
              Project duration (weeks)
            </label>
            <input
              id="cs-duration"
              type="number"
              min={1}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              placeholder="e.g. 4, 8, 12"
              className="w-full rounded-xl border border-(--border) bg-white/80 px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 dark:bg-white/5"
            />
          </div>

          {/* Tech stack */}
          <div className="sm:col-span-2">
            <label
              htmlFor="cs-tech"
              className="mb-1.5 block text-sm font-medium text-(--text-1)"
            >
              Tech stack{" "}
              <span className="text-xs font-normal text-(--text-2)">(comma separated)</span>
            </label>
            <input
              id="cs-tech"
              type="text"
              value={techStackRaw}
              onChange={(e) => setTechStackRaw(e.target.value)}
              placeholder="e.g. Next.js, Supabase, Claude Code"
              className="w-full rounded-xl border border-(--border) bg-white/80 px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 dark:bg-white/5"
            />
          </div>

          {/* Summary */}
          <div className="sm:col-span-2">
            <label
              htmlFor="cs-summary"
              className="mb-1.5 block text-sm font-medium text-(--text-1)"
            >
              Summary{" "}
              <span className="text-xs font-normal text-(--text-2)">(shown on cards)</span>
            </label>
            <textarea
              id="cs-summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="1–3 sentence overview of the case study…"
              className="w-full resize-none rounded-xl border border-(--border) bg-white/80 px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 dark:bg-white/5"
            />
          </div>
        </div>
      </div>

      {/* Write / Preview tabs */}
      <div className="rounded-2xl border border-(--border) bg-white/70 backdrop-blur-xl shadow-md dark:bg-white/5 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-(--border)">
          {(["write", "preview"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors duration-150 ${
                activeTab === tab
                  ? "border-b-2 border-violet-500 text-violet-600 dark:text-violet-400"
                  : "text-(--text-2) hover:text-(--text-1)"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Write pane */}
        {activeTab === "write" && (
          <div className="p-4">
            <textarea
              rows={24}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`# Background\n\nDescribe your project context, team, and starting point...\n\n## The Challenge\n\n## How We Used Claude Code\n\n## Results & Metrics\n\n## Lessons Learned`}
              className="w-full resize-y rounded-xl border border-(--border) bg-white/80 px-4 py-3 font-mono text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 dark:bg-black/20"
              style={{ minHeight: "400px" }}
            />
            <p className="mt-2 text-xs text-(--text-2)">
              Markdown supported: **bold**, *italic*, `code`, # headings, - lists
            </p>
          </div>
        )}

        {/* Preview pane */}
        {activeTab === "preview" && (
          <div className="min-h-[400px] p-6">
            {previewHtml ? (
              <article
                className="prose-sm sm:prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-sm text-(--text-2)">Nothing to preview yet. Write some Markdown first.</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="rounded-xl border border-(--border) px-5 py-2.5 text-sm font-medium text-(--text-2) hover:bg-(--surface-hover) transition-colors disabled:opacity-50"
        >
          Cancel
        </button>

        <motion.button
          type="submit"
          disabled={isPending || !title.trim()}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: DURATION.fast }}
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13zM13.25 9a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-.5zM6.5 12.25a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v2a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75v-2zm3.75-1.75a.75.75 0 00-.75.75v3.25c0 .414.336.75.75.75h.5a.75.75 0 00.75-.75v-3.25a.75.75 0 00-.75-.75h-.5z" />
              </svg>
              Save Draft
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}
