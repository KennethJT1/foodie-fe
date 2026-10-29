import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ErrorState, SkeletonText, toast } from '@/components/feedback';
import { Button, Card, Checkbox, Select, Textarea } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { TICKET_STATUS_META, toOptions } from '@/constants/statuses';
import { formatOrderNumber } from '@/lib/format';

import { TicketMessages } from './TicketMessages';
import { TICKET_PRIORITY_META, TICKET_ROLE_LABELS } from '../constants';
import {
  useAdminTicket,
  useReplyToTicket,
  useSupportAgents,
  useUpdateTicket,
} from '../hooks/useAdminSupport';

/** One ticket for an agent: assign, status, priority, the conversation, reply or internal note. */
export function AdminTicketThread({ id }) {
  const { data: t, isLoading, isError, error, refetch } = useAdminTicket(id);
  const agents = useSupportAgents();
  const update = useUpdateTicket();
  const reply = useReplyToTicket();
  const [body, setBody] = useState('');
  const [isInternal, setInternal] = useState(false);
  const [replyError, setReplyError] = useState(null);

  if (isLoading) return <SkeletonText lines={8} />;
  if (isError)
    return <ErrorState title="We couldn't load this ticket" error={error} onRetry={refetch} />;

  const send = () => {
    if (!body.trim()) return setReplyError('Write a reply first');
    reply.mutate(
      { id: t.id, body, internal: isInternal },
      {
        onSuccess: () => {
          setBody('');
          toast.success(isInternal ? 'Note added' : `Reply sent to ${t.userName}`);
        },
      },
    );
  };

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs text-ink-muted">
          #{t.number} · {TICKET_ROLE_LABELS[t.userRole]} {t.userName}
          {t.orderId && (
            <>
              {' · '}
              <Link to={ROUTES.admin.order(t.orderId)} className="text-primary-700 hover:underline">
                {formatOrderNumber(t.orderCode)}
              </Link>
            </>
          )}
        </p>
        <h2 className="text-lg font-semibold">{t.subject}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          label="Status"
          value={t.status}
          options={toOptions(TICKET_STATUS_META)}
          onValueChange={(status) => update.mutate({ id: t.id, status })}
        />
        <Select
          label="Assigned to"
          value={t.assigneeId ?? ''}
          placeholder="Nobody yet"
          options={(agents.data ?? []).map((a) => ({ value: a.id, label: a.name }))}
          onValueChange={(assigneeId) =>
            update.mutate({ id: t.id, assigneeId: assigneeId || null })
          }
        />
        <Select
          label="Priority"
          value={t.priority}
          options={toOptions(TICKET_PRIORITY_META)}
          onValueChange={(priority) => update.mutate({ id: t.id, priority })}
        />
      </div>
      <TicketMessages messages={t.messages} showInternal />
      <div className="space-y-2 border-t border-surface-border pt-4">
        <Textarea
          label={isInternal ? 'Internal note' : `Reply to ${t.userName}`}
          rows={3}
          maxLength={2000}
          value={body}
          error={replyError}
          onChange={(e) => {
            setBody(e.target.value);
            setReplyError(null);
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Checkbox
            label="Internal note (only the team sees it)"
            checked={isInternal}
            onChange={(e) => setInternal(e.target.checked)}
          />
          <Button loading={reply.isPending} onClick={send}>
            {isInternal ? 'Add note' : 'Send reply'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
