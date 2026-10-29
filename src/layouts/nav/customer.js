import { Home, LayoutDashboard, Receipt, Search, User } from 'lucide-react';

import { ROUTES } from '@/constants/routes';

/** Customer bottom tabs on phones. */
export const customerTabs = [
  { label: 'Home', icon: Home, to: ROUTES.home, end: true },
  { label: 'Search', icon: Search, to: ROUTES.search },
  { label: 'Orders', icon: Receipt, to: ROUTES.account.orders },
  { label: 'Account', icon: User, to: ROUTES.account.root, end: true },
];

/** Phone tabs for vendors, riders and admins browsing the storefront: a way back to their dashboard. */
export const staffTabs = (dashboardTo) => [
  { label: 'Home', icon: Home, to: ROUTES.home, end: true },
  { label: 'Search', icon: Search, to: ROUTES.search },
  { label: 'Dashboard', icon: LayoutDashboard, to: dashboardTo },
];
