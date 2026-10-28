import { Bike, StickyNote } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card } from '@/components/ui';
import { ORDER_STATUS } from '@/constants/order-status';
import { ROUTES } from '@/constants/routes';
import { useOrderLive } from '@/features/tracking';
import { formatNaira, formatOrderNumber, formatRelative, formatTime } from '@/lib/format';

import { AcceptCountdown } from './AcceptCountdown';
import { VendorOrderActions } from './VendorOrderActions';
import { OrderStatusBadge } from '../OrderStatusBadge';

/** One order in the live queue: what to cook, the timer and the next action. */
export function VendorOrderCard({ order, onExpire }) {
  const S = ORDER_STATUS;
  // Ready orders stay live so the vendor sees the rider being assigned
  useOrderLive(order.id, {
    enabled: [S.READY_FOR_PICKUP, S.RIDER_ASSIGNED].includes(order.status),
  });
  return (
    <Card
      as="article"
      padding="sm"
      aria-label={`Order ${formatOrderNumber(order.code)}`}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            to={ROUTES.vendor.order(order.id)}
            className="font-semibold text-ink hover:text-primary-700 hover:underline"
          >
            {formatOrderNumber(order.code)}
          </Link>
          <p className="text-xs text-ink-muted">
            {order.customerName} · {formatRelative(order.createdAt)}
            {order.scheduledFor && ` · for ${formatTime(order.scheduledFor)}`}
          </p>
        </div>
        {order.status === S.PAID ? (
          <AcceptCountdown deadline={order.acceptDeadline} onExpire={onExpire} />
        ) : (
          <OrderStatusBadge status={order.status} />
        )}
      </div>
      <ul className="space-y-1 text-sm">
        {order.items.map((l, i) => (
          <li key={`${l.foodItemId}-${i}`}>
            <span className="font-semibold">{l.quantity} ×</span> {l.name}
            {l.options.length > 0 && (
              <span className="block pl-5 text-xs text-ink-muted">
                {l.options.map((o) => o.name).join(', ')}
              </span>
            )}
          </li>
        ))}
      </ul>
      {order.deliveryNote && (
        <p className="flex gap-1.5 rounded-lg bg-surface-muted p-2 text-xs">
          <StickyNote className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {order.deliveryNote}
        </p>
      )}
      {[S.READY_FOR_PICKUP, S.RIDER_ASSIGNED].includes(order.status) && (
        <p className="flex items-center gap-1.5 text-sm text-ink-muted" aria-live="polite">
          <Bike className="h-4 w-4 shrink-0" aria-hidden="true" />
          {order.riderName ? `${order.riderName} is on the way to pick it up` : 'Finding a rider…'}
        </p>
      )}
      <div className="flex items-center justify-between gap-2 border-t border-surface-border pt-3">
        <span className="text-sm">
          You get <strong>{formatNaira(order.subtotal)}</strong>
        </span>
        <span className="text-xs text-ink-muted">{order.itemCount} items</span>
      </div>
      <VendorOrderActions order={order} size="sm" />
    </Card>
  );
}
