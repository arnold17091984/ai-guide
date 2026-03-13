"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Custom error boundary for the [locale] segment.
 * Must be a Client Component ("use client") — Next.js requirement.
 */
export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations("common");

  useEffect(() => {
    // Log to error tracking (e.g. Sentry) when available
    console.error("[Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="flex max-w-lg flex-col items-center gap-8 rounded-3xl border border-white/20 bg-white/70 px-8 py-12 text-center shadow-2xl shadow-red-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        {/* Inline SVG illustration */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="opacity-80"
        >
          <circle cx="60" cy="60" r="56" fill="url(#err-bg)" />

          {/* Warning triangle */}
          <path
            d="M60 28 L92 82 H28 Z"
            stroke="url(#err-stroke)"
            strokeWidth="5"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Exclamation body */}
          <rect x="57" y="50" width="6" height="18" rx="3" fill="url(#err-stroke)" />
          {/* Exclamation dot */}
          <circle cx="60" cy="75" r="3.5" fill="url(#err-stroke)" />

          <defs>
            <radialGradient id="err-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef2f2" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#fecaca" stopOpacity="0.2" />
            </radialGradient>
            <linearGradient id="err-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>

        {/* Error badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-red-200/60 bg-red-50/80 px-4 py-1.5 dark:border-red-500/30 dark:bg-red-500/10">
          <span className="text-sm font-semibold text-red-600 dark:text-red-400">
            {error.digest ? `Error · ${error.digest}` : "Error"}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-(--text-1)">
            {t("errorTitle")}
          </h1>
          <p className="text-sm leading-relaxed text-(--text-2)">
            {t("errorMessage")}
          </p>
        </div>

        <button
          onClick={reset}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          {/* Refresh icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M13.65 2.35A8 8 0 1 0 14 8h-1.5a6.5 6.5 0 1 1-.97-3.41L10 6h4V2l-1.47 1.47-.88-1.12Z"
              fill="currentColor"
            />
          </svg>
          {t("tryAgain")}
        </button>
      </div>
    </div>
  );
}
