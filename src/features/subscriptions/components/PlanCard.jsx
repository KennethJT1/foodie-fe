import { Check } from 'lucide-react';

import { Badge, Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatNaira } from '@/lib/format';

import { planFeatures, priceFor, yearlySaving } from '../lib/plans';

/** One plan: price for the chosen billing period, what it includes and its action button. */
export function PlanCard({ plan, interval, isCurrent = false, action, className }) {
  const isYearly = interval === 'yearly';
  return (
    <Card
      as="article"
      aria-labelledby={`plan-${plan.id}`}
      className={cn(
        'flex flex-col border-2',
        plan.isPopular ? 'border-primary' : 'border-transparent',
        isCurrent && 'border-secondary',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id={`plan-${plan.id}`} className="text-lg font-semibold">
          {plan.name}
        </h2>
        {isCurrent ? (
          <Badge tone="success">Your plan</Badge>
        ) : (
          plan.isPopular && <Badge tone="brand">Most popular</Badge>
        )}
      </div>
      <p className="mt-3">
        <span className="text-3xl font-bold">{formatNaira(priceFor(plan, interval))}</span>
        <span className="text-sm text-ink-muted">{isYearly ? ' / year' : ' / month'}</span>
      </p>
      <p className="min-h-[20px] text-sm text-ink-muted">
        {isYearly
          ? `${formatNaira(Math.round(plan.yearlyPrice / 12))} a month · save ${formatNaira(yearlySaving(plan))}`
          : 'Billed every month'}
      </p>
      <ul className="my-5 flex-1 space-y-2 text-sm">
        {planFeatures(plan).map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
      {action}
    </Card>
  );
}
