interface PriorityBadgeProps {
  priority: string;
  label: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
};

export default function PriorityBadge({ priority, label }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium}`}
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
        <span className="inline-flex h-2 w-2 rounded-full bg-yellow-500" />
      )}
      {priority === "low" && (
        <span className="inline-flex h-2 w-2 rounded-full bg-gray-400" />
      )}
      {label}
    </span>
  );
}
