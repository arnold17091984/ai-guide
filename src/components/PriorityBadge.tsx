interface PriorityBadgeProps {
  priority: string;
  label: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400",
  high: "bg-orange-500/10 text-orange-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-zinc-500/10 text-zinc-400",
};

export default function PriorityBadge({ priority, label }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-mono ${PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium}`}
    >
      {priority === "critical" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
      )}
      {priority === "high" && (
        <span className="inline-flex h-2 w-2 rounded-full bg-orange-500" />
      )}
      {priority === "medium" && (
        <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
      )}
      {priority === "low" && (
        <span className="inline-flex h-2 w-2 rounded-full bg-zinc-500" />
      )}
      {label}
    </span>
  );
}
