import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';

const DOT = {
  done: 'bg-secondary text-white',
  current: 'bg-primary text-ink ring-4 ring-primary-100',
  upcoming: 'bg-gray-200 text-gray-500',
  danger: 'bg-danger text-white',
};

/**
 * Vertical history. items: [{ id, title, description?, time?, state: 'done'|'current'|'upcoming'|'danger' }].
 * Announces changes politely for live order status.
 */
export function Timeline({ items = [], className, live = false }) {
  return (
    <ol className={cn('relative space-y-0', className)} aria-live={live ? 'polite' : undefined}>
      {items.map((item, i) => {
        const state = item.state ?? 'done';
        const last = i === items.length - 1;
        return (
          <li key={item.id ?? i} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-0.5',
                  state === 'done' ? 'bg-secondary' : 'bg-gray-200',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                DOT[state],
              )}
            >
              {state === 'done' ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current" />
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  'text-sm font-medium',
                  state === 'upcoming' ? 'text-ink-muted' : 'text-ink',
                )}
              >
                {item.title}
              </p>
              {item.description && <p className="text-sm text-ink-muted">{item.description}</p>}
              {item.time && <p className="text-xs text-ink-muted">{item.time}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
