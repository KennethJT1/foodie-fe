import {
  Banknote,
  Bike,
  ClipboardCheck,
  CreditCard,
  Flag,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Map,
  ReceiptText,
  RotateCcw,
  ScrollText,
  Settings,
  ShieldCheck,
  Store,
  Tags,
  Users,
} from 'lucide-react';

import { PERMISSIONS as P } from '@/constants/permissions';
import { ROUTES } from '@/constants/routes';

/** Admin sidebar. Items the admin lacks permission for are hidden. */
export const adminNav = [
  {
    items: [
      {
        label: 'Overview',
        icon: LayoutDashboard,
        to: ROUTES.admin.root,
        end: true,
        permission: P.DASHBOARD_VIEW,
      },
    ],
  },
  {
    title: 'People',
    items: [
      {
        label: 'Vendor approvals',
        icon: ClipboardCheck,
        to: ROUTES.admin.vendorApprovals,
        permission: P.VENDORS_APPROVE,
      },
      {
        label: 'Vendors',
        icon: Store,
        to: ROUTES.admin.vendors,
        end: true,
        permission: P.VENDORS_VIEW,
      },
      {
        label: 'Rider approvals',
        icon: ListChecks,
        to: ROUTES.admin.riderApprovals,
        permission: P.RIDERS_APPROVE,
      },
      {
        label: 'Riders',
        icon: Bike,
        to: ROUTES.admin.riders,
        end: true,
        permission: P.RIDERS_VIEW,
      },
      { label: 'Customers', icon: Users, to: ROUTES.admin.customers, permission: P.CUSTOMERS_VIEW },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Orders', icon: ReceiptText, to: ROUTES.admin.orders, permission: P.ORDERS_VIEW },
      { label: 'Live map', icon: Map, to: ROUTES.admin.liveMap, permission: P.LIVE_MAP_VIEW },
      { label: 'Refunds', icon: RotateCcw, to: ROUTES.admin.refunds, permission: P.REFUNDS_VIEW },
      {
        label: 'Moderation',
        icon: Flag,
        to: ROUTES.admin.moderation,
        permission: P.MODERATION_MANAGE,
      },
      {
        label: 'Support inbox',
        icon: LifeBuoy,
        to: ROUTES.admin.support,
        permission: P.SUPPORT_MANAGE,
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        label: 'Payments',
        icon: CreditCard,
        to: ROUTES.admin.payments,
        permission: P.PAYMENTS_VIEW,
      },
      {
        label: 'Subscriptions',
        icon: ShieldCheck,
        to: ROUTES.admin.subscriptions,
        permission: P.SUBSCRIPTIONS_VIEW,
      },
      {
        label: 'Plans and prices',
        icon: Tags,
        to: ROUTES.admin.plans,
        permission: P.SUBSCRIPTIONS_MANAGE,
      },
      {
        label: 'Rider payouts',
        icon: Banknote,
        to: ROUTES.admin.payouts,
        permission: P.PAYOUTS_MANAGE,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Settings',
        icon: Settings,
        to: ROUTES.admin.settings,
        permission: P.SETTINGS_MANAGE,
      },
      {
        label: 'Admin users',
        icon: Users,
        to: ROUTES.admin.adminUsers,
        permission: P.ADMIN_USERS_MANAGE,
      },
      {
        label: 'Audit log',
        icon: ScrollText,
        to: ROUTES.admin.auditLog,
        permission: P.AUDIT_LOG_VIEW,
      },
    ],
  },
];
