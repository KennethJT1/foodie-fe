import { cn } from '@/lib/cn';

/** Small loading spinner. Use Skeleton for page content. */
export function Spinner({ className, label = 'Loading' }) {
  return (
    <span role="status" className={cn('inline-flex', className)}>
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
