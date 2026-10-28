import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { useId } from 'react';
import { createPortal } from 'react-dom';

import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { cn } from '@/lib/cn';

import { IconButton } from './IconButton';

const drawerVariants = cva('fixed z-50 flex flex-col bg-surface shadow-xl focus:outline-none', {
  variants: {
    side: {
      // Bottom sheet on phones, side panel from sm up
      right:
        'inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none',
      left: 'inset-y-0 left-0 w-[85vw] max-w-xs',
      bottom: 'inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl',
    },
  },
  defaultVariants: { side: 'right' },
});

/**
 * Sliding panel: bottom sheet on mobile, side panel on larger screens.
 * @param {{ open: boolean, onClose: () => void, title: React.ReactNode, footer?: React.ReactNode,
 *   side?: 'right'|'left'|'bottom' }} props
 */
export function Drawer({
  open,
  onClose,
  title,
  footer,
  side,
  className,
  children,
  hideHeader = false,
}) {
  const titleId = useId();
  const trapRef = useFocusTrap(open, onClose);
  useLockBodyScroll(open);
  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-ink/50" aria-hidden="true" onClick={onClose} />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(drawerVariants({ side }), className)}
      >
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b border-surface-border px-4 py-3',
            hideHeader && 'sr-only',
          )}
        >
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <IconButton icon={X} label="Close" size="sm" onClick={onClose} data-focus-skip />
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-surface-border p-4">{footer}</div>}
      </div>
    </>,
    document.body,
  );
}
