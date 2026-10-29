import { ADMIN_ROLES, ROLES } from './roles';

/** Admin permissions. The backend re-checks every one; the UI only hides what can't be used. */
export const PERMISSIONS = Object.freeze({
  DASHBOARD_VIEW: 'dashboard.view',
  VENDORS_VIEW: 'vendors.view',
  VENDORS_APPROVE: 'vendors.approve',
  RIDERS_VIEW: 'riders.view',
  RIDERS_APPROVE: 'riders.approve',
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_BAN: 'customers.ban',
  ORDERS_VIEW: 'orders.view',
  ORDERS_REASSIGN: 'orders.reassign',
  LIVE_MAP_VIEW: 'live_map.view',
  PAYMENTS_VIEW: 'payments.view',
  SUBSCRIPTIONS_VIEW: 'subscriptions.view',
  SUBSCRIPTIONS_MANAGE: 'subscriptions.manage',
  PAYOUTS_MANAGE: 'payouts.manage',
  REFUNDS_VIEW: 'refunds.view',
  REFUNDS_ESCALATE: 'refunds.escalate',
  MODERATION_MANAGE: 'moderation.manage',
  SUPPORT_MANAGE: 'support.manage',
  SETTINGS_MANAGE: 'settings.manage',
  ADMIN_USERS_MANAGE: 'admin_users.manage',
  AUDIT_LOG_VIEW: 'audit_log.view',
  REPORTS_EXPORT: 'reports.export',
});

const ALL = Object.values(PERMISSIONS);
const P = PERMISSIONS;

/** Default permission set per admin sub-role; editable by a super admin (phase 16). */
export const ADMIN_ROLE_PERMISSIONS = {
  [ADMIN_ROLES.SUPER_ADMIN]: ALL,
  [ADMIN_ROLES.SUPPORT]: [
    P.DASHBOARD_VIEW,
    P.CUSTOMERS_VIEW,
    P.VENDORS_VIEW,
    P.RIDERS_VIEW,
    P.ORDERS_VIEW,
    P.REFUNDS_VIEW,
    P.REFUNDS_ESCALATE,
    P.MODERATION_MANAGE,
    P.SUPPORT_MANAGE,
  ],
  [ADMIN_ROLES.FINANCE]: [
    P.DASHBOARD_VIEW,
    P.ORDERS_VIEW,
    P.PAYMENTS_VIEW,
    P.SUBSCRIPTIONS_VIEW,
    P.SUBSCRIPTIONS_MANAGE,
    P.PAYOUTS_MANAGE,
    P.REFUNDS_VIEW,
    P.REPORTS_EXPORT,
  ],
  [ADMIN_ROLES.DISPATCH]: [
    P.DASHBOARD_VIEW,
    P.RIDERS_VIEW,
    P.ORDERS_VIEW,
    P.ORDERS_REASSIGN,
    P.LIVE_MAP_VIEW,
  ],
  [ADMIN_ROLES.ONBOARDING]: [
    P.DASHBOARD_VIEW,
    P.VENDORS_VIEW,
    P.VENDORS_APPROVE,
    P.RIDERS_VIEW,
    P.RIDERS_APPROVE,
  ],
};

/**
 * True when the user holds the permission. Admins carry `permissions` from the API;
 * non-admin roles have none.
 * @param {{ role: string, permissions?: string[] } | null} user
 * @param {string} permission
 */
export function hasPermission(user, permission) {
  if (!user || user.role !== ROLES.ADMIN) return false;
  return Boolean(user.permissions?.includes(permission));
}
