import { ArrowLeft, Inbox } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { FilterBar, Pagination } from '@/components/data';
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { Button, StatusBadge } from '@/components/ui';
import { TICKET_STATUS_META, toOptions } from '@/constants/statuses';
import { useTableQuery } from '@/hooks/useTableQuery';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';

import { AdminTicketThread } from './AdminTicketThread';
import { TICKET_PRIORITY_META, TICKET_ROLE_LABELS } from '../constants';
import { useAdminTickets } from '../hooks/useAdminSupport';

const ASSIGNEE = [
  { value: 'me', label: 'Mine' },
  { value: 'none', label: 'Not assigned' },
];

/** Support inbox: tickets on the left, the open ticket on the right (stacked on phones). */
export function SupportInbox() {
  const table = useTableQuery({
    defaults: { limit: 20, sort: '-updatedAt', status: 'open,pending' },
  });
  const { data, isLoading, isError, error, refetch } = useAdminTickets(table.params);
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get('ticket');
  const open = (id) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set('ticket', id);
      else next.delete('ticket');
      return next;
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr] lg:items-start">
      <div className={cn('space-y-3', openId && 'hidden lg:block')}>
        <FilterBar
          value={table.filters}
          onChange={table.setFilters}
          fields={[
            { type: 'search', name: 'search', placeholder: 'Subject, name or ticket no.' },
            {
              type: 'select',
              name: 'status',
              label: 'Status',
              options: [
                { value: 'open,pending', label: 'Open and waiting' },
                ...toOptions(TICKET_STATUS_META),
              ],
            },
            { type: 'select', name: 'assignee', label: 'Assigned', options: ASSIGNEE },
            {
              type: 'select',
              name: 'priority',
              label: 'Priority',
              options: toOptions(TICKET_PRIORITY_META),
            },
          ]}
        />
        {isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-card" />)
        ) : isError ? (
          <ErrorState title="We couldn't load tickets" error={error} onRetry={refetch} />
        ) : !data.data.length ? (
          <EmptyState
            icon={Inbox}
            title="No tickets here"
            message="New questions from customers, vendors and riders show up here."
          />
        ) : (
          <ul className="space-y-2" aria-label="Tickets">
            {data.data.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  aria-current={t.id === openId ? 'true' : undefined}
                  onClick={() => open(t.id)}
                  className={cn(
                    'w-full rounded-card border bg-surface p-3 text-left shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
                    t.id === openId
                      ? 'border-primary'
                      : 'border-transparent hover:border-surface-border',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-ink-muted">
                      #{t.number} · {TICKET_ROLE_LABELS[t.userRole]} · {formatRelative(t.updatedAt)}
                    </span>
                    <StatusBadge status={t.status} meta={TICKET_STATUS_META} />
                  </div>
                  <p className="mt-1 font-medium">{t.subject}</p>
                  <p className="line-clamp-1 text-sm text-ink-muted">
                    {t.userName}: {t.lastMessage}
                  </p>
                  {t.priority === 'high' && (
                    <StatusBadge className="mt-1" status="high" meta={TICKET_PRIORITY_META} />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pagination meta={data?.meta} onPageChange={table.setPage} />
      </div>
      <div className={cn(!openId && 'hidden lg:block')}>
        {openId ? (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => open(null)}
            >
              All tickets
            </Button>
            <AdminTicketThread key={openId} id={openId} />
          </div>
        ) : (
          <EmptyState
            icon={Inbox}
            title="Pick a ticket"
            message="Open a ticket on the left to read and reply."
            className="rounded-card border border-dashed border-surface-border"
          />
        )}
      </div>
    </div>
  );
}
