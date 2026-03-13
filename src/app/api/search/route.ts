import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/lib/search/actions";
import type { SearchResultType } from "@/lib/search/actions";

// ============================================================
// GET /api/search — Global search API
// ============================================================
// Query params:
//   q      — search query string (required, min 1 char)
//   type   — filter by content type: 'knowledge' | 'skill' | 'user'
//   locale — response locale: 'ko' | 'en' | 'ja' (default: 'ko')
//   limit  — max results per type, 1–20 (default: 5)
//
// Used by the SearchBar component for quick suggestions.

export const runtime = "nodejs";

const VALID_TYPES = new Set<SearchResultType>(["knowledge", "skill", "user"]);
const VALID_LOCALES = new Set(["ko", "en", "ja"]);
const MAX_LIMIT = 20;
const DEFAULT_LIMIT = 5;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const q = searchParams.get("q")?.trim() ?? "";
  const typeParam = searchParams.get("type") ?? "";
  const localeParam = searchParams.get("locale") ?? "ko";
  const limitParam = searchParams.get("limit") ?? String(DEFAULT_LIMIT);

  // Validate query
  if (!q) {
    return NextResponse.json(
      { entries: [], skills: [], users: [], totalCount: 0 },
    );
  }

  // Validate type
  const type = VALID_TYPES.has(typeParam as SearchResultType)
    ? (typeParam as SearchResultType)
    : undefined;

  // Validate locale
  const locale = VALID_LOCALES.has(localeParam)
    ? (localeParam as "ko" | "en" | "ja")
    : "ko";

  // Validate limit
  const limitParsed = parseInt(limitParam, 10);
  const limit = Number.isNaN(limitParsed)
    ? DEFAULT_LIMIT
    : Math.min(Math.max(1, limitParsed), MAX_LIMIT);

  try {
    const results = await globalSearch(q, { type, locale, limit });

    return NextResponse.json(results, {
      headers: {
        // Short cache — suggestions should feel fresh but not hammer DB
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
