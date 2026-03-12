"use client";

// ============================================================
// ValidateOnlyForm — Public validate page
// Supports paste (textarea) + file upload, no publishing
// ============================================================

import { useState, useRef, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import ValidationResults from "@/components/ValidationResults";
import { validateSkillFile } from "@/lib/skills/upload-actions";
import type { ValidationReport } from "@/lib/skill-registry/types";

type InputMode = "paste" | "file";

const SAMPLE_SKILL = `---
name: My Example Skill
description: A short description of what this skill does for users.
version: 1.0.0
author: your-handle
category: workflow
triggers:
  - "run my example"
  - "example skill"
tags:
  - example
license: MIT
---

## What This Skill Does

Describe what Claude should do when this skill is triggered.

## Usage

\`\`\`bash
# Example command
echo "This is how you use the skill"
\`\`\`

## Notes

Add any additional notes or caveats here.
`;

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function ValidateOnlyForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [pasteContent, setPasteContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeContent = inputMode === "paste" ? pasteContent : (fileContent ?? "");

  // ----------------------------------------------------------
  // File load
  // ----------------------------------------------------------

  const loadFile = (file: File) => {
    if (!file.name.endsWith(".md") && file.type !== "text/markdown") {
      setError("Only .md (Markdown) files are accepted.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        setFileContent(content);
        setFileName(file.name);
        setReport(null);
        setError(null);
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setInputMode("file");
      loadFile(file);
    }
  };

  // ----------------------------------------------------------
  // Validate
  // ----------------------------------------------------------

  const handleValidate = () => {
    if (!activeContent.trim()) {
      setError("Please paste skill content or upload a file first.");
      return;
    }
    setError(null);
    setReport(null);

    startTransition(async () => {
      const res = await validateSkillFile(activeContent);
      if (res.success) {
        setReport(res.report);
      } else {
        setError(res.error);
      }
    });
  };

  const handleLoadSample = () => {
    setPasteContent(SAMPLE_SKILL);
    setReport(null);
    setError(null);
    setInputMode("paste");
  };

  const handleClear = () => {
    setPasteContent("");
    setFileContent(null);
    setFileName(null);
    setReport(null);
    setError(null);
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Mode switcher */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {(["paste", "file"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setInputMode(mode)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-150 ${
              inputMode === mode
                ? "bg-white/15 text-(--text-1) shadow-sm"
                : "text-(--text-2) hover:text-(--text-1)"
            }`}
          >
            {mode === "paste" ? "Paste Content" : "Upload File"}
          </button>
        ))}
      </div>

      {/* Paste mode */}
      <AnimatePresence mode="wait">
        {inputMode === "paste" && (
          <motion.div
            key="paste"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
          >
            <div className="relative">
              <textarea
                value={pasteContent}
                onChange={(e) => {
                  setPasteContent(e.target.value);
                  setReport(null);
                  setError(null);
                }}
                placeholder={`Paste your skill .md content here...\n\n---\nname: My Skill\ndescription: ...\n---\n\n## Body`}
                rows={14}
                spellCheck={false}
                className="w-full rounded-xl border border-white/15 bg-black/20 p-4 font-mono text-xs text-(--text-1) placeholder:text-(--text-2)/40 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 resize-y backdrop-blur-sm transition-colors"
              />
              {pasteContent && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-3 rounded-lg p-1.5 text-(--text-2) transition-colors hover:bg-white/10 hover:text-(--text-1)"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              )}
            </div>
            {!pasteContent && (
              <button
                type="button"
                onClick={handleLoadSample}
                className="mt-2 text-xs text-cyan-400 hover:underline transition-colors"
              >
                Load sample skill to try it out
              </button>
            )}
          </motion.div>
        )}

        {/* File upload mode */}
        {inputMode === "file" && (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
          >
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => !fileContent && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-all ${
                fileContent
                  ? "cursor-default border-white/20 bg-white/5"
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
                <div className="flex items-center gap-3">
                  <svg className="h-7 w-7 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-(--text-1)">{fileName}</p>
                    <p className="text-xs text-(--text-2)">
                      {((fileContent.length) / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleClear(); }}
                    className="ml-2 rounded-lg p-1.5 text-(--text-2) transition-colors hover:bg-white/10 hover:text-(--text-1)"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <svg className="h-9 w-9 text-(--text-2)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-(--text-1)">
                      Drop .md file or{" "}
                      <span className="text-cyan-400 underline decoration-dashed">browse</span>
                    </p>
                    <p className="text-xs text-(--text-2)">Max 512 KB</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
            className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
          >
            <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validate button */}
      <button
        type="button"
        disabled={isPending || !activeContent.trim()}
        onClick={handleValidate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-500 py-3 text-sm font-semibold text-white shadow-md shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-blue-400 hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Spinner />
            Running validation...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            Run Validation
          </>
        )}
      </button>

      {/* Validation results */}
      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
          >
            <ValidationResults report={report} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
