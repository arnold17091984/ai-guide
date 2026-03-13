interface TipBoxProps {
  variant: "tip" | "warning" | "info";
  children: React.ReactNode;
}

const styles = {
  tip: {
    border: "border-l-2 border-l-(--accent) border-(--border)",
    bg: "bg-(--accent-muted)",
    icon: "text-(--accent)",
    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  warning: {
    border: "border-l-2 border-l-amber-400 border-(--border)",
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
    iconPath:
      "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
  info: {
    border: "border-l-2 border-l-blue-400 border-(--border)",
    bg: "bg-blue-500/10",
    icon: "text-blue-400",
    iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
};

export default function TipBox({ variant, children }: TipBoxProps) {
  const s = styles[variant];
  return (
    <div className={`my-4 flex gap-3 rounded-lg border p-4 ${s.border} ${s.bg}`}>
      <svg
        className={`h-5 w-5 shrink-0 ${s.icon}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={s.iconPath}
        />
      </svg>
      <div className="text-sm leading-relaxed text-(--text-1)">
        {children}
      </div>
    </div>
  );
}
