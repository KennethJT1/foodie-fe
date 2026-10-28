import { cva } from 'class-variance-authority';
import { forwardRef } from 'react';

import { cn } from '@/lib/cn';

import { Slot } from './Slot';
import { Spinner } from './Spinner';

export const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Orange pill with navy text (white on #FC8A06 fails contrast)
        primary: 'bg-primary text-ink hover:bg-primary-600',
        // Navy pill, e.g. "Log in / Sign up"
        dark: 'bg-ink text-white hover:bg-ink/90',
        // Green basket / checkout actions
        secondary: 'bg-secondary text-white hover:bg-secondary-600',
        outline: 'border border-surface-border bg-surface text-ink hover:border-ink',
        ghost: 'text-ink hover:bg-surface-muted',
        danger: 'bg-danger text-white hover:bg-red-700',
        link: 'h-auto rounded-none px-0 font-medium text-primary-700 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-base',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

/**
 * @param {{ variant?: 'primary'|'dark'|'secondary'|'outline'|'ghost'|'danger'|'link', size?: 'sm'|'md'|'lg',
 *   loading?: boolean, leftIcon?: React.ReactNode, rightIcon?: React.ReactNode, asChild?: boolean,
 *   fullWidth?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export const Button = forwardRef(function Button(
  {
    className,
    variant,
    size,
    fullWidth,
    loading = false,
    leftIcon,
    rightIcon,
    asChild = false,
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  const classes = cn(buttonVariants({ variant, size, fullWidth }), className);
  if (asChild) {
    return (
      <Slot ref={ref} className={classes} {...props}>
        {children}
      </Slot>
    );
  }
  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner label="Please wait" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
