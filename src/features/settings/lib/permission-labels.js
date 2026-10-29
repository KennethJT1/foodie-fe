import { PERMISSIONS as P } from '@/constants/permissions';

/** Plain-English names for the roles editor. */
export const PERMISSION_LABELS = {
  [P.DASHBOARD_VIEW]: 'See the overview',
  [P.VENDORS_VIEW]: 'See vendors',
  [P.VENDORS_APPROVE]: 'Approve vendors and bank changes',
  [P.RIDERS_VIEW]: 'See riders',
  [P.RIDERS_APPROVE]: 'Approve riders',
  [P.CUSTOMERS_VIEW]: 'See customers',
  [P.CUSTOMERS_BAN]: 'Suspend and ban customers',
  [P.ORDERS_VIEW]: 'See orders',
  [P.ORDERS_REASSIGN]: 'Reassign riders',
  [P.LIVE_MAP_VIEW]: 'See the live map',
  [P.PAYMENTS_VIEW]: 'See payments',
  [P.SUBSCRIPTIONS_VIEW]: 'See subscriptions',
  [P.SUBSCRIPTIONS_MANAGE]: 'Edit plans and extend subscriptions',
  [P.PAYOUTS_MANAGE]: 'Approve and pay rider payouts',
  [P.REFUNDS_VIEW]: 'See refunds',
  [P.REFUNDS_ESCALATE]: 'Escalate refunds',
  [P.MODERATION_MANAGE]: 'Moderate comments and dishes',
  [P.SUPPORT_MANAGE]: 'Answer support tickets',
  [P.SETTINGS_MANAGE]: 'Change platform settings',
  [P.ADMIN_USERS_MANAGE]: 'Manage admins and roles',
  [P.AUDIT_LOG_VIEW]: 'See the audit log',
  [P.REPORTS_EXPORT]: 'Export CSV reports',
};
