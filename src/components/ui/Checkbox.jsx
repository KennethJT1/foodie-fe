import { forwardRef, useId } from 'react';

import { cn } from '@/lib/cn';

export const Checkbox = forwardRef(function Checkbox(
  { id: idProp, label, description, error, className, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        aria-invalid={error ? true : undefined}
        className="mt-0.5 h-5 w-5 rounded border-surface-border text-primary focus:ring-primary"
        {...props}
      />
      {(label || description) && (
        <label htmlFor={id} className="text-sm">
          <span className="font-medium text-ink">{label}</span>
          {description && <span className="block text-ink-muted">{description}</span>}
          {error && <span className="block text-danger">{error}</span>}
        </label>
      )}
    </div>
  );
});
