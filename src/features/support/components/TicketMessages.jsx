import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

/** A ticket's conversation. Internal notes are only shown when `showInternal`. */
export function TicketMessages({ messages, viewerRole = 'admin', showInternal = false }) {
  return (
    <ol className="space-y-3" aria-label="Messages">
      {messages
        .filter((m) => showInternal || !m.internal)
        .map((m) => {
          const mine = viewerRole === 'admin' ? m.authorRole === 'admin' : m.authorRole !== 'admin';
          return (
            <li key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-card px-3 py-2 text-sm',
                  m.internal
                    ? 'border border-dashed border-warning bg-warning-50'
                    : mine
                      ? 'bg-primary-50'
                      : 'bg-surface-muted',
                )}
              >
                <p className="text-xs text-ink-muted">
                  {m.internal && (
                    <span className="font-semibold text-amber-900">Internal note · </span>
                  )}
                  {m.authorName} · {formatDateTime(m.createdAt)}
                </p>
                <p className="whitespace-pre-line">{m.body}</p>
              </div>
            </li>
          );
        })}
    </ol>
  );
}
