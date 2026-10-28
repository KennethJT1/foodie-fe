import { TrendingDown, TrendingUp } from 'lucide-react';

import { Skeleton } from '@/components/feedback/Skeleton';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';

/** KPI number with label and change vs the last period. */
export function StatCard({
  label,
  value,
  change,
  changeLabel = 'vs last period',
  icon: Icon,
  loading,
  className,
  hint,
}) {
  const up = change > 0;
  const down = change < 0;
  return (
    <div className={cn('rounded-card bg-surface p-4 shadow-card', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-ink-muted">{label}</p>
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-24" />
      ) : (
        <p className="mt-1 font-heading text-2xl font-semibold text-ink">{value}</p>
      )}
      {change != null && !loading && (
        <p
          className={cn(
            'mt-1 flex items-center gap-1 text-xs',
            up ? 'text-secondary-600' : down ? 'text-danger' : 'text-ink-muted',
          )}
        >
          {up && <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />}
          {down && <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
          <span>
            {up ? '+' : ''}
            {formatPercent(change)} <span className="text-ink-muted">{changeLabel}</span>
          </span>
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
