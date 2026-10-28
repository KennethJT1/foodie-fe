import { getRoleHome } from '@/constants/roles';

const ROLE_PREFIX = { vendor: '/vendor', rider: '/rider', admin: '/admin' };
const PROTECTED = Object.values(ROLE_PREFIX);

/**
 * Where to go after signing in: the `next` path when it is safe and belongs to this role,
 * otherwise the role's home.
 */
export function resolveNextPath(user, next) {
  const home = getRoleHome(user);
  if (!next || !next.startsWith('/') || next.startsWith('//')) return home;
  const prefix = ROLE_PREFIX[user.role];
  if (prefix) return next.startsWith(prefix) ? next : home;
  // Customers may go anywhere outside the other roles' areas
  return PROTECTED.some((p) => next.startsWith(p)) ? home : next;
}
