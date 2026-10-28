import { cva } from 'class-variance-authority';
import { forwardRef, isValidElement } from 'react';

import { cn } from '@/lib/cn';

const iconButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        ghost: 'text-ink hover:bg-surface-muted',
        outline: 'border border-surface-border bg-surface text-ink hover:border-ink',
        dark: 'bg-ink text-white hover:bg-ink/90',
        primary: 'bg-primary text-ink hover:bg-primary-600',
        danger: 'text-danger hover:bg-danger-50',
      },
      // 44 px tap target from md up (riders use the app on the move)
      size: { sm: 'h-9 w-9', md: 'h-11 w-11', lg: 'h-12 w-12' },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  },
);

/** Icon-only button. `label` is required: it is the accessible name. */
export const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, variant, size, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    >
      {isValidElement(Icon) ? Icon : <Icon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
});
