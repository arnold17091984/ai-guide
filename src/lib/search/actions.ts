"use server";

import { searchEntries } from "@/lib/db/queries/knowledge";
import { listSkills } from "@/lib/db/queries/skills";
import { searchUsers } from "@/lib/db/queries/users";

export type SearchResultType = "knowledge" | "skill" | "user";

export interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  type: SearchResultType;
  url: string;
  meta?: string;
}

export interface GlobalSearchResult {
  entries: SearchResultItem[];
  skills: SearchResultItem[];
  users: SearchResultItem[];
  totalCount: number;
}

function truncate(text: string | null | undefined, maxLen = 120): string {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "...";
}

export async function globalSearch(
  query: string,
  options: {
    type?: SearchResultType;
    locale?: "ko" | "en" | "ja";
    limit?: number;
  } = {},
): Promise<GlobalSearchResult> {
  const { type, locale = "ko", limit = 5 } = options;
  const trimmed = query.trim();

  if (!trimmed) {
    return { entries: [], skills: [], users: [], totalCount: 0 };
  }

  const result: GlobalSearchResult = {
    entries: [],
    skills: [],
    users: [],
    totalCount: 0,
  };

  const promises: Promise<void>[] = [];

  // Search knowledge entries
  if (!type || type === "knowledge") {
    promises.push(
      searchEntries({ query: trimmed, locale, pageSize: limit })
        .then((rows) => {
          result.entries = (rows as Array<Record<string, unknown>>).map((r) => ({
            id: String(r.id),
            title: String(r.title ?? ""),
            description: truncate(String(r.summary ?? r.excerpt ?? "")),
            type: "knowledge" as const,
            url: `/${locale}/knowledge/${String(r.slug)}`,
            meta: r.difficulty_level ? String(r.difficulty_level) : undefined,
          }));
        })
        .catch(() => {
          result.entries = [];
        }),
    );
  }

  // Search skills
  if (!type || type === "skill") {
    promises.push(
      listSkills({ search: trimmed, pageSize: limit })
        .then(({ items }) => {
          result.skills = items.map((s) => ({
            id: s.id,
            title: s.name,
            description: truncate(s.description),
            type: "skill" as const,
            url: `/${locale}/skills/${s.slug}`,
            meta: s.stars > 0 ? `${s.stars} stars` : undefined,
          }));
        })
        .catch(() => {
          result.skills = [];
        }),
    );
  }

  // Search users
  if (!type || type === "user") {
    promises.push(
      searchUsers(trimmed, limit)
        .then((rows) => {
          result.users = rows.map((u) => ({
            id: u.id,
            title: u.displayName ?? u.username,
            description: `@${u.username}`,
            type: "user" as const,
            url: `/${locale}/community/users/${u.username}`,
            meta: u.role !== "user" ? u.role : undefined,
          }));
        })
        .catch(() => {
          result.users = [];
        }),
    );
  }

  await Promise.all(promises);

  result.totalCount =
    result.entries.length + result.skills.length + result.users.length;

  return result;
}
