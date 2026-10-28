import { PageHeader } from '@/components/data';
import { Card } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { DeleteAccountSection, ProfileForm } from '@/features/auth';

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 md:px-6">
      <PageHeader title="Profile" backTo={ROUTES.account.root} backLabel="Account" />
      <Card>
        <ProfileForm />
      </Card>
      <Card>
        <DeleteAccountSection />
      </Card>
    </div>
  );
}
