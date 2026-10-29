import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';

/** What failed, in plain words, with a Retry button. Never shows codes or stack traces. */
export function ErrorState({
  title = "We couldn't load this",
  error,
  message,
  onRetry,
  className,
  compact = false,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center text-center',
        compact ? 'gap-2 py-6' : 'gap-3 px-4 py-12',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-ink-muted">
        {message ?? (error ? getErrorMessage(error) : 'Please try again.')}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
