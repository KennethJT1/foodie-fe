import { MessageCircle, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { ErrorState, SkeletonText } from '@/components/feedback';
import { Card, CardTitle, IconButton, Input } from '@/components/ui';
import { ORDER_STATUS } from '@/constants/order-status';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';

import { useDeliveryChat } from '../hooks/useDeliveryChat';

const OPEN = [ORDER_STATUS.RIDER_ASSIGNED, ORDER_STATUS.PICKED_UP];

/**
 * Chat between the customer and the rider while the food is on its way.
 * `order` needs `id` and `status`; `viewerRole` is 'customer' or 'rider'.
 */
export function DeliveryChat({ order, viewerRole }) {
  const isOpen = OPEN.includes(order.status);
  const { data, isLoading, isError, error, refetch, send } = useDeliveryChat(order.id, {
    enabled: isOpen,
  });
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState(null);
  const endRef = useRef(null);
  const count = data?.messages.length ?? 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [count]);

  if (!isOpen) return null;
  const other = viewerRole === 'customer' ? 'your rider' : 'the customer';
  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    send.mutate(
      { orderId: order.id, body: text.trim() },
      { onSuccess: () => setText(''), onError: (err) => setSendError(err.message) },
    );
  };

  return (
    <Card header={<CardTitle title={`Chat with ${other}`} />} padding="sm">
      {isLoading ? (
        <SkeletonText lines={3} />
      ) : isError ? (
        <ErrorState compact title="We couldn't load the chat" error={error} onRetry={refetch} />
      ) : (
        <div className="space-y-3">
          <ol
            className="max-h-64 space-y-2 overflow-y-auto"
            aria-label="Chat messages"
            aria-live="polite"
          >
            {data.messages.length === 0 && (
              <li className="flex items-center gap-2 text-sm text-ink-muted">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Send {other} a message, like where to find your gate.
              </li>
            )}
            {data.messages.map((m) => {
              const mine = m.senderRole === viewerRole;
              return (
                <li key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <p
                    className={cn(
                      'max-w-[80%] rounded-card px-3 py-2 text-sm',
                      mine ? 'bg-primary-50' : 'bg-surface-muted',
                    )}
                  >
                    <span className="sr-only">{mine ? 'You' : m.senderName}: </span>
                    {m.body}
                    <span className="block text-right text-[11px] text-ink-muted">
                      {formatTime(m.createdAt)}
                    </span>
                  </p>
                </li>
              );
            })}
            <li ref={endRef} aria-hidden="true" />
          </ol>
          <form onSubmit={submit} className="flex items-end gap-2">
            <Input
              label={`Message ${other}`}
              labelHidden
              placeholder="Type a message"
              maxLength={500}
              value={text}
              error={sendError}
              onChange={(e) => {
                setText(e.target.value);
                setSendError(null);
              }}
              className="flex-1"
            />
            <IconButton
              type="submit"
              icon={Send}
              label="Send message"
              disabled={send.isPending || !text.trim()}
            />
          </form>
        </div>
      )}
    </Card>
  );
}
