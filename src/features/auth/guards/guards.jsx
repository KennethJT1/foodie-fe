import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { PageLoader } from '@/components/feedback';
import { hasPermission } from '@/constants/permissions';
import { getRoleHome, ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { SUBSCRIPTION_STATUS } from '@/constants/statuses';
import { useAuthStore } from '@/stores/auth-store';

import { ForbiddenContent } from './ForbiddenContent';

/*
 * Guards render their children (or <Outlet />) when allowed. Hiding is not security:
 * the backend re-checks every request.
 */

const render = (children) => children ?? <Outlet />;

/** No session → /login?next=<current path>. Waits while the silent refresh runs. */
export function RequireAuth({ children }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  if (status === 'idle') return <PageLoader label="Checking your session" />;
  if (status !== 'authenticated') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${ROUTES.login}?next=${next}`} replace />;
  }
  return render(children);
}

/** Wrong role → that user's own home (a rider opening /admin lands on /rider). */
export function RequireRole({ roles, children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  if (!roles.includes(user.role)) return <Navigate to={getRoleHome(user)} replace />;
  return render(children);
}

/** Admin sub-role lacks the permission → 403 page. */
export function RequirePermission({ permission, children }) {
  const user = useAuthStore((s) => s.user);
  if (!hasPermission(user, permission)) return <ForbiddenContent />;
  return render(children);
}

/** Vendor or rider not yet approved → onboarding (draft) or the status page. */
export function RequireApproved({ children }) {
  const user = useAuthStore((s) => s.user);
  const profile =
    user?.role === ROLES.VENDOR ? user.vendor : user?.role === ROLES.RIDER ? user.rider : null;
  const base = user?.role === ROLES.VENDOR ? ROUTES.vendor : ROUTES.rider;
  if (!profile) return render(children);
  if (profile.approvalStatus === 'draft') return <Navigate to={base.onboarding} replace />;
  if (profile.approvalStatus !== 'approved') return <Navigate to={base.status} replace />;
  return render(children);
}

const LOCKED = [SUBSCRIPTION_STATUS.EXPIRED, SUBSCRIPTION_STATUS.NONE];

/** Vendor plan expired or never started → only Plans/Subscription stay open. */
export function RequireActiveSubscription({ children }) {
  const user = useAuthStore((s) => s.user);
  const status = user?.vendor?.subscriptionStatus;
  if (user?.role === ROLES.VENDOR && LOCKED.includes(status)) {
    return (
      <Navigate
        to={status === SUBSCRIPTION_STATUS.NONE ? ROUTES.vendor.plans : ROUTES.vendor.subscription}
        replace
      />
    );
  }
  return render(children);
}

/** Shows children only when the admin has the permission (UI convenience, not security). */
export function Can({ permission, children, fallback = null }) {
  const user = useAuthStore((s) => s.user);
  return hasPermission(user, permission) ? children : fallback;
}

/** Signed-in users skip the login and sign-up pages. */
export function RedirectIfAuthenticated({ children }) {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  if (status === 'authenticated' && user) return <Navigate to={getRoleHome(user)} replace />;
  return render(children);
}
