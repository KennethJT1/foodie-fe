import { cva } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const paddingVariants = cva('', {
  variants: { padding: { none: '', sm: 'p-3', md: 'p-4 md:p-6' } },
  defaultVariants: { padding: 'md' },
});

/**
 * Surface for grouped content. `header` and `footer` get their own divided rows.
 * @param {{ header?: React.ReactNode, footer?: React.ReactNode, padding?: 'none'|'sm'|'md', as?: string }} props
 */
export function Card({ header, footer, padding, as: Tag = 'div', className, children, ...props }) {
  const surface = 'rounded-card bg-surface shadow-card';
  if (!header && !footer) {
    return (
      <Tag className={cn(surface, paddingVariants({ padding }), className)} {...props}>
        {children}
      </Tag>
    );
  }
  return (
    <Tag className={cn(surface, className)} {...props}>
      {header && <div className="border-b border-surface-border px-4 py-3 md:px-6">{header}</div>}
      <div className={paddingVariants({ padding })}>{children}</div>
      {footer && <div className="border-t border-surface-border px-4 py-3 md:px-6">{footer}</div>}
    </Tag>
  );
}

/** Title row for a Card header. */
export function CardTitle({ title, description, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
