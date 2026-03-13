import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

const VALID_LOCALES = ["ko", "en", "ja"] as const;
type Locale = (typeof VALID_LOCALES)[number];

function getLocaleFromRequest(request: NextRequest): Locale {
  // 1. Try the locale stored in cookie by next-intl
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && VALID_LOCALES.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // 2. Try Accept-Language header
  const acceptLang = request.headers.get("accept-language") ?? "";
  for (const locale of VALID_LOCALES) {
    if (acceptLang.startsWith(locale)) return locale;
  }

  return "ko";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const locale = getLocaleFromRequest(request);
  const homeUrl = `${origin}/${locale}`;

  if (!code) {
    return NextResponse.redirect(
      `${homeUrl}?error=missing_code`,
    );
  }

  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(`${homeUrl}?error=supabase_not_configured`);
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(
        `${homeUrl}?error=${encodeURIComponent(error.message)}`,
      );
    }

    return NextResponse.redirect(homeUrl);
  } catch (err) {
    console.error("[auth/callback] unexpected error:", err);
    return NextResponse.redirect(`${homeUrl}?error=unexpected`);
  }
}
