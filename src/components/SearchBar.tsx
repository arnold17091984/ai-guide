"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import { globalSearch, type SearchResultItem } from "@/lib/search/actions";

function SuggestionIcon({ type }: { type: string }) {
  if (type === "knowledge") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    );
  }
  if (type === "skill") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875S10.5 3.09 10.5 4.125c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.546 3.16 1.057 4.628.518 1.481.656 3.088.439 4.618a24.962 24.962 0 01-.259 1.677l-.416 2.213a.64.64 0 00.382.735c1.798.763 3.736 1.195 5.767 1.195s3.97-.432 5.767-1.195a.64.64 0 00.382-.735l-.416-2.213a24.962 24.962 0 01-.26-1.677c-.216-1.53-.078-3.137.44-4.618a26.428 26.428 0 001.057-4.628 48.394 48.394 0 01-4.163.3.64.64 0 01-.657-.643v0z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

export default function SearchBar() {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Cmd/Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
    setShowSuggestions(false);
    setQuery("");
  }, [pathname]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        if (!query) setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query]);

  const fetchSuggestions = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const result = await globalSearch(value, { locale: locale as "ko" | "en" | "ja", limit: 5 });
          const all = [...result.entries, ...result.skills, ...result.users].slice(0, 5);
          setSuggestions(all);
          setShowSuggestions(all.length > 0);
          setActiveIndex(-1);
        } catch {
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 200);
    },
    [locale],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    fetchSuggestions(value);
  }

  function navigateToSearch() {
    if (query.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
      setIsOpen(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setShowSuggestions(false);
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        router.push(suggestions[activeIndex].url);
        setShowSuggestions(false);
        setIsOpen(false);
      } else {
        navigateToSearch();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      return;
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop: expandable input */}
      <div className="hidden items-center md:flex">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
              className="overflow-hidden"
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                placeholder={t("placeholder")}
                role="combobox"
                aria-expanded={showSuggestions}
                aria-controls="search-listbox"
                aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
                className="h-8 w-full rounded-md border border-(--border) bg-(--bg-surface) px-3 text-sm text-(--text-1) placeholder:text-(--text-3) outline-none transition-colors focus:border-(--accent) focus:ring-1 focus:ring-(--accent)/20"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => {
            if (isOpen) {
              navigateToSearch();
            } else {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }}
          className="flex items-center gap-1.5 rounded-md p-2 text-(--text-2) transition-colors hover:bg-(--bg-elevated) hover:text-(--text-1)"
          aria-label={t("title")}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          {!isOpen && (
            <kbd className="hidden rounded border border-(--border) bg-(--bg-elevated) px-1.5 py-0.5 text-[10px] font-mono font-medium text-(--text-3) lg:inline-block">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Mobile: icon toggle */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="rounded-md p-2 text-(--text-2) hover:bg-(--bg-elevated) md:hidden"
        aria-label={t("title")}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </button>

      {/* Mobile expanded input overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
            className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] md:hidden"
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              placeholder={t("placeholder")}
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls="search-listbox"
              aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
              className="h-10 w-full rounded-md border border-(--border) bg-(--bg-surface) px-4 text-sm text-(--text-1) placeholder:text-(--text-3) shadow-lg outline-none transition-colors focus:border-(--accent) focus:ring-1 focus:ring-(--accent)/20"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: DURATION.fast, ease: EASE_APPLE }}
            id="search-listbox"
            role="listbox"
            aria-live="polite"
            className="absolute right-0 top-full z-50 mt-2 w-80 max-h-80 overflow-y-auto rounded-lg border border-(--border) bg-(--bg-surface) p-2 shadow-lg"
          >
            {suggestions.map((item, idx) => (
              <button
                key={`${item.type}-${item.id}`}
                id={`suggestion-${idx}`}
                role="option"
                aria-selected={idx === activeIndex}
                onClick={() => {
                  router.push(item.url);
                  setShowSuggestions(false);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                  idx === activeIndex
                    ? "bg-(--accent-muted)"
                    : "hover:bg-(--bg-elevated)"
                }`}
              >
                <span className="mt-0.5 text-(--text-2)">
                  <SuggestionIcon type={item.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-(--text-1)">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-(--text-2)">
                    {item.description}
                  </p>
                </div>
              </button>
            ))}
            <button
              onClick={navigateToSearch}
              className="mt-1 flex w-full items-center justify-center rounded-md px-3 py-2 text-xs font-medium text-(--accent) transition-colors hover:bg-(--accent-muted)"
            >
              {t("viewAllResults")}
              <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            {isLoading && (
              <div className="flex justify-center py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-(--accent) border-t-transparent" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
