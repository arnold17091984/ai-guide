import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "ai-guide-visited";

const ALL_PAGES = [
  "/setup/vscode",
  "/setup/claude-web",
  "/setup/claude-code",
  "/setup/workflow",
  "/setup/best-practices",
  "/setup/common-workflows",
  "/setup/memory",
  "/setup/costs",
  "/setup/security",
  "/setup/agent-teams",
  "/setup/pixel-agents",
];

export function useProgressLine() {
  const pathname = usePathname();
  const [visited, setVisited] = useState<string[]>([]);

  // Load visited pages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setVisited(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
  }, []);

  // Track current page visit
  useEffect(() => {
    const pathWithoutLocale = "/" + pathname.split("/").slice(2).join("/");
    if (ALL_PAGES.includes(pathWithoutLocale)) {
      setVisited((prev) => {
        if (prev.includes(pathWithoutLocale)) return prev;
        const updated = [...prev, pathWithoutLocale];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [pathname]);

  const isVisited = (href: string) => visited.includes(href);
  const progress = ALL_PAGES.length > 0 ? (visited.length / ALL_PAGES.length) * 100 : 0;

  return { isVisited, progress, visited };
}
