import { useId } from 'react';

import { cn } from '@/lib/cn';

/** On/off toggle (role="switch"). Controlled: `checked` + `onChange(checked)`. */
export function Switch({
  id: idProp,
  checked = false,
  onChange,
  label,
  description,
  disabled,
  size = 'md',
  className,
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const big = size === 'lg';
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {(label || description) && (
        <label htmlFor={id} className="text-sm">
          <span className="font-medium text-ink">{label}</span>
          {description && <span className="block text-ink-muted">{description}</span>}
        </label>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          big ? 'h-10 w-[72px]' : 'h-6 w-11',
          checked ? 'bg-secondary' : 'bg-gray-300',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-block transform rounded-full bg-white shadow transition-transform',
            big ? 'h-8 w-8' : 'h-5 w-5',
            checked ? (big ? 'translate-x-9' : 'translate-x-[22px]') : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}
