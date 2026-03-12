import type { User as SupabaseUser } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { users } from '../db/schema/users';

// ============================================================
// syncUser — called after GitHub OAuth sign-in
// ============================================================
// Upserts the public.users profile row to stay in sync with
// auth.users. Uses the admin client when called from a privileged
// context (e.g. auth callback route) so RLS is bypassed.
//
// Note: this function operates on the Drizzle `db` client which
// connects via the service-role DATABASE_URL. If your setup uses
// RLS on the users table, call this only from server-side code
// that has the service-role connection string, or pass an
// adminDb instance explicitly.

type GitHubMetadata = {
  avatar_url?: string;
  full_name?: string;
  user_name?: string;  // GitHub login
  preferred_username?: string;
  name?: string;
  email?: string;
};

function deriveUsername(meta: GitHubMetadata, fallbackEmail: string): string {
  // Prefer the GitHub login handle, then fall back to email prefix
  const handle =
    meta.preferred_username ?? meta.user_name ?? null;

  if (handle) {
    return handle.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }

  return fallbackEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

function deriveLocale(acceptLanguage?: string): string {
  if (!acceptLanguage) return 'ko';

  // Parse the first language tag and map to supported locales
  const primary = acceptLanguage.split(',')[0].split(';')[0].trim().toLowerCase();

  if (primary.startsWith('ko')) return 'ko';
  if (primary.startsWith('ja')) return 'ja';
  if (primary.startsWith('en')) return 'en';

  return 'ko';
}

export type SyncUserOptions = {
  /** Value of the Accept-Language request header, used for new users only. */
  acceptLanguage?: string;
};

/**
 * Creates or updates the public.users row for `supabaseUser`.
 * Safe to call on every sign-in — the upsert is idempotent.
 */
export async function syncUser(
  supabaseUser: SupabaseUser,
  options: SyncUserOptions = {},
): Promise<void> {
  const meta = (supabaseUser.user_metadata ?? {}) as GitHubMetadata;

  const email =
    supabaseUser.email ??
    (meta.email as string | undefined) ??
    '';

  const username = deriveUsername(meta, email || supabaseUser.id);

  const avatarUrl = meta.avatar_url ?? null;
  const displayName = meta.full_name ?? meta.name ?? null;
  const githubHandle =
    meta.preferred_username ?? meta.user_name ?? null;

  // Fetch the existing row to decide whether to set locale/role defaults
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, supabaseUser.id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existing) {
    // Update mutable profile fields only — preserve role, locale, reputation
    await db
      .update(users)
      .set({
        email,
        avatarUrl,
        displayName,
        githubHandle,
        updatedAt: new Date(),
      })
      .where(eq(users.id, supabaseUser.id));
  } else {
    // Insert with safe defaults for new users
    await db.insert(users).values({
      id: supabaseUser.id,
      username,
      email,
      avatarUrl,
      displayName,
      githubHandle,
      role: 'contributor',
      locale: deriveLocale(options.acceptLanguage),
      reputation: 0,
      isVerified: false,
    });
  }
}
