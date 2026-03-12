"use client";

import { useState } from "react";

interface CodeBlockProps {
  code: string;
}

export default function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-2 overflow-hidden rounded-xl border border-(--border) bg-[#0a0f1e]">
      {/* Subtle left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-linear-to-b from-blue-500 to-cyan-500" />
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded-lg border border-white/10 bg-white/5 p-1.5 text-gray-400 opacity-0 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
        title="Copy"
        aria-label={copied ? "Copied" : "Copy code"}
      >
        {copied ? (
          <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      <pre className="overflow-x-auto p-4 pl-5 pr-12 text-sm leading-relaxed text-gray-300">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}
