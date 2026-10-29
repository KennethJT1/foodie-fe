import { forwardRef, useId } from 'react';

import { cn } from '@/lib/cn';

import { Field, controlClasses, describedBy } from './Field';

/** Multi-line input. Shows a character counter when `maxLength` is set. */
export const Textarea = forwardRef(function Textarea(
  { id: idProp, label, hint, error, className, required, rows = 4, maxLength, value, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const count = typeof value === 'string' ? value.length : null;
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        required={required}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(controlClasses(error), 'py-2.5')}
        {...props}
      />
      {maxLength && count != null && (
        <p className="text-right text-xs text-ink-muted" aria-live="polite">
          {count}/{maxLength}
        </p>
      )}
    </Field>
  );
});
