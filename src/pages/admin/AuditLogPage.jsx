import { PageHeader } from '@/components/data';
import { AuditLogTable } from '@/features/settings';

export default function AuditLogPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Audit log" description="Every admin action and money event." />
      <AuditLogTable />
    </div>
  );
}
