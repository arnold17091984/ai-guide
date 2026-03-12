"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { SearchResultType } from "@/lib/search/actions";

interface SearchResultProps {
  id: string;
  title: string;
  description: string;
  type: SearchResultType;
  url: string;
  meta?: string;
  query?: string;
}

function TypeIcon({ type }: { type: SearchResultType }) {
  if (type === "knowledge") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    );
  }
  if (type === "skill") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875S10.5 3.09 10.5 4.125c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.546 3.16 1.057 4.628.518 1.481.656 3.088.439 4.618a24.962 24.962 0 01-.259 1.677l-.416 2.213a.64.64 0 00.382.735c1.798.763 3.736 1.195 5.767 1.195s3.97-.432 5.767-1.195a.64.64 0 00.382-.735l-.416-2.213a24.962 24.962 0 01-.26-1.677c-.216-1.53-.078-3.137.44-4.618a26.428 26.428 0 001.057-4.628 48.394 48.394 0 01-4.163.3.64.64 0 01-.657-.643v0z" />
      </svg>
    );
  }
  // user
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200/60 text-inherit dark:bg-yellow-500/30 rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

const typeColorMap: Record<SearchResultType, string> = {
  knowledge: "from-blue-500 to-cyan-500",
  skill: "from-purple-500 to-pink-500",
  user: "from-green-500 to-emerald-500",
};

export default function SearchResult({
  title,
  description,
  type,
  url,
  meta,
  query,
}: SearchResultProps) {
  const t = useTranslations("search");

  const typeLabel =
    type === "knowledge"
      ? t("filters.knowledge")
      : type === "skill"
        ? t("filters.skills")
        : t("filters.users");

  return (
    <Link
      href={url}
      className="group block rounded-2xl border border-white/20 bg-white/40 p-4 backdrop-blur-md transition-all duration-200 hover:bg-white/60 hover:shadow-lg hover:shadow-blue-500/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
    >
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${typeColorMap[type]} text-white`}
        >
          <TypeIcon type={type} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-(--text-1) group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {highlightMatch(title, query ?? "")}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-(--text-2)">
            {highlightMatch(description, query ?? "")}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-(--text-2)">
            <span className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/10">
              {typeLabel}
            </span>
            {meta && (
              <span className="text-(--text-2)">{meta}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
