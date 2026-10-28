import { PageHeader } from '@/components/data';
import { ROUTES } from '@/constants/routes';
import { OrderHistory } from '@/features/orders';

export default function OrdersPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Your orders" backTo={ROUTES.account.root} backLabel="Account" />
      <OrderHistory />
    </div>
  );
}
