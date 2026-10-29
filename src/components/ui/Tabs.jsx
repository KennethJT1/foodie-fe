import { useId, useRef } from 'react';

import { cn } from '@/lib/cn';

/**
 * Tab list. `items`: [{ value, label, count? }]. Arrow keys move between tabs.
 * Render the panel yourself with `getTabPanelProps(value)` if you need aria wiring.
 */
export function Tabs({
  items = [],
  value,
  onChange,
  className,
  variant = 'underline',
  'aria-label': ariaLabel,
}) {
  const baseId = useId();
  const refs = useRef([]);

  const onKeyDown = (e, index) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (index + dir + items.length) % items.length;
    refs.current[next]?.focus();
    onChange?.(items[next].value);
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex gap-1 overflow-x-auto',
        variant === 'underline' ? 'border-b border-surface-border' : 'gap-2',
        className,
      )}
    >
      {items.map((item, i) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => (refs.current[i] = el)}
            id={`${baseId}-${item.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange?.(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'inline-flex min-h-tap shrink-0 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
              variant === 'underline' &&
                (selected
                  ? 'border-b-2 border-primary text-ink'
                  : 'border-b-2 border-transparent text-ink-muted hover:text-ink'),
              variant === 'pills' &&
                cn(
                  'min-h-[40px] rounded-full border px-4',
                  selected
                    ? 'border-primary bg-primary font-semibold text-ink'
                    : 'border-surface-border bg-surface text-ink hover:border-ink',
                ),
            )}
          >
            {item.label}
            {item.count != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs',
                  selected ? 'bg-ink text-white' : 'bg-surface-muted text-ink-muted',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
