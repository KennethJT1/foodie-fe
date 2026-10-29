import {
  BarChart3,
  CreditCard,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  ReceiptText,
  RotateCcw,
  Settings,
  ShoppingBag,
  UtensilsCrossed,
} from 'lucide-react';

import { ROUTES } from '@/constants/routes';

/** Vendor sidebar. Adding a page = one route + one entry here. */
export const vendorNav = [
  {
    items: [
      { label: 'Overview', icon: LayoutDashboard, to: ROUTES.vendor.root, end: true },
      {
        label: 'Live orders',
        icon: ShoppingBag,
        to: ROUTES.vendor.orders,
        end: true,
        badgeKey: 'newOrders',
      },
      { label: 'Order history', icon: ReceiptText, to: ROUTES.vendor.orderHistory },
      { label: 'Menu', icon: UtensilsCrossed, to: ROUTES.vendor.menu },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Sales and payouts', icon: BarChart3, to: ROUTES.vendor.sales },
      { label: 'Engagement', icon: HeartHandshake, to: ROUTES.vendor.engagement },
      { label: 'Refunds', icon: RotateCcw, to: ROUTES.vendor.refunds },
      { label: 'Subscription', icon: CreditCard, to: ROUTES.vendor.subscription },
    ],
  },
  {
    title: 'Store',
    items: [
      { label: 'Store settings', icon: Settings, to: ROUTES.vendor.settings },
      { label: 'Help and support', icon: LifeBuoy, to: ROUTES.vendor.support },
    ],
  },
];
