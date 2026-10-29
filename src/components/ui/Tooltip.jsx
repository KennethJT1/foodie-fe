import { useId, useState } from 'react';

import { cn } from '@/lib/cn';

/** Short hint shown on hover and keyboard focus. Not for essential information. */
export function Tooltip({ content, children, side = 'top', className }) {
  const [isOpen, setIsOpen] = useState(false);
  const id = useId();
  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      aria-describedby={isOpen ? id : undefined}
    >
      {children}
      {isOpen && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white shadow',
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
