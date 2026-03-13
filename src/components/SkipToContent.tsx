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
        "focus:fixed focus:left-4 focus:top-4 focus:z-9999",
        "focus:inline-flex focus:items-center focus:gap-2",
        "focus:rounded-md focus:border focus:border-(--accent)/50",
        "focus:bg-(--bg-surface) focus:px-4 focus:py-2 focus:text-sm focus:font-medium",
        "focus:text-(--accent) focus:shadow-lg",
        "focus:outline-none focus:ring-1 focus:ring-(--accent)/20",
      ].join(" ")}
    >
      Skip to main content
    </a>
  );
}
