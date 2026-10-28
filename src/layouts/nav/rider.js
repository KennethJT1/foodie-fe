import { Bike, History, LifeBuoy, Navigation, User, Wallet } from 'lucide-react';

import { ROUTES } from '@/constants/routes';

export const riderNav = [
  {
    items: [
      { label: 'Go online', icon: Bike, to: ROUTES.rider.root, end: true },
      { label: 'Active delivery', icon: Navigation, to: ROUTES.rider.delivery },
      { label: 'Trips', icon: History, to: ROUTES.rider.trips },
      { label: 'Earnings', icon: Wallet, to: ROUTES.rider.earnings },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', icon: User, to: ROUTES.rider.profile },
      { label: 'Help and support', icon: LifeBuoy, to: ROUTES.rider.support },
    ],
  },
];

/** Bottom tabs on phones (riders use the app on the move). */
export const riderTabs = [
  { label: 'Home', icon: Bike, to: ROUTES.rider.root, end: true },
  { label: 'Delivery', icon: Navigation, to: ROUTES.rider.delivery },
  { label: 'Trips', icon: History, to: ROUTES.rider.trips },
  { label: 'Earnings', icon: Wallet, to: ROUTES.rider.earnings },
];
