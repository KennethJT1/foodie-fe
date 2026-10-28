import { Minus, Plus, Trash2 } from 'lucide-react';

import { IconButton } from '@/components/ui';
import { cn } from '@/lib/cn';

/** − 2 + control. At 1, the minus becomes a remove button when `onRemove` is given. */
export function QuantityStepper({
  value,
  onChange,
  onRemove,
  min = 1,
  max = 20,
  label,
  className,
}) {
  const showRemove = onRemove && value <= min;
  return (
    <div
      role="group"
      aria-label={label ? `Quantity for ${label}` : 'Quantity'}
      className={cn(
        'inline-flex items-center rounded-full border border-surface-border',
        className,
      )}
    >
      {showRemove ? (
        <IconButton
          icon={Trash2}
          label={label ? `Remove ${label}` : 'Remove'}
          size="sm"
          onClick={onRemove}
        />
      ) : (
        <IconButton
          icon={Minus}
          label="Decrease quantity"
          size="sm"
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        />
      )}
      <span className="min-w-[2ch] text-center text-sm font-semibold" aria-live="polite">
        {value}
      </span>
      <IconButton
        icon={Plus}
        label="Increase quantity"
        size="sm"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      />
    </div>
  );
}
