import { cn } from '@/lib/cn';

/** Label + control + hint/error wrapper shared by every input. */
export function Field({ id, label, hint, error, required, className, children, labelHidden }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className={cn('block text-sm font-medium text-ink', labelHidden && 'sr-only')}
        >
          {label}
          {required && (
            <span className="text-danger" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export const describedBy = (id, error, hint) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export const controlClasses = (error) =>
  cn(
    'block w-full rounded-xl border bg-surface text-sm text-ink placeholder:text-ink-muted/70 focus:border-primary focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-ink-muted',
    error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-surface-border',
  );
