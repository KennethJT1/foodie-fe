import { PageHeader } from '@/components/data';
import { AdminVendorList } from '@/features/vendors';

export default function VendorsPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Vendors" description="Every store on KJT Foodie." />
      <AdminVendorList />
    </div>
  );
}
