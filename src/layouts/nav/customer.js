import { Home, Receipt, Search, User } from 'lucide-react';

import { ROUTES } from '@/constants/routes';

/** Customer bottom tabs on phones. */
export const customerTabs = [
  { label: 'Home', icon: Home, to: ROUTES.home, end: true },
  { label: 'Search', icon: Search, to: ROUTES.search },
  { label: 'Orders', icon: Receipt, to: ROUTES.account.orders },
  { label: 'Account', icon: User, to: ROUTES.account.root, end: true },
];
