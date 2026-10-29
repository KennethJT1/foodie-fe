import { PageHeader } from '@/components/data';
import { AdminCustomerList } from '@/features/reports';

export default function CustomersPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Customers" description="Suspend or ban accounts that break the rules." />
      <AdminCustomerList />
    </div>
  );
}
