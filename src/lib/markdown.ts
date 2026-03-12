// ============================================================
// Lightweight Markdown to HTML renderer
// ============================================================
// No external dependencies. Sanitizes user input before processing
// so generated HTML tags are safe to render via dangerouslySetInnerHTML.
//
// Supported syntax:
//   # ## ### #### ##### ###### — headings
//   **bold** / __bold__
//   *italic* / _italic_
//   `inline code`
//   ```lang\n...\n``` — fenced code blocks
//   - item / * item / + item — unordered lists
//   1. item — ordered lists
//   > blockquote
//   [text](url) — links
//   ![alt](url) — images
//   --- / *** / ___ — horizontal rules
//   | col | col | — tables (GFM-style)
//   Paragraphs separated by blank lines

// ---------------------------------------------------------------------------
// HTML entity escaping (applied to raw user text before any tag injection)
// ---------------------------------------------------------------------------

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Inline markdown → HTML  (bold, italic, code, links, images)
// ---------------------------------------------------------------------------

function renderInline(text: string): string {
  let out = text;

  // Images — must come before links
  out = out.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt, src) =>
      `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="rounded-lg max-w-full" loading="lazy" />`,
  );

  // Links
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label, href) =>
      `<a href="${escapeHtml(href)}" class="text-(--primary) underline hover:opacity-80" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`,
  );

  // Inline code (before bold/italic to avoid double-processing)
  out = out.replace(
    /`([^`]+)`/g,
    (_, code) =>
      `<code class="rounded bg-black/10 px-1.5 py-0.5 font-mono text-sm dark:bg-white/10">${escapeHtml(code)}</code>`,
  );

  // Bold — **text** or __text__
  out = out.replace(
    /\*\*([^*]+)\*\*|__([^_]+)__/g,
    (_, a, b) => `<strong>${escapeHtml(a ?? b)}</strong>`,
  );

  // Italic — *text* or _text_ (single, not double)
  out = out.replace(
    /\*([^*]+)\*|(?<![a-zA-Z0-9])_([^_]+)_(?![a-zA-Z0-9])/g,
    (_, a, b) => `<em>${escapeHtml(a ?? b)}</em>`,
  );

  return out;
}

// ---------------------------------------------------------------------------
// Block-level processing
// ---------------------------------------------------------------------------

function renderTable(lines: string[]): string {
  const rows = lines.map((l) =>
    l
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim()),
  );

  // Row 0 = header, Row 1 = separator, Row 2+ = body
  const header = rows[0];
  const body = rows.slice(2);

  const thCells = header
    .map((h) => `<th class="border border-(--border) px-4 py-2 text-left font-semibold">${renderInline(escapeHtml(h))}</th>`)
    .join("");

  const tbodyRows = body
    .map((row) => {
      const tds = row
        .map((cell) => `<td class="border border-(--border) px-4 py-2">${renderInline(escapeHtml(cell))}</td>`)
        .join("");
      return `<tr class="even:bg-black/5 dark:even:bg-white/5">${tds}</tr>`;
    })
    .join("\n");

  return `<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse text-sm"><thead><tr class="bg-black/5 dark:bg-white/5">${thCells}</tr></thead><tbody>${tbodyRows}</tbody></table></div>`;
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "hr" }
  | { type: "code"; lang: string; code: string }
  | { type: "blockquote"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; lines: string[] }
  | { type: "paragraph"; lines: string[] };

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // --- Blank line: skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // --- Fenced code block
    const fenceMatch = line.match(/^```(\w*)$/);
    if (fenceMatch) {
      const lang = fenceMatch[1] ?? "";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      continue;
    }

    // --- Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    // --- Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // --- Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].replace(/^> /, ""));
        i++;
      }
      blocks.push({ type: "blockquote", lines: quoteLines });
      continue;
    }

    // --- Unordered list
    if (/^[-*+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+] /, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // --- Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // --- Table (line contains |)
    if (line.includes("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        blocks.push({ type: "table", lines: tableLines });
      } else {
        // Too short to be a table — treat as paragraph
        blocks.push({ type: "paragraph", lines: tableLines });
      }
      continue;
    }

    // --- Paragraph: collect consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,6} /) &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("> ") &&
      !/^[-*+] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", lines: paraLines });
    }
  }

  return blocks;
}

function renderBlocks(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading": {
          const tag = `h${block.level}`;
          const sizeClass =
            block.level === 1
              ? "text-3xl font-bold mt-8 mb-4"
              : block.level === 2
                ? "text-2xl font-bold mt-7 mb-3"
                : block.level === 3
                  ? "text-xl font-semibold mt-6 mb-2"
                  : block.level === 4
                    ? "text-lg font-semibold mt-5 mb-2"
                    : "text-base font-semibold mt-4 mb-1";
          return `<${tag} class="${sizeClass} text-(--text-1)">${renderInline(escapeHtml(block.text))}</${tag}>`;
        }

        case "hr":
          return `<hr class="my-8 border-(--border)" />`;

        case "code": {
          const langLabel = block.lang
            ? `<span class="absolute right-3 top-2 text-xs text-white/50 font-mono select-none">${escapeHtml(block.lang)}</span>`
            : "";
          return `<div class="relative my-4 rounded-xl bg-[#0d1117] overflow-hidden">${langLabel}<pre class="overflow-x-auto p-4 pt-6 font-mono text-sm text-[#e6edf3]"><code>${escapeHtml(block.code)}</code></pre></div>`;
        }

        case "blockquote": {
          const inner = block.lines
            .map((l) => renderInline(escapeHtml(l)))
            .join("<br />");
          return `<blockquote class="my-4 border-l-4 border-(--primary) pl-4 text-(--text-2) italic">${inner}</blockquote>`;
        }

        case "ul": {
          const items = block.items
            .map(
              (item) =>
                `<li class="flex gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--primary)"></span><span>${renderInline(escapeHtml(item))}</span></li>`,
            )
            .join("\n");
          return `<ul class="my-4 space-y-2 text-(--text-1)">${items}</ul>`;
        }

        case "ol": {
          const items = block.items
            .map(
              (item, idx) =>
                `<li class="flex gap-2"><span class="shrink-0 font-mono text-sm text-(--primary)">${idx + 1}.</span><span>${renderInline(escapeHtml(item))}</span></li>`,
            )
            .join("\n");
          return `<ol class="my-4 space-y-2 text-(--text-1)">${items}</ol>`;
        }

        case "table":
          return renderTable(block.lines);

        case "paragraph": {
          const text = block.lines.join(" ");
          return `<p class="my-3 leading-7 text-(--text-1)">${renderInline(escapeHtml(text))}</p>`;
        }
      }
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a markdown string to sanitized HTML.
 * Safe to pass directly to `dangerouslySetInnerHTML`.
 */
export function renderMarkdown(md: string): string {
  if (!md || md.trim() === "") return "";

  // Normalize line endings
  const normalized = md.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const blocks = parseBlocks(lines);
  return renderBlocks(blocks);
}
