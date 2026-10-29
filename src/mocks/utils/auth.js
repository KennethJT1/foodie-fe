import { db, findById } from '../db';
import { fail } from './respond';

/**
 * Mock tokens. Access token: "mock.<userId>.<expiresAtMs>". The refresh token stands in for the
 * backend's httpOnly cookie and is kept in localStorage (mock mode only).
 */
const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_KEY = 'kjt-mock-refresh';
let memoryRefresh = null;

export const issueAccessToken = (userId) => `mock.${userId}.${Date.now() + ACCESS_TTL_MS}`;

export function setRefreshSession(userId) {
  memoryRefresh = userId;
  try {
    if (userId) window.localStorage.setItem(REFRESH_KEY, userId);
    else window.localStorage.removeItem(REFRESH_KEY);
  } catch {
    // tests / blocked storage
  }
}

export function getRefreshSession() {
  try {
    return window.localStorage.getItem(REFRESH_KEY) ?? memoryRefresh;
  } catch {
    return memoryRefresh;
  }
}

/** The signed-in user for a request, or null. */
export function currentUser(request) {
  const header = request.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer mock\.(.+)\.(\d+)$/);
  if (!match) return null;
  const [, userId, exp] = match;
  if (Number(exp) < Date.now()) return null;
  const user = findById('users', userId);
  return user && user.status !== 'banned' ? user : null;
}

/**
 * Guards a handler. Returns `{ user }` or `{ error: Response }`.
 * @param {Request} request
 * @param {{ roles?: string[], permission?: string }} [opts]
 */
export function requireUser(request, { roles, permission } = {}) {
  const user = currentUser(request);
  if (!user) return { error: fail(401) };
  if (roles && !roles.includes(user.role)) return { error: fail(403) };
  if (permission && !permissionsFor(user).includes(permission)) return { error: fail(403) };
  return { user };
}

/** Current permissions of an admin, read from the editable roles table. */
export function permissionsFor(user) {
  if (user?.role !== 'admin') return [];
  return db.adminRoles.find((r) => r.id === user.adminRole)?.permissions ?? [];
}

/** The user object the API returns: no password, plus permissions and linked profiles. */
export function sessionUser(user) {
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = user;
  const out = { ...rest, permissions: permissionsFor(user) };
  if (user.vendorId) {
    const v = findById('vendors', user.vendorId);
    out.vendor = v && {
      id: v.id,
      name: v.name,
      slug: v.slug,
      approvalStatus: v.approvalStatus,
      subscriptionStatus: v.subscriptionStatus,
      planId: v.planId,
      onboardingStep: v.onboardingStep,
      logo: v.logo,
    };
  }
  if (user.riderId) {
    const r = findById('riders', user.riderId);
    out.rider = r && { id: r.id, approvalStatus: r.approvalStatus, isOnline: r.isOnline };
  }
  return out;
}

/** Adds an audit entry for admin actions and money events. */
export function audit(actor, action, targetType, targetId, summary) {
  db.auditLog.unshift({
    id: `aud_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    actorId: actor?.id ?? 'system',
    actorName: actor?.name ?? 'System',
    actorRole: actor?.adminRole ?? actor?.role ?? 'system',
    action,
    targetType,
    targetId,
    summary,
    ip: '127.0.0.1',
    createdAt: new Date().toISOString(),
  });
}

/** Creates an in-app notification. */
export function notify(userId, { type, title, body, link }) {
  if (!userId) return;
  db.notifications.unshift({
    id: `ntf_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    userId,
    type,
    title,
    body,
    link,
    readAt: null,
    createdAt: new Date().toISOString(),
  });
}
