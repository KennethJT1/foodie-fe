import { PageHeader } from '@/components/data';
import { ROUTES } from '@/constants/routes';
import { LikedFoodList } from '@/features/feed';

export default function LikedPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Liked food" backTo={ROUTES.account.root} backLabel="Account" />
      <LikedFoodList />
    </div>
  );
}
