import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { useId } from 'react';
import { createPortal } from 'react-dom';

import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { cn } from '@/lib/cn';

import { IconButton } from './IconButton';

const panelVariants = cva(
  'relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-surface shadow-xl focus:outline-none',
  {
    variants: {
      size: { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' },
      // On phones a modal sits at the bottom like a sheet
      placement: {
        center: 'rounded-t-2xl sm:rounded-card',
        right: 'h-full max-h-none sm:ml-auto sm:max-w-md sm:rounded-none',
      },
    },
    defaultVariants: { size: 'md', placement: 'center' },
  },
);

/**
 * Dialog with focus trap, Esc to close and background scroll lock.
 * @param {{ open: boolean, onClose: () => void, title: React.ReactNode, description?: React.ReactNode,
 *   footer?: React.ReactNode, size?: 'sm'|'md'|'lg'|'xl', dismissible?: boolean }} props
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size,
  placement,
  dismissible = true,
  className,
  children,
}) {
  const titleId = useId();
  const descId = useId();
  const close = () => dismissible && onClose?.();
  const trapRef = useFocusTrap(open, close);
  useLockBodyScroll(open);

  if (!open) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4',
        placement === 'right' && 'sm:items-stretch sm:p-0',
      )}
    >
      <div className="absolute inset-0 bg-ink/50" aria-hidden="true" onClick={close} />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(panelVariants({ size, placement }), className)}
      >
        <div className="flex items-start justify-between gap-3 border-b border-surface-border px-4 py-3 md:px-6">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-ink-muted">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <IconButton icon={X} label="Close" size="sm" onClick={onClose} data-focus-skip />
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-surface-border px-4 py-3 sm:flex-row sm:justify-end md:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
