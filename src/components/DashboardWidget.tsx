import Link from "next/link";

interface DashboardWidgetProps {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export default function DashboardWidget({
  title,
  viewAllHref,
  viewAllLabel,
  children,
  className = "",
  loading = false,
}: DashboardWidgetProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-6 shadow-md backdrop-blur-xl dark:bg-white/5 ${className}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-(--text-1)">{title}</h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-sm font-medium text-(--primary) transition-colors hover:opacity-80"
          >
            {viewAllLabel ?? "View all"}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        )}
      </div>

      {/* Content or skeleton */}
      {loading ? <DashboardWidgetSkeleton /> : children}
    </div>
  );
}

function DashboardWidgetSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-(--border)" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-(--border)" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-(--border)" />
          </div>
        </div>
      ))}
    </div>
  );
}
