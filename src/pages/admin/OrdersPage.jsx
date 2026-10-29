import { PageHeader } from '@/components/data';
import { AdminOrderList } from '@/features/orders';

export default function OrdersPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Orders" description="Every order on the platform." />
      <AdminOrderList />
    </div>
  );
}
