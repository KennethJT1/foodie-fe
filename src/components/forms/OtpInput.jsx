import { useRef } from 'react';

import { cn } from '@/lib/cn';

import { FormField } from './fields';

/**
 * One box per digit. Typing moves forward, Backspace moves back, pasting fills every box.
 * Calls `onComplete(code)` when all boxes are filled.
 */
export function OtpBoxes({
  length = 6,
  value = '',
  onChange,
  onComplete,
  error,
  label = 'Verification code',
  focusOnMount,
}) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const update = (next) => {
    const code = next.join('').slice(0, length);
    onChange?.(code);
    if (code.length === length && /^\d+$/.test(code)) onComplete?.(code);
  };

  const onInput = (i, raw) => {
    // Typing into a filled box gives "old+new" or "new+old"; keep only the new digit.
    const typed = raw.length === 2 && digits[i] ? raw.replace(digits[i], '') : raw;
    const chars = typed.replace(/\D/g, '');
    if (!chars) return;
    const next = [...digits];
    for (let k = 0; k < chars.length && i + k < length; k += 1) next[i + k] = chars[k];
    update(next);
    refs.current[Math.min(i + chars.length, length - 1)]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) next[i] = '';
      else if (i > 0) {
        next[i - 1] = '';
        refs.current[i - 1]?.focus();
      }
      update(next);
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">{label}</legend>
      <div className="flex gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={focusOnMount && i === 0}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={length}
            aria-label={`Digit ${i + 1} of ${length}`}
            aria-invalid={error ? true : undefined}
            value={d}
            onChange={(e) => onInput(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className={cn(
              'h-12 w-11 rounded-lg border bg-surface text-center text-lg font-semibold focus:border-primary-600 focus:ring-primary-600 sm:w-12',
              error ? 'border-danger' : 'border-surface-border',
            )}
          />
        ))}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** OTP boxes bound to a Form field. */
export function OtpInput({ name, ...props }) {
  if (!name) return <OtpBoxes {...props} />;
  return (
    <FormField name={name}>
      {(field, error) => (
        <OtpBoxes value={field.value ?? ''} onChange={field.onChange} error={error} {...props} />
      )}
    </FormField>
  );
}
