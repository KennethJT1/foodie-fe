import { Search, ShoppingBag } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { NotificationBell } from '@/features/notifications';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth-store';
import { selectCartCount, useCartStore } from '@/stores/cart-store';
import { useUiStore } from '@/stores/ui-store';

import { customerTabs } from './nav/customer';
import { BottomTabs } from './parts/BottomTabs';
import { Logo } from './parts/Logo';
import { UserMenu } from './parts/UserMenu';

/** Customer and public browsing: top bar, bottom tabs on phones, cart drawer. */
export default function CustomerLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore(selectCartCount);
  const openCart = useUiStore((s) => s.openCart);
  const isCustomer = user?.role === 'customer';

  return (
    <div className="min-h-screen pb-[72px] md:pb-0">
      <header className="sticky top-0 z-30 border-b border-surface-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
          <Logo />
          <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex">
            {[
              { to: ROUTES.home, label: 'Home', end: true },
              { to: ROUTES.search, label: 'Search' },
              ...(isCustomer ? [{ to: ROUTES.account.orders, label: 'Orders' }] : []),
            ].map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium',
                    isActive ? 'text-primary-700' : 'text-ink hover:bg-primary-50',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Link
              to={ROUTES.search}
              aria-label="Search"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-primary-50 md:hidden"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Link>
            {(!user || isCustomer) && (
              <button
                type="button"
                onClick={openCart}
                aria-label={cartCount ? `Cart, ${cartCount} items` : 'Cart'}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-primary-50"
              >
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1 text-[11px] font-semibold text-white">
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
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={ROUTES.login}>Log in</Link>
                  </Button>
                  <Button asChild size="sm" className="hidden sm:inline-flex">
                    <Link to={ROUTES.signup('customer')}>Sign up</Link>
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl">
        <Outlet />
      </main>
      <BottomTabs tabs={customerTabs} />
    </div>
  );
}
