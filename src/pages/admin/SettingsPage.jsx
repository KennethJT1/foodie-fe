import { PageHeader } from '@/components/data';
import { PlatformSettingsForm } from '@/features/settings';

export default function SettingsPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader
        title="Settings"
        description="Fees, payouts, timeouts and messages for the whole platform."
      />
      <PlatformSettingsForm />
    </div>
  );
}
