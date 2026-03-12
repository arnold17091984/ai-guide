import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18nRouting = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Run next-intl middleware first to get the locale-aware response
  const response = handleI18nRouting(request);

  // Layer Supabase session refresh on top — mutates cookies on the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies onto both the request (for downstream Server
          // Components) and the response (so the browser receives them).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Calling getUser() refreshes the session if a refresh token is present.
  // We intentionally ignore the returned user — this middleware never blocks.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // next-intl locale routing: root + locale-prefixed paths
    "/",
    "/(ko|en|ja)/:path*",
    // Also run on auth callback so session cookies get written
    "/auth/callback",
  ],
};
