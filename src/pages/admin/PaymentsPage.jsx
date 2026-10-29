import { PageHeader } from '@/components/data';
import { AdminPayments } from '@/features/payments';

export default function PaymentsPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader
        title="Payments"
        description="Every transaction, how Paystack split it and whether it is reconciled."
      />
      <AdminPayments />
    </div>
  );
}
