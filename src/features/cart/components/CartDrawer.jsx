import { Link } from 'react-router-dom';

import { Button, Drawer } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { formatNaira } from '@/lib/format';
import { selectCartSubtotal, useCartStore } from '@/stores/cart-store';
import { useUiStore } from '@/stores/ui-store';

import { CartView } from './CartView';

/** Slide-in cart opened from the header bag icon. */
export function CartDrawer() {
  const isOpen = useUiStore((s) => s.isCartOpen);
  const close = useUiStore((s) => s.closeCart);
  const hasLines = useCartStore((s) => s.lines.length > 0);
  const subtotal = useCartStore(selectCartSubtotal);

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      title="Your cart"
      footer={
        hasLines && (
          <Button asChild fullWidth size="lg">
            <Link to={ROUTES.account.checkout} onClick={close}>
              Go to checkout – {formatNaira(subtotal)}
            </Link>
          </Button>
        )
      }
    >
      <div className="p-4">
        <CartView onNavigate={close} />
      </div>
    </Drawer>
  );
}
