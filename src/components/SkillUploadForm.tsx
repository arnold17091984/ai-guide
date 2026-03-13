"use client";

// ============================================================
// SkillUploadForm — Drag-and-drop or browse for .md skill files
// ============================================================

import { useState, useRef, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_APPLE, DURATION, fadeUp } from "@/lib/motion";
import ValidationResults from "@/components/ValidationResults";
import { validateSkillFile, publishSkill } from "@/lib/skills/upload-actions";
import type { ValidationReport } from "@/lib/skill-registry/types";

// ----------------------------------------------------------
// Types
// ----------------------------------------------------------

type UploadMode = "idle" | "selected" | "validating" | "publishing";
type ResultState =
  | null
  | { kind: "validation"; report: ValidationReport }
  | { kind: "publish-success"; skillId: string; slug: string; status: string }
  | { kind: "publish-blocked"; report: ValidationReport; message: string }
  | { kind: "error"; message: string };

// ----------------------------------------------------------
// Sub-components
// ----------------------------------------------------------

function UploadIcon() {
  return (
    <svg className="h-10 w-10 text-(--text-2)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" fill="none" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function PublishSuccessBanner({
  slug,
  status,
  onReset,
}: {
  slug: string;
  status: string;
  onReset: () => void;
}) {
  const isQuarantined = status === "quarantined";
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={`rounded-2xl border p-6 ${
        isQuarantined
          ? "border-amber-500/30 bg-amber-500/10"
          : "border-green-500/30 bg-green-500/10"
      }`}
    >
      <div className="flex items-start gap-4">
        {isQuarantined ? (
          <svg className="mt-0.5 h-8 w-8 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ) : (
          <svg className="mt-0.5 h-8 w-8 shrink-0 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )}
        <div className="flex-1">
          <p className={`font-semibold ${isQuarantined ? "text-amber-400" : "text-green-400"}`}>
            {isQuarantined ? "Skill Quarantined for Review" : "Skill Published Successfully"}
          </p>
          <p className="mt-1 text-sm text-(--text-2)">
            {isQuarantined
              ? "Security findings require manual review before this skill becomes publicly visible."
              : `Skill "${slug}" is now live in the registry.`}
          </p>
          <p className="mt-1 font-mono text-xs text-(--text-2)">slug: {slug}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-(--text-1) transition-colors hover:bg-white/15"
      >
        Upload another skill
      </button>
    </motion.div>
  );
}

// ----------------------------------------------------------
// Main component
// ----------------------------------------------------------

export default function SkillUploadForm({ showPublish = true }: { showPublish?: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState>(null);
  const [mode, setMode] = useState<UploadMode>("idle");
  const [isValidating, startValidating] = useTransition();
  const [isPublishing, startPublishing] = useTransition();

  const busy = isValidating || isPublishing;

  // ----------------------------------------------------------
  // File handling
  // ----------------------------------------------------------

  const loadFile = useCallback((file: File) => {
    if (!file.name.endsWith(".md") && file.type !== "text/markdown") {
      setResult({ kind: "error", message: "Only .md (Markdown) files are accepted." });
      return;
    }
    if (file.size > 512_000) {
      setResult({ kind: "error", message: "File is too large. Maximum size is 512 KB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        setFileContent(content);
        setFileName(file.name);
        setMode("selected");
        setResult(null);
      }
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleReset = () => {
    setFileName(null);
    setFileContent(null);
    setMode("idle");
    setResult(null);
  };

  // ----------------------------------------------------------
  // Actions
  // ----------------------------------------------------------

  const handleValidate = () => {
    if (!fileContent) return;
    setMode("validating");
    startValidating(async () => {
      try {
        const res = await validateSkillFile(fileContent);
        if (res.success) {
          setResult({ kind: "validation", report: res.report });
        } else {
          setResult({ kind: "error", message: res.error });
        }
      } catch {
        setResult({ kind: "error", message: "Validation failed. Please try again." });
      } finally {
        setMode("selected");
      }
    });
  };

  const handlePublish = () => {
    if (!fileContent) return;
    setMode("publishing");
    startPublishing(async () => {
      try {
        const res = await publishSkill(fileContent);
        if (res.success) {
          setResult({
            kind: "publish-success",
            skillId: res.skillId,
            slug: res.slug,
            status: res.status,
          });
          setMode("idle");
        } else if ("report" in res && res.report) {
          setResult({ kind: "publish-blocked", report: res.report, message: res.error });
          setMode("selected");
        } else {
          setResult({ kind: "error", message: res.error });
          setMode("selected");
        }
      } catch {
        setResult({ kind: "error", message: "Publish failed. Please try again." });
        setMode("selected");
      }
    });
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <AnimatePresence mode="wait">
        {mode !== "idle" || result?.kind !== "publish-success" ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !fileContent && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
                isDragging
                  ? "border-cyan-400/60 bg-cyan-500/10"
                  : fileContent
                  ? "border-white/20 bg-white/5 cursor-default"
                  : "cursor-pointer border-white/20 bg-white/5 hover:border-cyan-400/40 hover:bg-cyan-500/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,text/markdown"
                onChange={handleFileInput}
                className="sr-only"
              />

              {fileContent ? (
                <>
                  {/* File selected state */}
                  <div className="flex items-center gap-3">
                    <svg className="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <div className="text-left">
                      <p className="font-semibold text-(--text-1)">{fileName}</p>
                      <p className="text-xs text-(--text-2)">
                        {(fileContent.length / 1024).toFixed(1)} KB &middot;{" "}
                        {fileContent.split("\n").length} lines
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="absolute right-4 top-4 rounded-lg p-1.5 text-(--text-2) transition-colors hover:bg-white/10 hover:text-(--text-1)"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <UploadIcon />
                  <div>
                    <p className="font-semibold text-(--text-1)">
                      Drop your skill file here, or{" "}
                      <span className="text-cyan-400 underline decoration-dashed underline-offset-2">
                        browse
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-(--text-2)">.md files only &middot; max 512 KB</p>
                  </div>
                </>
              )}
            </div>

            {/* Preview */}
            <AnimatePresence>
              {fileContent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
                  className="mt-3 overflow-hidden"
                >
                  <details className="group">
                    <summary className="cursor-pointer select-none rounded-lg px-3 py-2 text-xs font-medium text-(--text-2) hover:bg-white/5 hover:text-(--text-1) transition-colors list-none flex items-center gap-2">
                      <svg
                        className="h-3.5 w-3.5 transition-transform duration-150 group-open:rotate-90"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                      Preview file contents
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs text-(--text-1) leading-relaxed">
                      <code>{fileContent}</code>
                    </pre>
                  </details>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <AnimatePresence>
              {fileContent && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
                  className="mt-4 flex flex-wrap gap-3"
                >
                  {/* Validate button */}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleValidate}
                    className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-(--text-1) transition-all hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isValidating ? (
                      <>
                        <Spinner />
                        Validating...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 11l3 3L22 4" />
                          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                        </svg>
                        Validate
                      </>
                    )}
                  </button>

                  {/* Validate & Publish button (only shown when showPublish=true) */}
                  {showPublish && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handlePublish}
                      className="flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-blue-400 hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isPublishing ? (
                        <>
                          <Spinner />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 2L11 13" />
                            <path d="M22 2L15 22 11 13 2 9l20-7z" />
                          </svg>
                          Validate &amp; Publish
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Results area */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.kind}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
          >
            {result.kind === "error" && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                <svg className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {result.message}
              </div>
            )}

            {result.kind === "validation" && (
              <ValidationResults report={result.report} />
            )}

            {result.kind === "publish-blocked" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-400">
                  <svg className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {result.message}
                </div>
                <ValidationResults report={result.report} />
              </div>
            )}

            {result.kind === "publish-success" && (
              <PublishSuccessBanner
                slug={result.slug}
                status={result.status}
                onReset={handleReset}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
