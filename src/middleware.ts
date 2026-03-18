import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const handleI18nRouting = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Skip i18n routing for auth callback — it must stay at /auth/callback (no locale prefix)
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/auth/")) {
    const { NextResponse } = await import("next/server");
    const response = NextResponse.next();

    // Still refresh Supabase session on auth routes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      });
      await supabase.auth.getUser();
    }
    return response;
  }

  // Run next-intl middleware for all other routes
  const response = handleI18nRouting(request);

  // Skip Supabase session refresh if env vars are not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return response;

  // Layer Supabase session refresh on top — mutates cookies on the response
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
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
