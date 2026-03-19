"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";

interface Recommendation {
  title: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

interface RecommendationsData {
  summary: string;
  recommendations: Recommendation[];
}

const PRIORITY_COLORS = {
  high: "text-(--accent) border-(--accent)/30 bg-(--accent-muted)",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  low: "text-(--text-2) border-(--border) bg-(--bg-elevated)",
};

export default function AiLearningRecommendations() {
  const locale = useLocale();
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  const fetchRecommendations = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/ai/learning-recommendations?locale=${locale}`);
      if (!res.ok) {
        setError("AI recommendations not available. Configure ANTHROPIC_API_KEY.");
        return;
      }
      const json = await res.json() as RecommendationsData;
      setData(json);
      setFetched(true);
    } catch {
      setError("Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-(--accent)/20 bg-(--bg-surface) p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-(--accent) text-black text-xs font-bold">A</span>
          <h3 className="text-sm font-mono font-medium uppercase tracking-wider text-(--accent)">
            AI Learning Path
          </h3>
        </div>
        {!fetched && (
          <button
            onClick={() => void fetchRecommendations()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md bg-(--accent) px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-(--accent-hover) disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
                Get AI Recommendations
              </>
            )}
          </button>
        )}
        {fetched && (
          <button
            onClick={() => { setFetched(false); setData(null); void fetchRecommendations(); }}
            className="text-xs text-(--text-3) hover:text-(--accent) transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {!fetched && !loading && !error && (
        <p className="text-sm text-(--text-2)">
          Get personalized learning recommendations from Claude based on your skill profile.
        </p>
      )}

      {data && (
        <div className="space-y-3">
          {data.summary && (
            <p className="text-sm text-(--text-2) leading-relaxed">{data.summary}</p>
          )}
          <div className="space-y-2">
            {data.recommendations.map((rec, i) => (
              <div
                key={i}
                className={`rounded-md border px-3 py-2.5 ${PRIORITY_COLORS[rec.priority as keyof typeof PRIORITY_COLORS] ?? PRIORITY_COLORS.low}`}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-xs font-mono">{i + 1}.</span>
                  <div>
                    <p className="text-sm font-medium">{rec.title}</p>
                    <p className="mt-0.5 text-xs opacity-80">{rec.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
