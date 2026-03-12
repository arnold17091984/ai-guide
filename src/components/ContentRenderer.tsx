"use client";

import CodeBlock from "./CodeBlock";
import ScrollFadeIn from "./ScrollFadeIn";

interface ContentRendererProps {
  content: string;
}

export default function ContentRenderer({ content }: ContentRendererProps) {
  const parts = parseContent(content);

  return (
    <div className="space-y-3">
      {parts.map((part, index) =>
        part.type === "code" ? (
          <ScrollFadeIn key={index}>
            <CodeBlock code={part.text} />
          </ScrollFadeIn>
        ) : (
          <div
            key={index}
            className="whitespace-pre-line text-sm leading-relaxed text-(--text-1)"
          >
            {part.text}
          </div>
        )
      )}
    </div>
  );
}

type Part = { type: "text" | "code"; text: string };

function parseContent(content: string): Part[] {
  const lines = content.split("\n");
  const parts: Part[] = [];
  let currentText: string[] = [];
  let currentCode: string[] = [];

  const flushText = () => {
    if (currentText.length > 0) {
      const text = currentText.join("\n").trim();
      if (text) parts.push({ type: "text", text });
      currentText = [];
    }
  };

  const flushCode = () => {
    if (currentCode.length > 0) {
      const code = currentCode.map((l) => l.replace(/^ {3,}/, "")).join("\n");
      if (code.trim()) parts.push({ type: "code", text: code });
      currentCode = [];
    }
  };

  for (const line of lines) {
    const isCodeLine =
      /^ {3,}\S/.test(line) &&
      /^ {3,}[a-zA-Z0-9/.~${">{]/.test(line);

    if (isCodeLine) {
      flushText();
      currentCode.push(line);
    } else {
      flushCode();
      currentText.push(line);
    }
  }

  flushText();
  flushCode();

  return parts;
}
