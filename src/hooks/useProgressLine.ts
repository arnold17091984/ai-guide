import { useCallback, useEffect, useSyncExternalStore } from "react";
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

const EMPTY: string[] = [];
let listeners: Array<() => void> = [];
let cachedSnapshot: string[] = EMPTY;

function readStorage(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): string[] {
  return cachedSnapshot;
}

function getServerSnapshot(): string[] {
  return EMPTY;
}

function subscribe(listener: () => void) {
  if (listeners.length === 0) {
    cachedSnapshot = readStorage();
  }
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function addVisited(page: string) {
  const current = cachedSnapshot;
  if (current.includes(page)) return;
  const updated = [...current, page];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  cachedSnapshot = updated;
  listeners.forEach((l) => l());
}

export function useProgressLine() {
  const pathname = usePathname();
  const visited = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Track current page visit — must be in useEffect to avoid setState during render
  const pathWithoutLocale = "/" + pathname.split("/").slice(2).join("/");
  useEffect(() => {
    if (ALL_PAGES.includes(pathWithoutLocale)) {
      addVisited(pathWithoutLocale);
    }
  }, [pathWithoutLocale]);

  const isVisited = useCallback((href: string) => visited.includes(href), [visited]);
  const progress = ALL_PAGES.length > 0 ? (visited.length / ALL_PAGES.length) * 100 : 0;

  return { isVisited, progress, visited };
}
