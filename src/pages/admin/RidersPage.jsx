import { PageHeader } from '@/components/data';
import { AdminRiderList } from '@/features/riders';

export default function RidersPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Riders" description="Online status, trips and ratings." />
      <AdminRiderList />
    </div>
  );
}
