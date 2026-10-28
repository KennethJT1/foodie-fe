import {
  Bell,
  ChevronRight,
  CreditCard,
  Heart,
  LifeBuoy,
  MapPin,
  Receipt,
  RotateCcw,
  Store,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Avatar, Button, Card } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useLogout, useSession } from '@/features/auth';

const LINKS = [
  { to: ROUTES.account.orders, label: 'Orders', icon: Receipt },
  { to: ROUTES.account.liked, label: 'Liked food', icon: Heart },
  { to: ROUTES.account.following, label: 'Following', icon: Store },
  { to: ROUTES.account.refunds, label: 'Refunds', icon: RotateCcw },
  { to: ROUTES.account.addresses, label: 'Addresses', icon: MapPin },
  { to: ROUTES.account.payments, label: 'Payments', icon: CreditCard },
  { to: ROUTES.account.notifications, label: 'Notifications', icon: Bell },
  { to: ROUTES.account.profile, label: 'Profile', icon: User },
  { to: ROUTES.account.support, label: 'Help and support', icon: LifeBuoy },
];

export default function AccountPage() {
  const { user } = useSession();
  const logout = useLogout();
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 md:px-6">
      <div className="flex items-center gap-3">
        <Avatar name={user?.name} src={user?.avatar} size="lg" />
        <div>
          <h1 className="text-xl font-semibold">{user?.name}</h1>
          <p className="text-sm text-ink-muted">{user?.email ?? user?.phone}</p>
        </div>
      </div>
      <Card padding="none">
        <nav aria-label="Account">
          <ul className="divide-y divide-surface-border">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex min-h-[52px] items-center gap-3 px-4 hover:bg-primary-50"
                >
                  <Icon className="h-5 w-5 text-primary-600" aria-hidden="true" />
                  <span className="flex-1 font-medium">{label}</span>
                  <ChevronRight className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Card>
      <Button
        variant="outline"
        fullWidth
        loading={logout.isPending}
        onClick={() => logout.mutate()}
      >
        Log out
      </Button>
    </div>
  );
}
