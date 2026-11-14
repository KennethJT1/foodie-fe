import { PageHeader } from '@/components/data';
import { Card } from '@/components/ui';
import { ProfileForm } from '@/features/auth';

/** The super admin's own account details (other admins are redirected away by the route guard). */
export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 md:px-6">
      <PageHeader title="Profile" description="Your name, email, phone and photo." />
      <Card>
        <ProfileForm />
      </Card>
    </div>
  );
}
