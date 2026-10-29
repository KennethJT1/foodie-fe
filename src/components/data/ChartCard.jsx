import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { cn } from '@/lib/cn';

/** Card wrapper for Recharts charts, with loading, empty and error states. */
export function ChartCard({
  title,
  description,
  action,
  loading,
  error,
  onRetry,
  isEmpty,
  height = 260,
  className,
  children,
}) {
  return (
    <section className={cn('rounded-card bg-surface p-4 shadow-card md:p-6', className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="text-sm text-ink-muted">{description}</p>}
        </div>
        {action}
      </header>
      <div style={{ height }}>
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
          <ErrorState compact error={error} onRetry={onRetry} />
        ) : isEmpty ? (
          <EmptyState
            compact
            title="No data yet"
            message="This chart fills in as orders come in."
          />
        ) : (
          children
        )}
      </div>
    </section>
  );
}

/** Shared colours for charts: the same values as the Tailwind theme tokens. */
export const CHART_COLORS = {
  primary: '#FC8A06',
  secondary: '#028643',
  ink: '#03081F',
  inkMuted: '#5B6070',
  accent: '#FFB703',
  info: '#2563EB',
  muted: '#9CA3AF',
  grid: '#E5E7EB',
};
