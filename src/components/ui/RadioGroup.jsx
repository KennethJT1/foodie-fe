import { useId } from 'react';

import { cn } from '@/lib/cn';

/**
 * Group of radio buttons. `options`: [{ value, label, description? }].
 * `variant="cards"` shows each option as a tappable card.
 */
export function RadioGroup({
  name,
  label,
  options = [],
  value,
  onChange,
  error,
  variant = 'list',
  className,
}) {
  const autoId = useId();
  const groupName = name ?? autoId;
  return (
    <fieldset className={cn('space-y-2', className)}>
      {label && <legend className="mb-2 text-sm font-medium text-ink">{label}</legend>}
      <div className={cn(variant === 'cards' ? 'grid gap-3 sm:grid-cols-2' : 'space-y-2')}>
        {options.map((o) => {
          const id = `${groupName}-${o.value}`;
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              htmlFor={id}
              className={cn(
                'flex cursor-pointer items-start gap-3 text-sm',
                variant === 'cards' &&
                  'rounded-card border bg-surface p-4 transition-colors hover:border-primary',
                variant === 'cards' &&
                  (checked ? 'border-primary bg-primary-50' : 'border-surface-border'),
              )}
            >
              <input
                id={id}
                type="radio"
                name={groupName}
                value={o.value}
                checked={checked}
                onChange={() => onChange?.(o.value)}
                className="mt-0.5 h-5 w-5 border-surface-border text-primary focus:ring-primary"
              />
              <span>
                <span className="font-medium text-ink">{o.label}</span>
                {o.description && <span className="block text-ink-muted">{o.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
