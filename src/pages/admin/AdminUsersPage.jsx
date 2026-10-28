import { PageHeader } from '@/components/data';
import { AdminAccess } from '@/features/settings';

export default function AdminUsersPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader
        title="Admin users"
        description="Who can use the admin dashboard, and what each role may do."
      />
      <AdminAccess />
    </div>
  );
}
