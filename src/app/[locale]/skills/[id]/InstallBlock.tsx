"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { incrementDownload } from "@/lib/skills/actions";

// ============================================================
// InstallBlock
// ============================================================
// Displays a copy-to-clipboard code block for the install command.
// Fires incrementDownload server action on copy.
// ============================================================

interface InstallBlockProps {
  command: string;
  skillId: string;
  copyLabel: string;
  copiedLabel: string;
}

export default function InstallBlock({
  command,
  skillId,
  copyLabel,
  copiedLabel,
}: InstallBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      // Fire download increment in background (no await — fire-and-forget)
      incrementDownload(skillId).catch(() => {});
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable in some browsers; silently ignore
    }
  }, [command, skillId]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#0d1117]">
      {/* Language label */}
      <span className="absolute right-14 top-2.5 select-none font-mono text-xs text-white/40">
        bash
      </span>

      {/* Copy button */}
      <motion.button
        type="button"
        aria-label={copied ? copiedLabel : copyLabel}
        onClick={handleCopy}
        whileTap={{ scale: 0.9 }}
        className={[
          "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
          copied
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white",
        ].join(" ")}
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
            >
              <CheckIcon />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
            >
              <CopyIcon />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Command */}
      <pre className="overflow-x-auto px-4 py-4 font-mono text-sm text-[#e6edf3]">
        <code>
          <span className="select-none text-white/30">$ </span>
          {command}
        </code>
      </pre>
    </div>
  );
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
