import { LayoutDashboard, LogOut, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Avatar, Dropdown } from '@/components/ui';
import { ADMIN_ROLE_LABELS, getRoleHome } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { useLogout } from '@/features/auth';
import { useAuthStore } from '@/stores/auth-store';

export function UserMenu({ profileTo }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!user) return null;
  const roleLabel = user.role === 'admin' ? ADMIN_ROLE_LABELS[user.adminRole] : user.role;
  const dashboardTo = getRoleHome(user);
  // Vendors, riders and admins can browse the storefront; give them a way back
  const showDashboard = user.role !== 'customer' && !pathname.startsWith(dashboardTo);

  return (
    <Dropdown
      label="Account menu"
      trigger={(p) => (
        <button
          type="button"
          {...p}
          aria-label="Account menu"
          className="flex min-h-tap items-center gap-2 rounded-full pl-1 pr-2 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <Avatar name={user.name} src={user.avatar} size="sm" />
          <span className="hidden text-left text-sm leading-tight md:block">
            <span className="block font-medium">{user.firstName}</span>
            <span className="block text-xs capitalize text-ink-muted">{roleLabel}</span>
          </span>
        </button>
      )}
      items={[
        ...(showDashboard
          ? [{ label: 'Dashboard', icon: LayoutDashboard, onSelect: () => navigate(dashboardTo) }]
          : []),
        ...(profileTo
          ? [{ label: 'Profile', icon: User, onSelect: () => navigate(profileTo) }]
          : []),
        {
          label: 'Log out',
          icon: LogOut,
          onSelect: () =>
            logout.mutate(undefined, {
              onSettled: () => navigate(ROUTES.login, { replace: true }),
            }),
        },
      ]}
    />
  );
}
