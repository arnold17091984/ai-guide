"use client";

import { useState, useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import { analyzeClaudeMdFile } from "@/lib/claude-md/actions";
import type { ClaudeMdAnalysis } from "@/lib/skill-registry/types";
import PageHeader from "@/components/PageHeader";
import ClaudeMdResults from "@/components/ClaudeMdResults";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function GearIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ClaudeMdPage() {
  const t = useTranslations("claudeMd");

  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ClaudeMdAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setContent(typeof evt.target?.result === "string" ? evt.target.result : "");
    };
    reader.readAsText(file);
  }

  function handleAnalyze() {
    if (!content.trim()) {
      setError(t("errorEmpty"));
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await analyzeClaudeMdFile(content);
        setAnalysis(result);
        // Scroll to results after a short paint delay
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } catch {
        setError(t("errorGeneric"));
      }
    });
  }

  const resultLabels = {
    scores: t("results.scores"),
    completeness: t("results.completeness"),
    quality: t("results.quality"),
    sections: t("results.sections"),
    missingSections: t("results.missingSections"),
    noMissingSections: t("results.noMissingSections"),
    conflicts: t("results.conflicts"),
    noConflicts: t("results.noConflicts"),
    rules: t("results.rules"),
    noRules: t("results.noRules"),
    template: t("results.template"),
    templateMatch: t("results.templateMatch"),
    templateMissing: t("results.templateMissing"),
    templateExtra: t("results.templateExtra"),
    improvements: t("results.improvements"),
    noImprovements: t("results.noImprovements"),
    line: t("results.line"),
    conflictExplanation: t("results.conflictExplanation"),
    conflictResolution: t("results.conflictResolution"),
    exampleContent: t("results.exampleContent"),
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        gradient="from-indigo-600 via-blue-600 to-cyan-600"
        icon={<GearIcon />}
      />

      <div className="space-y-8">
        {/* Mode tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.medium, ease: EASE_APPLE }}
          className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-xl"
        >
          {(["paste", "upload"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setInputMode(mode);
                setError(null);
              }}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                inputMode === mode
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-(--text-2) hover:text-(--text-1)"
              }`}
            >
              {mode === "paste" ? t("modePaste") : t("modeUpload")}
            </button>
          ))}
        </motion.div>

        {/* Input area */}
        <motion.div
          key={inputMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          {inputMode === "paste" ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-(--text-1)">
                {t("pasteLabel")}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("pastePlaceholder")}
                rows={14}
                className="w-full resize-y rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-sm text-(--text-1) placeholder:text-(--text-2) backdrop-blur-sm transition-colors focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                spellCheck={false}
              />
              <p className="text-xs text-(--text-2)">
                {content.split("\n").length} {t("lines")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-(--text-1)">
                {t("uploadLabel")}
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-white/20 bg-black/10 py-12 text-(--text-2) transition-colors hover:border-blue-500/50 hover:text-blue-400"
              >
                <UploadIcon />
                <span className="text-sm font-medium">
                  {fileName ?? t("uploadCta")}
                </span>
                <span className="text-xs">{t("uploadHint")}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt"
                onChange={handleFileChange}
                className="hidden"
                aria-label={t("uploadLabel")}
              />
              {content && (
                <p className="text-xs text-green-400">
                  {t("uploadLoaded")}: {content.split("\n").length} {t("lines")}
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: DURATION.fast }}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analyze button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION.medium, delay: 0.2 }}
        >
          <button
            onClick={handleAnalyze}
            disabled={isPending || !content.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                {t("analyzing")}
              </>
            ) : (
              <>
                <SparkIcon />
                {t("analyze")}
              </>
            )}
          </button>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {analysis && !isPending && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast }}
            >
              <h2 className="mb-6 text-xl font-bold text-(--text-1)">{t("resultsHeading")}</h2>
              <ClaudeMdResults analysis={analysis} labels={resultLabels} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
