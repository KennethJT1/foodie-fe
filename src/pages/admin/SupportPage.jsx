import { PageHeader } from '@/components/data';
import { SupportInbox } from '@/features/support';

export default function SupportPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader
        title="Support inbox"
        description="Questions from customers, vendors and riders."
      />
      <SupportInbox />
    </div>
  );
}
