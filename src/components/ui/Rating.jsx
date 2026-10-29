import { Star } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/cn';

/**
 * Star rating. Read-only shows `value` (with half stars rounded); interactive is a radio group
 * of 1–5 stars, keyboard accessible.
 */
export function Rating({
  value = 0,
  readOnly = false,
  onChange,
  size = 'md',
  count,
  label = 'Rating',
  className,
}) {
  const [hover, setHover] = useState(0);
  const px = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';
  const shown = hover || value;

  if (readOnly) {
    return (
      <span className={cn('inline-flex items-center gap-1', className)}>
        <span className="inline-flex" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn(
                px,
                n <= Math.round(value) ? 'fill-accent text-accent' : 'text-gray-300',
              )}
            />
          ))}
        </span>
        <span className="sr-only">{`${Number(value).toFixed(1)} out of 5`}</span>
        {count != null && <span className="text-xs text-ink-muted">({count})</span>}
      </span>
    );
  }

  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex', className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          tabIndex={value === n || (!value && n === 1) ? 0 : -1}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp')
              onChange?.(Math.min(5, (value || 0) + 1));
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
              onChange?.(Math.max(1, (value || 1) - 1));
          }}
          className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <Star
            className={cn(px, n <= shown ? 'fill-accent text-accent' : 'text-gray-300')}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
