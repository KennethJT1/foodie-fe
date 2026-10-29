import { PageHeader } from '@/components/data';
import { AdminPlans } from '@/features/subscriptions';

export default function PlansPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader
        title="Plans and prices"
        description="What vendors pay and what each plan includes."
      />
      <AdminPlans />
    </div>
  );
}
