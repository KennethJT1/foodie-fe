import { PageHeader } from '@/components/data';
import { VendorRefundList } from '@/features/refunds';

export default function RefundsPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader
        title="Refund requests"
        description="Answer each request before its deadline. You pay refunds from your own account."
      />
      <VendorRefundList />
    </div>
  );
}
