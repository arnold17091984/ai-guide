interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: { outer: "h-8 w-8", track: "h-8 w-8", ring: "h-8 w-8", gap: "gap-2", text: "text-xs" },
  md: { outer: "h-12 w-12", track: "h-12 w-12", ring: "h-12 w-12", gap: "gap-3", text: "text-sm" },
  lg: { outer: "h-20 w-20", track: "h-20 w-20", ring: "h-20 w-20", gap: "gap-4", text: "text-base" },
} as const;

/**
 * LoadingSpinner — terminal-native spinner with accent color.
 *
 * Server Component — no client JS needed.
 * Use inside <Suspense> fallbacks or full-page loading states.
 */
export default function LoadingSpinner({
  size = "md",
  label,
  className = "",
}: LoadingSpinnerProps) {
  const s = SIZE_MAP[size];

  return (
    <div
      role="status"
      aria-label={label ?? "Loading"}
      className={`inline-flex flex-col items-center justify-center ${s.gap} ${className}`}
    >
      <div className={`relative ${s.outer}`}>
        {/* Track ring */}
        <svg
          className={`absolute inset-0 ${s.track} -rotate-90`}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            className="text-white/10"
          />
        </svg>

        {/* Animated spinner arc */}
        <svg
          className={`absolute inset-0 ${s.ring} -rotate-90 animate-spin`}
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          style={{ animationDuration: "0.9s" }}
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="var(--accent)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="31.4 94.2"
          />
        </svg>
      </div>

      {label && (
        <span className={`${s.text} font-mono text-(--text-3)`}>
          {label}
        </span>
      )}
    </div>
  );
}
