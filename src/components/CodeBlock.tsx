"use client";

import { useState } from "react";

interface CodeBlockProps {
  code: string;
  filename?: string;
}

export default function CodeBlock({ code, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-2 overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface)">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-(--border) bg-(--bg-elevated) px-4 py-2">
        <span className="text-xs font-mono text-(--text-3)">
          {filename ?? "shell"}
        </span>
        <button
          onClick={handleCopy}
          className="rounded-md border border-(--border) px-2 py-1 text-xs font-mono text-(--text-2) transition-all hover:bg-(--bg-base) hover:text-(--text-1)"
          title="Copy"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <span className="text-(--accent)">Copied</span>
          ) : (
            "Copy"
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-(--text-1) font-mono">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}
