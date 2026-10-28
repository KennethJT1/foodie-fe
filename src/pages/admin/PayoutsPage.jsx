import { PageHeader } from '@/components/data';
import { AdminPayouts } from '@/features/riders';

export default function PayoutsPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader
        title="Rider payouts"
        description="Monthly statements: approve, pay by bank transfer, then mark paid."
      />
      <AdminPayouts />
    </div>
  );
}
