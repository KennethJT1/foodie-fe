import { PageHeader } from '@/components/data';
import { ROUTES } from '@/constants/routes';
import { VendorOrderHistory } from '@/features/orders';

export default function OrderHistoryPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Order history" backTo={ROUTES.vendor.orders} backLabel="Live orders" />
      <VendorOrderHistory />
    </div>
  );
}
