"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const VALID_LOCALES = ["ko", "en", "ja"] as const;
type Locale = (typeof VALID_LOCALES)[number];

async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("NEXT_LOCALE")?.value;
  if (value && VALID_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return "ko";
}

/**
 * Initiates GitHub OAuth sign-in flow.
 * Redirects the browser to GitHub via Supabase's OAuth redirect URL.
 */
export async function signInWithGitHub(): Promise<void> {
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${appUrl}/auth/callback`,
      // Request email scope so we always have a display email
      scopes: "read:user user:email",
    },
  });

  if (error || !data.url) {
    const locale = await getLocale();
    redirect(`/${locale}?error=${encodeURIComponent(error?.message ?? "oauth_failed")}`);
  }

  redirect(data.url);
}

/**
 * Signs the current user out and redirects to the locale home page.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const locale = await getLocale();
  redirect(`/${locale}`);
}
