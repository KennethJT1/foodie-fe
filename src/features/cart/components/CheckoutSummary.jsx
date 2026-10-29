import { AlertTriangle } from 'lucide-react';

import { SkeletonText } from '@/components/feedback';
import { Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDateTime, formatEta, formatNaira } from '@/lib/format';

/** Subtotal, delivery fee, processing fee, total and ETA from /checkout/quote (FR-ORD-02). */
export function CheckoutSummary({ quote, isLoading, error, isUpdating, className }) {
  return (
    <Card
      className={cn('space-y-3', className)}
      aria-busy={isUpdating || undefined}
      aria-labelledby="summary-title"
    >
      <h2 id="summary-title" className="text-base font-semibold">
        Order summary
      </h2>
      {error ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error.message}
        </p>
      ) : !quote ? (
        isLoading ? (
          <SkeletonText lines={4} />
        ) : (
          <p className="text-sm text-ink-muted">Pick a delivery address to see the total.</p>
        )
      ) : (
        <>
          <ul className="space-y-1 text-sm">
            {quote.lines.map((l) => (
              <li
                key={`${l.foodItemId}-${l.options.map((o) => o.optionId).join('-')}`}
                className="flex justify-between gap-3"
              >
                <span>
                  {l.quantity} × {l.name}
                  {l.options.length > 0 && (
                    <span className="block text-xs text-ink-muted">
                      {l.options.map((o) => o.name).join(', ')}
                    </span>
                  )}
                </span>
                <span>{formatNaira(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl
            className={cn(
              'space-y-1 border-t border-surface-border pt-3 text-sm',
              isUpdating && 'opacity-60',
            )}
          >
            <Row label="Food subtotal" value={formatNaira(quote.subtotal)} />
            <Row label="Delivery fee" value={formatNaira(quote.deliveryFee)} />
            <Row label="Payment processing fee" value={formatNaira(quote.processingFee)} />
            <div className="flex justify-between border-t border-surface-border pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatNaira(quote.total)}</dd>
            </div>
          </dl>
          <p className="text-sm text-ink-muted">
            {quote.scheduledFor
              ? `Scheduled for ${formatDateTime(quote.scheduledFor)}`
              : `Arrives in about ${formatEta(quote.etaMins[0], quote.etaMins[1])}`}
          </p>
        </>
      )}
    </Card>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
