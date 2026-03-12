import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ============================================================
// Supabase server-side client (RSC / Server Actions / Route Handlers)
// ============================================================
// This client has access to the user's session via cookies.
// It is subject to Row Level Security policies.
//
// For privileged operations (seeding, admin tasks) that need to
// bypass RLS, use createAdminClient() with the service role key.

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component — safe to ignore.
            // Middleware handles session refresh in that case.
          }
        },
      },
    },
  );
}

// Service role client — bypasses RLS.
// ONLY use in server-side code that never touches the client bundle.
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    },
  );
}
