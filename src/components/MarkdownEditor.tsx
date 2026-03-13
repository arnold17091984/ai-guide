"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";

// ============================================================
// Lightweight Markdown → HTML converter
// No external library. Handles the subset specified in the spec.
// ============================================================

function renderMarkdown(md: string): string {
  let html = md
    // Escape HTML entities first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Fenced code blocks (``` … ```) — process before inline code
  html = html.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const langAttr = lang.trim() ? ` data-lang="${lang.trim()}"` : "";
    return `<pre${langAttr}><code>${code}</code></pre>`;
  });

  // Process line by line for block-level elements
  const lines = html.split("\n");
  const output: string[] = [];
  let inUl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    if (line.startsWith("### ")) {
      if (inUl) { output.push("</ul>"); inUl = false; }
      output.push(`<h3 class="md-h3">${applyInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      if (inUl) { output.push("</ul>"); inUl = false; }
      output.push(`<h2 class="md-h2">${applyInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      if (inUl) { output.push("</ul>"); inUl = false; }
      output.push(`<h1 class="md-h1">${applyInline(line.slice(2))}</h1>`);
      continue;
    }

    // Blockquotes
    if (line.startsWith("&gt; ")) {
      if (inUl) { output.push("</ul>"); inUl = false; }
      output.push(`<blockquote class="md-blockquote">${applyInline(line.slice(5))}</blockquote>`);
      continue;
    }

    // Unordered list items
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inUl) { output.push("<ul class=\"md-ul\">"); inUl = true; }
      output.push(`<li class="md-li">${applyInline(line.slice(2))}</li>`);
      continue;
    }

    // Close list if open
    if (inUl) {
      output.push("</ul>");
      inUl = false;
    }

    // Empty line → paragraph break
    if (line.trim() === "") {
      output.push("<br />");
      continue;
    }

    // Default: paragraph
    output.push(`<p class="md-p">${applyInline(line)}</p>`);
  }

  if (inUl) output.push("</ul>");

  return output.join("\n");
}

/** Apply inline formatting: bold, italic, inline code, links. */
function applyInline(text: string): string {
  return text
    // Inline code — before bold/italic to avoid nested parsing
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    // Italic (single asterisk)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    // Links [text](url)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>',
    );
}

// ============================================================
// Toolbar helpers
// ============================================================

type WrapConfig = {
  prefix: string;
  suffix: string;
  placeholder: string;
};

function wrapSelection(
  textarea: HTMLTextAreaElement,
  config: WrapConfig,
): string {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const selected = value.slice(start, end) || config.placeholder;
  const before = value.slice(0, start);
  const after = value.slice(end);
  return `${before}${config.prefix}${selected}${config.suffix}${after}`;
}

function insertLinePrefix(
  textarea: HTMLTextAreaElement,
  prefix: string,
  placeholder: string,
): string {
  const { selectionStart: start, value } = textarea;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = value.indexOf("\n", start);
  const end = lineEnd === -1 ? value.length : lineEnd;
  const line = value.slice(lineStart, end) || placeholder;
  return `${value.slice(0, lineStart)}${prefix}${line}${value.slice(end)}`;
}

// ============================================================
// Component
// ============================================================

interface MarkdownEditorProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
}

type Tab = "edit" | "preview";

const TOOLBAR = [
  { id: "h1", label: "H1", title: "Heading 1" },
  { id: "h2", label: "H2", title: "Heading 2" },
  { id: "bold", label: "B", title: "Bold" },
  { id: "italic", label: "I", title: "Italic" },
  { id: "code", label: "</>", title: "Inline code" },
  { id: "list", label: "≡", title: "List item" },
] as const;

type ToolbarAction = (typeof TOOLBAR)[number]["id"];

export default function MarkdownEditor({
  name,
  value,
  onChange,
  placeholder = "Write your content in Markdown…",
  rows = 16,
  label,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<Tab>("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyToolbar = useCallback(
    (action: ToolbarAction) => {
      const ta = textareaRef.current;
      if (!ta) return;

      let next = value;

      switch (action) {
        case "h1":
          next = insertLinePrefix(ta, "# ", "Heading 1");
          break;
        case "h2":
          next = insertLinePrefix(ta, "## ", "Heading 2");
          break;
        case "bold":
          next = wrapSelection(ta, {
            prefix: "**",
            suffix: "**",
            placeholder: "bold text",
          });
          break;
        case "italic":
          next = wrapSelection(ta, {
            prefix: "*",
            suffix: "*",
            placeholder: "italic text",
          });
          break;
        case "code":
          next = wrapSelection(ta, {
            prefix: "`",
            suffix: "`",
            placeholder: "code",
          });
          break;
        case "list":
          next = insertLinePrefix(ta, "- ", "List item");
          break;
      }

      onChange(next);
      // Restore focus after state update
      requestAnimationFrame(() => ta.focus());
    },
    [value, onChange],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const { selectionStart: start, selectionEnd: end, value: v } = ta;
      const next = `${v.slice(0, start)}\t${v.slice(end)}`;
      onChange(next);
      // Move cursor after the tab character
      requestAnimationFrame(() => {
        ta.selectionStart = start + 1;
        ta.selectionEnd = start + 1;
      });
    }
  }

  const preview = renderMarkdown(value);

  return (
    <div className="flex flex-col gap-0">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-(--text-1)">
          {label}
        </label>
      )}

      {/* Outer container */}
      <div className="relative overflow-hidden rounded-md border border-(--border) bg-(--bg-surface) shadow-sm">
        {/* Tab bar + Toolbar row */}
        <div className="flex items-center justify-between border-b border-(--border) bg-(--bg-elevated) px-2">
          {/* Edit / Preview tabs */}
          <div className="relative flex">
            {(["edit", "preview"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`relative px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  tab === t
                    ? "text-(--accent)"
                    : "text-(--text-2) hover:text-(--text-1)"
                }`}
              >
                {t === "edit" ? "Edit" : "Preview"}
                {tab === t && (
                  <motion.span
                    layoutId="md-tab-indicator"
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-(--accent)"
                    transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Toolbar — only shown in Edit mode */}
          <AnimatePresence initial={false}>
            {tab === "edit" && (
              <motion.div
                key="toolbar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.fast }}
                className="flex items-center gap-0.5 py-1"
              >
                {TOOLBAR.map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    title={btn.title}
                    onMouseDown={(e) => {
                      // Prevent textarea from losing focus
                      e.preventDefault();
                      applyToolbar(btn.id);
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold text-(--text-2) transition-colors hover:bg-(--accent-muted) hover:text-(--accent) ${
                      btn.id === "italic" ? "italic" : ""
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait" initial={false}>
          {tab === "edit" ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
            >
              <textarea
                ref={textareaRef}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={rows}
                placeholder={placeholder}
                spellCheck
                className="w-full resize-y bg-transparent px-4 py-3 font-mono text-sm text-(--text-1) placeholder:text-(--text-2) outline-none"
              />
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
              className="min-h-[200px] px-4 py-3"
            >
              {value.trim() ? (
                <div
                  className="md-prose"
                  // Safe — we control the renderer and escape HTML entities
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              ) : (
                <p className="text-sm italic text-(--text-2)">
                  Nothing to preview yet. Switch to Edit and start writing.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Markdown prose styles injected as a style tag */}
      <style>{`
        .md-prose .md-h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; color: var(--text-1); }
        .md-prose .md-h2 { font-size: 1.25rem; font-weight: 600; margin: 0.875rem 0 0.4rem; color: var(--text-1); }
        .md-prose .md-h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.35rem; color: var(--text-1); }
        .md-prose .md-p  { margin: 0.35rem 0; line-height: 1.7; font-size: 0.9rem; color: var(--text-1); }
        .md-prose .md-blockquote {
          border-left: 3px solid var(--accent);
          padding: 0.3rem 0.75rem;
          margin: 0.5rem 0;
          color: var(--text-2);
          font-style: italic;
          font-size: 0.9rem;
        }
        .md-prose .md-ul { list-style: disc; padding-left: 1.4rem; margin: 0.4rem 0; }
        .md-prose .md-li { margin: 0.2rem 0; font-size: 0.9rem; color: var(--text-1); }
        .md-prose .md-code {
          background: var(--accent-muted);
          color: var(--accent);
          border-radius: 4px;
          padding: 0.1em 0.35em;
          font-size: 0.82em;
          font-family: monospace;
        }
        .md-prose pre {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          overflow-x: auto;
          margin: 0.6rem 0;
          font-size: 0.82rem;
          font-family: monospace;
          color: var(--text-1);
        }
        .md-prose pre code { background: none; padding: 0; font-size: inherit; color: inherit; }
        .md-prose .md-link { color: var(--accent); text-decoration: underline; }
        .md-prose strong { font-weight: 600; }
        .md-prose em { font-style: italic; }
      `}</style>
    </div>
  );
}
