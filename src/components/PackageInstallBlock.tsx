"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";

// ============================================================
// PackageInstallBlock
// ============================================================
// Code block showing how to install all skills in a package.

interface PackageInstallBlockProps {
  packageSlug: string;
  skillSlugs: string[];
  packageId: string;
  onInstall?: () => void;
  copyLabel?: string;
  copiedLabel?: string;
  installLabel?: string;
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function CopyIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PackageInstallBlock({
  packageSlug,
  skillSlugs,
  onInstall,
  copyLabel = "Copy",
  copiedLabel = "Copied!",
  installLabel = "Install All",
}: PackageInstallBlockProps) {
  const [copied, setCopied] = useState(false);

  // Generate CLAUDE.md snippet
  const snippet = `# Skills from package: ${packageSlug}\n${skillSlugs.map((s) => `npx claude-skill install ${s}`).join("\n")}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      onInstall?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [snippet, onInstall]);

  return (
    <div className="overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface) font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-(--border) bg-(--bg-elevated) px-4 py-2.5">
        <span className="text-xs font-medium text-(--text-2)">
          {installLabel}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-(--text-2) transition-colors hover:bg-(--bg-base) hover:text-(--text-1)"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
                className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
              >
                <CheckIcon />
                {copiedLabel}
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
                className="flex items-center gap-1"
              >
                <CopyIcon />
                {copyLabel}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Code block */}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="text-(--text-1)">
          {skillSlugs.map((slug, i) => (
            <span key={slug} className="block">
              <span className="text-(--text-2)">$</span>{" "}
              npx claude-skill install{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                {slug}
              </span>
              {i < skillSlugs.length - 1 ? "" : ""}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
