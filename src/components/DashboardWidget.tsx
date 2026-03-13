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
      className={`overflow-hidden rounded-lg border border-(--border) bg-(--bg-surface) p-6 ${className}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-mono font-medium uppercase tracking-wider text-(--text-3)">{title}</h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-xs font-medium text-(--accent) transition-colors hover:text-(--accent-hover)"
          >
            {viewAllLabel ?? "View all"}
            <svg
              className="h-3.5 w-3.5"
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
          <div className="h-10 w-10 animate-pulse rounded-md bg-(--bg-elevated)" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded-md bg-(--bg-elevated)" />
            <div className="h-3 w-1/2 animate-pulse rounded-md bg-(--bg-elevated)" />
          </div>
        </div>
      ))}
    </div>
  );
}
