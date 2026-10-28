import { cva } from 'class-variance-authority';

import { cn } from '@/lib/cn';

/** Fixed status colours: the same status always looks the same everywhere. */
export const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-gray-100 text-gray-700',
        success: 'bg-secondary-50 text-secondary-600',
        warning: 'bg-warning-50 text-amber-800',
        danger: 'bg-danger-50 text-red-700',
        info: 'bg-info-50 text-blue-700',
        brand: 'bg-primary-50 text-primary-700',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Badge({ tone, className, dot = false, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Badge for a status value looked up in a `{ [status]: { label, tone } }` map from constants. */
export function StatusBadge({ status, meta, className }) {
  const m = meta?.[status] ?? { label: status, tone: 'neutral' };
  return (
    <Badge tone={m.tone} className={className} dot>
      {m.label}
    </Badge>
  );
}
