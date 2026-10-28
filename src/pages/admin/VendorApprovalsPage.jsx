import { PageHeader } from '@/components/data';
import { AdminVendorList } from '@/features/vendors';

export default function VendorApprovalsPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader
        title="Vendor approvals"
        description="Check each store's documents, then approve or reject with a reason."
      />
      <AdminVendorList
        defaults={{ approvalStatus: 'pending', sort: 'submittedAt' }}
        showStatusFilter={false}
        emptyTitle="No vendors waiting for approval"
      />
    </div>
  );
}
