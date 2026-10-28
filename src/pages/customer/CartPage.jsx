import { PageHeader } from '@/components/data';
import { ROUTES } from '@/constants/routes';
import { CartView } from '@/features/cart';

export default function CartPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Your cart" backTo={ROUTES.account.root} backLabel="Account" />
      <div className="mx-auto max-w-xl">
        <CartView showCheckout />
      </div>
    </div>
  );
}
