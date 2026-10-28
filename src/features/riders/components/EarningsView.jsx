import { FileText } from 'lucide-react';

import { PageHeader, StatCard } from '@/components/data';
import { EmptyState, ErrorState, SkeletonText } from '@/components/feedback';
import { Card, CardTitle, StatusBadge } from '@/components/ui';
import { PAYOUT_STATUS_META } from '@/constants/statuses';
import { formatCount, formatDate, formatNaira } from '@/lib/format';

import { useEarnings, useStatements } from '../hooks/useRider';

/** "2026-10" → "October 2026" */
const monthLabel = (month) =>
  new Date(`${month}-15T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

/** This month's earnings (payout % of delivery fees) and monthly payout statements (BR-PAY-06). */
export function EarningsView() {
  const earnings = useEarnings();
  const statements = useStatements();
  const e = earnings.data;
  return (
    <div className="space-y-4">
      <PageHeader
        title="Earnings"
        description={
          e
            ? `You earn ${e.payoutPct}% of the delivery fee on every completed trip. We pay monthly to your bank.`
            : 'Your trips, fees and monthly payouts.'
        }
      />
      {earnings.isError ? (
        <ErrorState
          title="We couldn't load your earnings"
          error={earnings.error}
          onRetry={earnings.refetch}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label={e ? `Earned in ${monthLabel(e.month)}` : 'Earned this month'}
            loading={earnings.isLoading}
            value={formatNaira(e?.earnings ?? 0)}
          />
          <StatCard
            label="Trips this month"
            loading={earnings.isLoading}
            value={formatCount(e?.trips)}
          />
          <StatCard
            label="Delivery fees"
            loading={earnings.isLoading}
            value={formatNaira(e?.deliveryFees ?? 0)}
          />
          <StatCard
            label="Earned today"
            loading={earnings.isLoading}
            value={formatNaira(e?.today.earnings ?? 0)}
          />
        </div>
      )}
      <Card
        header={
          <CardTitle
            title="Payout statements"
            description="Finance approves each month, then pays by bank transfer."
          />
        }
      >
        {statements.isLoading ? (
          <SkeletonText lines={4} />
        ) : statements.isError ? (
          <ErrorState
            compact
            title="We couldn't load your statements"
            error={statements.error}
            onRetry={statements.refetch}
          />
        ) : statements.data.length ? (
          <ul className="divide-y divide-surface-border">
            {statements.data.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                <span className="min-w-[140px] flex-1 font-medium">{monthLabel(s.month)}</span>
                <span className="text-ink-muted">{s.trips} trips</span>
                <span className="font-semibold">{formatNaira(s.amount)}</span>
                <StatusBadge status={s.status} meta={PAYOUT_STATUS_META} />
                {s.status === 'paid' && (
                  <span className="w-full text-xs text-ink-muted">
                    Paid {formatDate(s.paidAt)} · reference {s.reference}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            compact
            icon={FileText}
            title="No statements yet"
            message="Your first statement arrives at the end of the month."
          />
        )}
      </Card>
    </div>
  );
}
