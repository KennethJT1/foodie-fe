import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';

import { useUnreadCount } from '../hooks/useNotifications';

/** Bell with unread count that links to the role's notifications page. */
export function NotificationBell({ to, className }) {
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;
  return (
    <Link
      to={to}
      aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}
      className={cn(
        'relative inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-primary-50',
        className,
      )}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute right-1.5 top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1 text-[11px] font-semibold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
