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
      <div className="rounded-lg border border-(--border) border-l-2 border-l-red-500 bg-red-500/5 p-4 transition-transform hover:-translate-y-0.5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {badLabel}
        </div>
        <p className="text-sm text-(--text-2)">{bad}</p>
      </div>
      <div className="rounded-lg border border-(--border) border-l-2 border-l-(--accent) bg-(--accent-muted) p-4 transition-transform hover:-translate-y-0.5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-(--accent)">
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
