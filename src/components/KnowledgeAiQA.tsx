"use client";

import { useState, useRef, useCallback } from "react";
import { useLocale } from "next-intl";

interface KnowledgeAiQAProps {
  slug: string;
}

export default function KnowledgeAiQA({ slug }: KnowledgeAiQAProps) {
  const locale = useLocale();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const answerRef = useRef<HTMLDivElement>(null);

  const handleAsk = useCallback(async () => {
    if (!question.trim() || loading) return;
    setAnswer("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/knowledge-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, question, locale }),
      });

      if (!res.ok) {
        setError("AI Q&A is not available right now.");
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data) as { text?: string; error?: string };
              if (parsed.text) setAnswer((prev) => prev + parsed.text);
              if (parsed.error) setError(parsed.error);
            } catch {
              // skip
            }
          }
        }
      }

      setTimeout(() => {
        answerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    } catch {
      setError("Failed to connect to AI service.");
    } finally {
      setLoading(false);
    }
  }, [question, slug, locale, loading]);

  return (
    <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-(--accent) text-black text-xs font-bold">A</span>
        <h3 className="text-sm font-mono font-medium uppercase tracking-wider text-(--accent)">
          Ask Claude
        </h3>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void handleAsk(); }}
          placeholder="Ask a question about this article..."
          className="flex-1 rounded-md border border-(--border) bg-(--bg-base) px-3 py-2 text-sm text-(--text-1) placeholder:text-(--text-3) focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent)/20"
          disabled={loading}
        />
        <button
          onClick={() => void handleAsk()}
          disabled={loading || !question.trim()}
          className="flex items-center gap-1.5 rounded-md bg-(--accent) px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-(--accent-hover) disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}

      {(answer || loading) && (
        <div
          ref={answerRef}
          className="mt-4 rounded-md bg-(--bg-elevated) p-4 text-sm text-(--text-1) leading-relaxed whitespace-pre-wrap"
        >
          {answer}
          {loading && (
            <span className="inline-block animate-pulse text-(--accent)">▊</span>
          )}
        </div>
      )}
    </div>
  );
}
