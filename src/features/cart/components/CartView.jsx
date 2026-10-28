import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/feedback';
import { Avatar, Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { FoodImage } from '@/features/catalogue';
import { formatNaira } from '@/lib/format';
import { linePrice, selectCartSubtotal, useCartStore } from '@/stores/cart-store';

import { QuantityStepper } from './QuantityStepper';

/** Lines in the one-vendor cart with quantity controls. Used by the drawer and /account/cart. */
export function CartView({ onNavigate, showCheckout = false }) {
  const vendor = useCartStore((s) => s.vendor);
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore(selectCartSubtotal);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);

  if (!lines.length) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        message="Find something tasty near you and add it here."
        action={
          <Button asChild>
            <Link to={ROUTES.home} onClick={onNavigate}>
              Browse food
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {vendor && (
        <Link
          to={ROUTES.storefront(vendor.slug)}
          onClick={onNavigate}
          className="flex items-center gap-3 hover:text-primary-700"
        >
          <Avatar src={vendor.logo} name={vendor.name} size="sm" shape="square" />
          <span className="text-sm">
            Your order from <span className="font-semibold">{vendor.name}</span>
          </span>
        </Link>
      )}
      <ul className="divide-y divide-surface-border">
        {lines.map((l) => (
          <li key={l.key} className="flex gap-3 py-3">
            <div className="w-16 shrink-0 overflow-hidden rounded-lg">
              <FoodImage src={l.photo} alt={l.name} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{l.name}</p>
                <p className="text-sm font-semibold">{formatNaira(linePrice(l))}</p>
              </div>
              {l.options.length > 0 && (
                <p className="text-xs text-ink-muted">{l.options.map((o) => o.name).join(', ')}</p>
              )}
              <QuantityStepper
                value={l.quantity}
                label={l.name}
                onChange={(q) => setQuantity(l.key, q)}
                onRemove={() => removeLine(l.key)}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-surface-border pt-3">
        <span className="text-sm text-ink-muted">Subtotal</span>
        <span className="font-semibold">{formatNaira(subtotal)}</span>
      </div>
      <p className="text-xs text-ink-muted">Delivery and processing fees are shown at checkout.</p>
      {showCheckout && (
        <Button asChild fullWidth size="lg">
          <Link to={ROUTES.account.checkout} onClick={onNavigate}>
            Go to checkout – {formatNaira(subtotal)}
          </Link>
        </Button>
      )}
    </div>
  );
}
