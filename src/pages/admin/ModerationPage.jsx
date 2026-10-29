import { PageHeader } from '@/components/data';
import { ModerationQueue } from '@/features/feed';

export default function ModerationPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <PageHeader title="Moderation" description="Comments and dishes customers reported." />
      <ModerationQueue />
    </div>
  );
}
