import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { users } from '../db/schema/users';
import { createClient } from '../supabase/server';
import type { UserRole } from './rbac';

// ============================================================
// getCurrentUser — server-side, request-scoped
// ============================================================
// Wrapped with React cache() so repeated calls within a single
// React render tree (RSC subtree) hit the DB only once.

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputation: number;
  locale: string;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    return null;
  }

  const profile = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      reputation: users.reputation,
      locale: users.locale,
    })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    reputation: profile.reputation,
    locale: profile.locale,
  };
});
