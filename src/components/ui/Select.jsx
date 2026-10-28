import { forwardRef, useId } from 'react';

import { cn } from '@/lib/cn';

import { Field, controlClasses, describedBy } from './Field';

/**
 * Native select (best on phones). `options`: [{ value, label, disabled? }].
 * Use `onValueChange(value)` for controlled use; `onChange` stays the native event handler so
 * React Hook Form's `register` works.
 */
export const Select = forwardRef(function Select(
  {
    id: idProp,
    label,
    hint,
    error,
    options = [],
    placeholder,
    className,
    onChange,
    onValueChange,
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
      <select
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(controlClasses(error), 'h-11 pr-9')}
        onChange={(e) => {
          onChange?.(e);
          onValueChange?.(e.target.value);
        }}
        {...props}
      >
        {placeholder != null && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
});
