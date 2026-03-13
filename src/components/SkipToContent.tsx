/**
 * SkipToContent — accessibility skip link.
 *
 * Visually hidden until focused via keyboard navigation.
 * Renders as a Server Component — no client JS needed.
 */
export default function SkipToContent() {
  return (
    <a
      href="#main-content"
      className={[
        // Visually hidden by default
        "sr-only",
        // Reveal on focus (keyboard navigation)
        "focus:not-sr-only",
        "focus:fixed focus:left-4 focus:top-4 focus:z-[9999]",
        "focus:inline-flex focus:items-center focus:gap-2",
        "focus:rounded-xl focus:border focus:border-blue-400/50",
        "focus:bg-white/90 focus:px-4 focus:py-2 focus:text-sm focus:font-medium",
        "focus:text-blue-700 focus:shadow-lg focus:shadow-blue-500/20",
        "focus:backdrop-blur-xl focus:outline-none",
        "dark:focus:border-cyan-500/50 dark:focus:bg-slate-900/90 dark:focus:text-cyan-400",
      ].join(" ")}
    >
      Skip to main content
    </a>
  );
}
