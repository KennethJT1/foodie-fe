import { PageHeader } from '@/components/data';
import { ROUTES } from '@/constants/routes';
import { CheckoutForm } from '@/features/cart';

export default function CheckoutPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Checkout" backTo={ROUTES.account.cart} backLabel="Cart" />
      <CheckoutForm />
    </div>
  );
}
