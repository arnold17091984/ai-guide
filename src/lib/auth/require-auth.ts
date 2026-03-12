import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from './get-current-user';
import { hasRole } from './rbac';
import type { UserRole } from './rbac';
import type { CurrentUser } from './get-current-user';

// ============================================================
// requireAuth / requireRole — guards for Server Components,
// Server Actions, and Route Handlers
// ============================================================

const LOGIN_PATH = '/auth/login';

/**
 * Asserts the request is authenticated.
 * Redirects to the login page if not.
 * Returns the current user when authenticated.
 */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(LOGIN_PATH);
  }

  return user;
}

/**
 * Asserts the authenticated user holds `role` or higher.
 * Calls requireAuth() first, so unauthenticated requests are
 * redirected to login rather than receiving a 404.
 */
export async function requireRole(role: UserRole): Promise<CurrentUser> {
  const user = await requireAuth();

  if (!hasRole(user.role, role)) {
    // notFound() produces a 404 response — avoids leaking the
    // existence of admin/moderator-only pages to regular users.
    notFound();
  }

  return user;
}
