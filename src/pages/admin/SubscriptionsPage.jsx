import { PageHeader } from '@/components/data';
import { AdminSubscriptionList } from '@/features/subscriptions';

export default function SubscriptionsPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Subscriptions" description="Every vendor's plan, soonest to end first." />
      <AdminSubscriptionList />
    </div>
  );
}
