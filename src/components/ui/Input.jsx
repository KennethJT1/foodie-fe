import { forwardRef, useId } from 'react';

import { cn } from '@/lib/cn';

import { Field, controlClasses, describedBy } from './Field';

/** Text input with label, hint, error and optional icons. Forwards its ref for React Hook Form. */
export const Input = forwardRef(function Input(
  {
    id: idProp,
    label,
    hint,
    error,
    leftIcon,
    rightSlot,
    className,
    inputClassName,
    required,
    labelHidden,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
      labelHidden={labelHidden}
    >
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted [&_svg]:h-4 [&_svg]:w-4">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(
            controlClasses(error),
            'h-11',
            leftIcon && 'pl-9',
            rightSlot && 'pr-11',
            inputClassName,
          )}
          {...props}
        />
        {rightSlot && (
          <span className="absolute inset-y-0 right-1 flex items-center">{rightSlot}</span>
        )}
      </div>
    </Field>
  );
});
