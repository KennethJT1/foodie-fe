import { PageHeader } from '@/components/data';
import { ROUTES } from '@/constants/routes';
import { FollowedVendorsList } from '@/features/vendors';

export default function FollowingPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Following" backTo={ROUTES.account.root} backLabel="Account" />
      <FollowedVendorsList />
    </div>
  );
}
