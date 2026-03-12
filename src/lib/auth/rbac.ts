// ============================================================
// RBAC — Role-Based Access Control utilities
// ============================================================
// Role hierarchy (highest → lowest):
//   admin > moderator > contributor > viewer

export type UserRole = 'admin' | 'moderator' | 'contributor' | 'viewer';

const ROLE_RANK: Record<UserRole, number> = {
  admin: 4,
  moderator: 3,
  contributor: 2,
  viewer: 1,
};

/**
 * Returns true when `userRole` satisfies `requiredRole` or higher.
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

/** contributor, moderator, or admin */
export function canEdit(userRole: UserRole): boolean {
  return hasRole(userRole, 'contributor');
}

/** moderator or admin */
export function canModerate(userRole: UserRole): boolean {
  return hasRole(userRole, 'moderator');
}

/** admin only */
export function canAdmin(userRole: UserRole): boolean {
  return hasRole(userRole, 'admin');
}
