import { PageHeader } from '@/components/data';
import { AdminRiderList } from '@/features/riders';

export default function RiderApprovalsPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader
        title="Rider approvals"
        description="Check each rider's documents and guarantor, then approve or reject."
      />
      <AdminRiderList
        defaults={{ approvalStatus: 'pending', sort: 'submittedAt' }}
        showStatusFilter={false}
        emptyTitle="No riders waiting for approval"
      />
    </div>
  );
}
