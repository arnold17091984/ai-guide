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
      <div className="flex max-w-lg flex-col items-center gap-8 rounded-lg border border-(--border) bg-(--bg-surface) px-8 py-12 text-center">
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
          <circle cx="60" cy="60" r="56" fill="rgba(16,185,129,0.08)" />

          {/* Magnifying glass body */}
          <circle
            cx="52"
            cy="50"
            r="22"
            stroke="#10B981"
            strokeWidth="5"
            fill="none"
          />
          {/* Magnifying glass handle */}
          <line
            x1="68"
            y1="66"
            x2="84"
            y2="82"
            stroke="#10B981"
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
            fill="#10B981"
            fontFamily="system-ui, sans-serif"
          >
            ?
          </text>
        </svg>

        {/* 404 badge */}
        <div className="inline-flex items-center gap-2 rounded border border-(--border) bg-(--bg-elevated) px-4 py-1.5">
          <span className="font-mono text-2xl font-black tracking-tight text-(--text-1)">
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
          className="inline-flex items-center gap-2 rounded-md bg-(--accent) px-6 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-(--accent-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)/50"
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
