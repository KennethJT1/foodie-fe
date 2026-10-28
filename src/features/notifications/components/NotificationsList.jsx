import { Bell, CreditCard, MessageCircle, Package, RotateCcw, Star, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Pagination } from '@/components/data';
import { EmptyState, ErrorState, Skeleton, toast } from '@/components/feedback';
import { Button, Tabs } from '@/components/ui';
import { useTableQuery } from '@/hooks/useTableQuery';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../hooks/useNotifications';

const ICONS = {
  order: Package,
  refund: RotateCcw,
  social: MessageCircle,
  review: Star,
  subscription: CreditCard,
  payout: Wallet,
};

/** In-app notifications for any role. Opening one marks it read and follows its link. */
export function NotificationsList() {
  const table = useTableQuery({ defaults: { limit: 20, sort: '-createdAt' } });
  const { data, isLoading, isError, error, refetch } = useNotifications(table.params);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const navigate = useNavigate();
  const unreadOnly = table.filters.unread === 'true';

  const open = (n) => {
    if (!n.readAt) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          aria-label="Filter notifications"
          variant="pills"
          items={[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
          ]}
          value={unreadOnly ? 'unread' : 'all'}
          onChange={(v) => table.setFilters({ unread: v === 'unread' ? 'true' : null })}
        />
        <Button
          variant="ghost"
          size="sm"
          loading={markAll.isPending}
          onClick={() =>
            markAll.mutate(undefined, {
              onSuccess: () => toast.success('All caught up'),
              onError: (e) => toast.error(e),
            })
          }
        >
          Mark all as read
        </Button>
      </div>

      {isLoading ? (
        <div role="status" aria-label="Loading notifications" className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-card" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="We couldn't load your notifications" error={error} onRetry={refetch} />
      ) : !data.data.length ? (
        <EmptyState
          icon={Bell}
          title={unreadOnly ? "You're all caught up" : 'No notifications yet'}
          message="Order updates, replies and reminders show up here."
        />
      ) : (
        <>
          <ul className="divide-y divide-surface-border overflow-hidden rounded-card bg-surface shadow-card">
            {data.data.map((n) => {
              const Icon = ICONS[n.type] ?? Bell;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className={cn(
                      'flex w-full items-start gap-3 p-4 text-left hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600',
                      !n.readAt && 'bg-primary-50/50',
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-sm', !n.readAt && 'font-semibold')}>
                        {n.title}
                      </span>
                      {n.body && <span className="block text-sm text-ink-muted">{n.body}</span>}
                      <span className="block text-xs text-ink-muted">
                        {formatRelative(n.createdAt)}
                      </span>
                    </span>
                    {!n.readAt && (
                      <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary-600">
                        <span className="sr-only">Unread</span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <Pagination
            meta={data.meta}
            onPageChange={table.setPage}
            onLimitChange={table.setLimit}
          />
        </>
      )}
    </div>
  );
}
