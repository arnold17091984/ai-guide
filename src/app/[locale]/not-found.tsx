import { useTranslations } from "next-intl";
import Link from "next/link";

/**
 * Custom 404 page for the [locale] segment.
 * Server Component — uses next-intl's useTranslations (server-safe).
 */
export default function NotFound() {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="flex max-w-lg flex-col items-center gap-8 rounded-3xl border border-white/20 bg-white/70 px-8 py-12 text-center shadow-2xl shadow-blue-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
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
          {/* Background circle */}
          <circle cx="60" cy="60" r="56" fill="url(#not-found-bg)" />

          {/* Magnifying glass body */}
          <circle
            cx="52"
            cy="50"
            r="22"
            stroke="url(#not-found-stroke)"
            strokeWidth="5"
            fill="none"
          />
          {/* Magnifying glass handle */}
          <line
            x1="68"
            y1="66"
            x2="84"
            y2="82"
            stroke="url(#not-found-stroke)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Question mark */}
          <text
            x="52"
            y="57"
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fill="url(#not-found-stroke)"
            fontFamily="system-ui, sans-serif"
          >
            ?
          </text>

          <defs>
            <radialGradient id="not-found-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.2" />
            </radialGradient>
            <linearGradient id="not-found-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>

        {/* 404 badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-1.5 dark:border-blue-500/30 dark:bg-blue-500/10">
          <span className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
            404
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-(--text-1)">
            {t("notFoundTitle")}
          </h1>
          <p className="text-sm leading-relaxed text-(--text-2)">
            {t("notFoundMessage")}
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {/* Home icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 6.5L8 2l6 4.5V14a.5.5 0 0 1-.5.5h-4V10h-3v4.5h-4A.5.5 0 0 1 2 14V6.5Z"
              fill="currentColor"
            />
          </svg>
          {t("backToHome")}
        </Link>
      </div>
    </div>
  );
}
