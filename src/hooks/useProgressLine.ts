import { useCallback, useSyncExternalStore } from "react";
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

let listeners: Array<() => void> = [];

function getSnapshot(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function getServerSnapshot(): string[] {
  return [];
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function addVisited(page: string) {
  const current = getSnapshot();
  if (current.includes(page)) return;
  const updated = [...current, page];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  listeners.forEach((l) => l());
}

export function useProgressLine() {
  const pathname = usePathname();
  const visited = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Track current page visit
  const pathWithoutLocale = "/" + pathname.split("/").slice(2).join("/");
  if (typeof window !== "undefined" && ALL_PAGES.includes(pathWithoutLocale)) {
    addVisited(pathWithoutLocale);
  }

  const isVisited = useCallback((href: string) => visited.includes(href), [visited]);
  const progress = ALL_PAGES.length > 0 ? (visited.length / ALL_PAGES.length) * 100 : 0;

  return { isVisited, progress, visited };
}
