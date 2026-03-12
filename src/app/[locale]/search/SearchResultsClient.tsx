"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";
import SearchResult from "@/components/SearchResult";
import {
  globalSearch,
  type GlobalSearchResult,
  type SearchResultType,
} from "@/lib/search/actions";

const FILTER_TYPES = ["all", "knowledge", "skill", "user"] as const;
type FilterType = (typeof FILTER_TYPES)[number];

interface SearchResultsClientProps {
  initialQuery: string;
  initialType: string;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/20 bg-white/40 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-black/10 dark:bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-black/10 dark:bg-white/10" />
          <div className="h-3 w-full rounded bg-black/5 dark:bg-white/5" />
          <div className="h-3 w-1/4 rounded bg-black/5 dark:bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export default function SearchResultsClient({
  initialQuery,
  initialType,
}: SearchResultsClientProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();

  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    FILTER_TYPES.includes(initialType as FilterType)
      ? (initialType as FilterType)
      : "all",
  );
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const performSearch = useCallback(
    async (q: string, filter: FilterType) => {
      if (!q.trim()) {
        setResults(null);
        return;
      }
      setIsLoading(true);
      try {
        const typeFilter: SearchResultType | undefined =
          filter === "all" ? undefined : (filter as SearchResultType);
        const limit = filter === "all" ? 5 : 20;
        const data = await globalSearch(q, {
          type: typeFilter,
          locale: locale as "ko" | "en" | "ja",
          limit,
        });
        setResults(data);
      } catch {
        setResults({ entries: [], skills: [], users: [], totalCount: 0 });
      } finally {
        setIsLoading(false);
      }
    },
    [locale],
  );

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(query, activeFilter);
      // Update URL params
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (activeFilter !== "all") params.set("type", activeFilter);
      const search = params.toString();
      router.replace(`/${locale}/search${search ? `?${search}` : ""}`, {
        scroll: false,
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, activeFilter, locale, router, performSearch]);

  function handleFilterChange(filter: FilterType) {
    setActiveFilter(filter);
  }

  const filterLabelMap: Record<FilterType, string> = {
    all: t("filters.all"),
    knowledge: t("filters.knowledge"),
    skill: t("filters.skills"),
    user: t("filters.users"),
  };

  const hasResults = results && results.totalCount > 0;
  const searched = query.trim().length > 0;

  return (
    <div>
      {/* Search input */}
      <div className="mb-8">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-(--text-2)"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            className="h-12 w-full rounded-2xl border border-white/20 bg-white/50 pl-12 pr-4 text-base text-(--text-1) placeholder:text-(--text-2) shadow-sm outline-none backdrop-blur-md transition-colors focus:border-blue-400 focus:shadow-blue-500/10 dark:border-white/10 dark:bg-white/5"
            autoFocus
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {FILTER_TYPES.map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterChange(filter)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeFilter === filter
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                : "bg-white/40 text-(--text-2) hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10"
            }`}
          >
            {filterLabelMap[filter]}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading && (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!isLoading && searched && !hasResults && (
        <div className="py-16 text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-(--text-2)"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <p className="text-lg font-medium text-(--text-1)">
            {t("noResults")}
          </p>
          <p className="mt-1 text-sm text-(--text-2)">
            &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {!isLoading && hasResults && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${query}-${activeFilter}`}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Knowledge entries */}
            {results.entries.length > 0 && (
              <motion.section variants={fadeUp}>
                {activeFilter === "all" && (
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-(--text-2)">
                    {t("filters.knowledge")}
                  </h2>
                )}
                <div className="space-y-3">
                  {results.entries.map((item) => (
                    <SearchResult key={item.id} {...item} query={query} />
                  ))}
                </div>
                {activeFilter === "all" && results.entries.length >= 5 && (
                  <button
                    onClick={() => handleFilterChange("knowledge")}
                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {t("viewAllResults")} →
                  </button>
                )}
              </motion.section>
            )}

            {/* Skills */}
            {results.skills.length > 0 && (
              <motion.section variants={fadeUp}>
                {activeFilter === "all" && (
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-(--text-2)">
                    {t("filters.skills")}
                  </h2>
                )}
                <div className="space-y-3">
                  {results.skills.map((item) => (
                    <SearchResult key={item.id} {...item} query={query} />
                  ))}
                </div>
                {activeFilter === "all" && results.skills.length >= 5 && (
                  <button
                    onClick={() => handleFilterChange("skill")}
                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {t("viewAllResults")} →
                  </button>
                )}
              </motion.section>
            )}

            {/* Users */}
            {results.users.length > 0 && (
              <motion.section variants={fadeUp}>
                {activeFilter === "all" && (
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-(--text-2)">
                    {t("filters.users")}
                  </h2>
                )}
                <div className="space-y-3">
                  {results.users.map((item) => (
                    <SearchResult key={item.id} {...item} query={query} />
                  ))}
                </div>
                {activeFilter === "all" && results.users.length >= 5 && (
                  <button
                    onClick={() => handleFilterChange("user")}
                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {t("viewAllResults")} →
                  </button>
                )}
              </motion.section>
            )}

            {/* Result count */}
            <p className="text-center text-xs text-(--text-2)">
              {t("resultCount", { count: results.totalCount })}
            </p>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
