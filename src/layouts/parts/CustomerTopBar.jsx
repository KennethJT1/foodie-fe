import { ChevronRight, MapPin, ShoppingBasket } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import { useAddresses } from '@/features/auth';
import { formatNaira } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import { selectCartCount, selectCartSubtotal, useCartStore } from '@/stores/cart-store';
import { useUiStore } from '@/stores/ui-store';

/**
 * Slim bar above the header (UI kit): tagline, delivery location and the green cart button.
 * Desktop only; phones get the cart in the header.
 */
export function CustomerTopBar() {
  const user = useAuthStore((s) => s.user);
  const isCustomer = user?.role === 'customer';
  const { data: addresses } = useAddresses({ enabled: isCustomer });
  const address = addresses?.find((a) => a.isDefault) ?? addresses?.[0];
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const openCart = useUiStore((s) => s.openCart);

  return (
    <div className="hidden md:block">
      <div className="mx-auto flex max-w-6xl items-stretch justify-between gap-4 px-6">
        <div className="flex flex-1 items-center justify-between gap-6 rounded-b-2xl border border-t-0 border-surface-border bg-surface-page px-6 py-2.5 text-sm">
          <p>
            <span aria-hidden="true">🌟 </span>
            Good food, delivered fast —{' '}
            <span className="font-semibold text-primary-700">order from vendors near you</span>
          </p>
          <p className="flex items-center gap-1.5 text-ink">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            {address ? (
              <>
                <span className="max-w-[220px] truncate">
                  {address.area ? `${address.area}, ` : ''}
                  {address.city}
                </span>
                <Link
                  to={ROUTES.account.addresses}
                  className="font-medium text-primary-700 underline-offset-2 hover:underline"
                >
                  Change location
                </Link>
              </>
            ) : (
              <span>Delivering across Nigeria</span>
            )}
          </p>
        </div>
        {(!user || isCustomer) && (
          <button
            type="button"
            onClick={openCart}
            aria-label={count ? `Open cart, ${count} items, ${formatNaira(subtotal)}` : 'Open cart'}
            className="flex items-stretch overflow-hidden rounded-b-2xl bg-secondary text-sm font-semibold text-white hover:bg-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            <span className="flex items-center gap-2 px-4">
              <ShoppingBasket className="h-5 w-5" aria-hidden="true" />
              {count} {count === 1 ? 'item' : 'items'}
            </span>
            <span className="flex items-center border-l border-white/30 px-4">
              {formatNaira(subtotal)}
            </span>
            <span className="flex items-center border-l border-white/30 px-3">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
