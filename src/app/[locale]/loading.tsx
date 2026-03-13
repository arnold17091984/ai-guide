import LoadingSpinner from "@/components/LoadingSpinner";

/**
 * Global loading state for the [locale] segment.
 * Rendered automatically by Next.js during page transitions and
 * while server component data is being fetched.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      {/* Glassmorphism card */}
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-white/20 bg-white/70 px-12 py-10 shadow-xl shadow-blue-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <LoadingSpinner size="lg" />

        {/* Skeleton lines */}
        <div className="flex w-full max-w-xs flex-col gap-3">
          <div className="h-3 w-full animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-3 w-3/5 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}
