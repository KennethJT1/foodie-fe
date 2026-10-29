import { cn } from '@/lib/cn';
import { formatNaira } from '@/lib/format';

/** Items and money breakdown of an order (kobo → ₦). */
export function OrderTotals({ order, className }) {
  return (
    <div className={cn('space-y-3 text-sm', className)}>
      <ul className="space-y-2">
        {order.items.map((l, i) => (
          <li key={`${l.foodItemId}-${i}`} className="flex justify-between gap-3">
            <span>
              {l.quantity} × {l.name}
              {l.options?.length > 0 && (
                <span className="block text-xs text-ink-muted">
                  {l.options.map((o) => o.name).join(', ')}
                </span>
              )}
            </span>
            <span>{formatNaira(l.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-1 border-t border-surface-border pt-3">
        {[
          ['Food subtotal', order.subtotal],
          ['Delivery fee', order.deliveryFee],
          ['Payment processing fee', order.processingFee],
        ].map(([label, amount]) => (
          <div key={label} className="flex justify-between">
            <dt className="text-ink-muted">{label}</dt>
            <dd>{formatNaira(amount)}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-surface-border pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatNaira(order.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
