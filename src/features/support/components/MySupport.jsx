import { ArrowLeft, LifeBuoy, Plus } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PageHeader } from '@/components/data';
import { EmptyState, ErrorState, Skeleton, SkeletonText, toast } from '@/components/feedback';
import { ReplyForm } from '@/components/forms';
import { Badge, Button, Card, StatusBadge } from '@/components/ui';
import { TICKET_STATUS_META } from '@/constants/statuses';
import { cn } from '@/lib/cn';
import { formatOrderNumber, formatRelative } from '@/lib/format';

import { NewTicketDialog } from './NewTicketDialog';
import { TicketMessages } from './TicketMessages';
import {
  useMyTicket,
  useMyTickets,
  useReplyToMyTicket,
  useResolveMyTicket,
} from '../hooks/useMySupport';

function Thread({ id, onBack }) {
  const { data: t, isLoading, isError, error, refetch } = useMyTicket(id);
  const reply = useReplyToMyTicket();
  const resolve = useResolveMyTicket();
  if (isLoading) return <SkeletonText lines={6} />;
  if (isError)
    return <ErrorState title="We couldn't load this ticket" error={error} onRetry={refetch} />;
  const isOpen = !['resolved', 'closed'].includes(t.status);
  return (
    <Card className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        onClick={onBack}
      >
        All tickets
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-ink-muted">
            #{t.number}
            {t.orderCode && ` · ${formatOrderNumber(t.orderCode)}`}
          </p>
          <h2 className="text-lg font-semibold">{t.subject}</h2>
        </div>
        <StatusBadge status={t.status} meta={TICKET_STATUS_META} />
      </div>
      <TicketMessages messages={t.messages} viewerRole="user" />
      {t.status !== 'closed' && (
        <div className="space-y-2 border-t border-surface-border pt-4">
          <ReplyForm
            label="Your message"
            submitLabel="Send message"
            maxLength={2000}
            onSubmit={(body) => reply.mutateAsync({ id: t.id, body })}
          />
          {isOpen && (
            <Button
              variant="ghost"
              size="sm"
              loading={resolve.isPending}
              onClick={() =>
                resolve.mutate(t.id, {
                  onSuccess: () => toast.success('Glad that is sorted.'),
                  onError: (e) => toast.error(e),
                })
              }
            >
              My problem is solved
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

/** Help and support for customers, vendors and riders: their tickets and the conversation. */
export function MySupport() {
  const [params, setParams] = useSearchParams();
  const openId = params.get('ticket');
  const [isAsking, setAsking] = useState(false);
  const { data, isLoading, isError, error, refetch } = useMyTickets({ limit: 50 });
  const open = (id) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set('ticket', id);
      else next.delete('ticket');
      return next;
    });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Help and support"
        description="Ask us anything. We reply here and send you a notification."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAsking(true)}>
            Ask for help
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[340px_1fr] lg:items-start">
        <div className={cn('space-y-2', openId && 'hidden lg:block')}>
          {isLoading ? (
            [0, 1].map((i) => <Skeleton key={i} className="h-20 rounded-card" />)
          ) : isError ? (
            <ErrorState title="We couldn't load your tickets" error={error} onRetry={refetch} />
          ) : !data.data.length ? (
            <EmptyState
              icon={LifeBuoy}
              title="No questions yet"
              message="If something goes wrong with an order, a payment or your account, ask us here."
              action={<Button onClick={() => setAsking(true)}>Ask for help</Button>}
            />
          ) : (
            <ul className="space-y-2" aria-label="Your tickets">
              {data.data.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    aria-current={t.id === openId ? 'true' : undefined}
                    onClick={() => open(t.id)}
                    className={cn(
                      'w-full rounded-card border bg-surface p-3 text-left shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
                      t.id === openId ? 'border-primary' : 'border-transparent',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-ink-muted">
                        #{t.number} · {formatRelative(t.updatedAt)}
                      </span>
                      <StatusBadge status={t.status} meta={TICKET_STATUS_META} />
                    </div>
                    <p className="mt-1 font-medium">{t.subject}</p>
                    <p className="line-clamp-1 text-sm text-ink-muted">{t.lastMessage}</p>
                    {t.hasReply && t.status === 'pending' && (
                      <Badge tone="brand" className="mt-1">
                        New reply
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={cn(!openId && 'hidden lg:block')}>
          {openId ? (
            <Thread key={openId} id={openId} onBack={() => open(null)} />
          ) : (
            <EmptyState
              icon={LifeBuoy}
              title="Pick a ticket"
              message="Your conversations with our team show up here."
              className="rounded-card border border-dashed border-surface-border"
            />
          )}
        </div>
      </div>
      <NewTicketDialog
        open={isAsking}
        onClose={() => setAsking(false)}
        onCreated={(t) => {
          setAsking(false);
          open(t.id);
        }}
      />
    </div>
  );
}
