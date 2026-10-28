import { Inbox } from 'lucide-react';

import { cn } from '@/lib/cn';

/** Says why there is nothing here and what to do next. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
  className,
  compact = false,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        compact ? 'gap-2 py-6' : 'gap-3 px-4 py-12',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      {message && <p className="max-w-sm text-sm text-ink-muted">{message}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
