"use client";

const SOURCE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  github: {
    label: "GitHub",
    bg: "bg-gray-800 dark:bg-gray-700",
    text: "text-white",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    ),
  },
  hackernews: {
    label: "Hacker News",
    bg: "bg-orange-500",
    text: "text-white",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M0 0h16v16H0V0zm8.7 7.6L12 2h-1.6L8 6.3 5.6 2H4l3.3 5.6V13h1.4V7.6z" />
      </svg>
    ),
  },
  reddit: {
    label: "Reddit",
    bg: "bg-orange-600",
    text: "text-white",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-3.828-1.165a1.09 1.09 0 00-1.09-1.09 1.075 1.075 0 00-.752.308 5.3 5.3 0 00-2.898-.876l.567-2.678 1.848.393a.775.775 0 10.123-.59L7.87 1.88a.308.308 0 00-.37.232l-.63 2.986a5.34 5.34 0 00-2.955.876 1.075 1.075 0 00-.752-.308 1.09 1.09 0 00-.472 2.075c-.013.098-.02.197-.02.297 0 2.105 2.453 3.812 5.482 3.812s5.482-1.707 5.482-3.812c0-.1-.007-.199-.02-.297a1.088 1.088 0 00.617-1.006zM5.33 9.124a.775.775 0 111.55 0 .775.775 0 01-1.55 0zm4.468 2.068c-.547.547-1.586.59-1.798.59-.212 0-1.251-.043-1.798-.59a.26.26 0 01.37-.368c.344.344 1.08.465 1.428.465.348 0 1.084-.121 1.428-.465a.26.26 0 01.37.368zm-.087-1.293a.775.775 0 110-1.55.775.775 0 010 1.55z" />
      </svg>
    ),
  },
  twitter: {
    label: "X",
    bg: "bg-sky-500",
    text: "text-white",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M9.333 6.929L14.546 1h-1.235L8.783 6.147 5.17 1H1l5.466 7.783L1 15h1.235l4.779-5.436L10.83 15H15L9.333 6.929zM7.64 8.852l-.554-.776L2.68 1.911h1.898l3.557 4.979.554.776 4.623 6.47h-1.898L7.64 8.852z" />
      </svg>
    ),
  },
  producthunt: {
    label: "Product Hunt",
    bg: "bg-red-500",
    text: "text-white",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1.2 8.4H7.2V5.6h2c.883 0 1.6.717 1.6 1.4s-.717 1.4-1.6 1.4zM9.2 4H5.6v8h1.6V10h2a3 3 0 003-3 3 3 0 00-3-3z" />
      </svg>
    ),
  },
};

interface SourceBadgeProps {
  source: string;
  className?: string;
}

export default function SourceBadge({ source, className = "" }: SourceBadgeProps) {
  const config = SOURCE_CONFIG[source] ?? {
    label: source,
    bg: "bg-gray-500",
    text: "text-white",
    icon: null,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text} ${className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
