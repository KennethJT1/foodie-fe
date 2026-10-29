import { PageHeader } from '@/components/data';
import { NotificationsList } from '@/features/notifications';

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <PageHeader title="Notifications" />
      <NotificationsList />
    </div>
  );
}
