import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/lib/search/actions";
import type { SearchResultType } from "@/lib/search/actions";
import { rateLimit } from "@/lib/rate-limit";

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
  // --- Rate limiting: 30 req/min per IP ---
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const { allowed, remaining } = rateLimit(`search:${ip}`, 30);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" },
      },
    );
  }

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
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch {
    // DB unavailable — return empty results rather than a 500 so the UI
    // degrades gracefully (search bar shows no suggestions instead of an error).
    return NextResponse.json(
      { entries: [], skills: [], users: [], totalCount: 0 },
    );
  }
}
