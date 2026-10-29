import { PageHeader } from '@/components/data';
import { ROUTES } from '@/constants/routes';
import { PaymentHistory } from '@/features/payments';

export default function PaymentsPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Payments" backTo={ROUTES.account.root} backLabel="Account" />
      <PaymentHistory />
    </div>
  );
}
