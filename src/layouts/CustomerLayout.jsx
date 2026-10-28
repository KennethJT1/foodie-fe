import { Search, ShoppingBasket, UserCircle2 } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { CartDrawer } from '@/features/cart';
import { NotificationBell } from '@/features/notifications';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth-store';
import { selectCartCount, useCartStore } from '@/stores/cart-store';
import { useUiStore } from '@/stores/ui-store';

import { customerTabs } from './nav/customer';
import { BottomTabs } from './parts/BottomTabs';
import { CustomerFooter } from './parts/CustomerFooter';
import { CustomerTopBar } from './parts/CustomerTopBar';
import { Logo } from './parts/Logo';
import { UserMenu } from './parts/UserMenu';

/** Customer and public browsing: top bar, bottom tabs on phones, cart drawer. */
export default function CustomerLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore(selectCartCount);
  const openCart = useUiStore((s) => s.openCart);
  const isCustomer = user?.role === 'customer';

  const links = [
    { to: ROUTES.home, label: 'Home', end: true },
    { to: ROUTES.search, label: 'Browse food' },
    ...(isCustomer
      ? [
          { to: ROUTES.account.orders, label: 'Track order' },
          { to: ROUTES.account.following, label: 'Following' },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface pb-[72px] md:pb-0">
      <CustomerTopBar />
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:h-20 md:px-6">
          <Logo />
          <nav aria-label="Main" className="mx-auto hidden items-center gap-2 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary font-semibold text-ink'
                      : 'text-ink hover:bg-surface-muted',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link
              to={ROUTES.search}
              aria-label="Search"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-muted md:hidden"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Link>
            {(!user || isCustomer) && (
              <button
                type="button"
                onClick={openCart}
                aria-label={cartCount ? `Cart, ${cartCount} items` : 'Cart'}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-white hover:bg-secondary-600 md:hidden"
              >
                <ShoppingBasket className="h-5 w-5" aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-ink">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            {status === 'authenticated' ? (
              <>
                {isCustomer && <NotificationBell to={ROUTES.account.notifications} />}
                <UserMenu profileTo={isCustomer ? ROUTES.account.profile : undefined} />
              </>
            ) : (
              status === 'anonymous' && (
                <Button asChild variant="dark" size="md" leftIcon={null} className="px-4 md:px-6">
                  <Link to={ROUTES.login}>
                    <UserCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className="hidden sm:inline">Log in / Sign up</span>
                    <span className="sm:hidden">Log in</span>
                  </Link>
                </Button>
              )
            )}
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1">
        <Outlet />
      </main>
      <CustomerFooter />
      <BottomTabs tabs={customerTabs} />
      <CartDrawer />
    </div>
  );
}
