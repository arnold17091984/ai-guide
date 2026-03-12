interface CompareBoxProps {
  good: string;
  bad: string;
  goodLabel?: string;
  badLabel?: string;
}

export default function CompareBox({
  good,
  bad,
  goodLabel = "Good",
  badLabel = "Bad",
}: CompareBoxProps) {
  return (
    <div className="my-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-red-200/50 bg-linear-to-br from-red-50 to-rose-50 p-4 shadow-sm transition-transform hover:-translate-y-0.5 dark:border-red-800/50 dark:from-red-900/20 dark:to-rose-900/20">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {badLabel}
        </div>
        <p className="text-sm text-(--text-2)">{bad}</p>
      </div>
      <div className="rounded-xl border border-emerald-200/50 bg-linear-to-br from-emerald-50 to-teal-50 p-4 shadow-sm transition-transform hover:-translate-y-0.5 dark:border-emerald-800/50 dark:from-emerald-900/20 dark:to-teal-900/20">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {goodLabel}
        </div>
        <p className="text-sm text-(--text-2)">{good}</p>
      </div>
    </div>
  );
}
