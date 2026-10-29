import { PageHeader } from '@/components/data';
import { AdminRefundList } from '@/features/refunds';

export default function RefundsPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader
        title="Refunds"
        description="Every refund request. Vendors pay refunds; we watch and step in."
      />
      <AdminRefundList />
    </div>
  );
}
