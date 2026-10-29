import { PageHeader } from '@/components/data';
import { ROUTES } from '@/constants/routes';
import { RefundList } from '@/features/refunds';

export default function RefundsPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Refunds" backTo={ROUTES.account.root} backLabel="Account" />
      <RefundList />
    </div>
  );
}
