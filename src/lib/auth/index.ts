// ============================================================
// Auth barrel export
// ============================================================

export type { UserRole } from './rbac';
export { hasRole, canEdit, canModerate, canAdmin } from './rbac';

export type { CurrentUser } from './get-current-user';
export { getCurrentUser } from './get-current-user';

export { requireAuth, requireRole } from './require-auth';

export type { SyncUserOptions } from './sync-user';
export { syncUser } from './sync-user';
