import { CheckCircle2 } from 'lucide-react';

import { Card, CardTitle } from '@/components/ui';
import { ORDER_STATUS } from '@/constants/order-status';

import { RateTarget } from './RateTarget';

/** After delivery, asks the customer to rate the vendor and the rider (verified orders only). */
export function RateOrderCard({ order }) {
  if (order.status !== ORDER_STATUS.DELIVERED) return null;
  const needsVendor = !order.ratedVendor;
  const needsRider = Boolean(order.riderId) && !order.ratedRider;
  const done = !needsVendor && !needsRider;

  return (
    <Card header={<CardTitle title={done ? 'Thanks for rating' : 'How was it?'} />}>
      {done ? (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <CheckCircle2 className="h-4 w-4 text-secondary" aria-hidden="true" />
          Your ratings help other customers and reward great vendors and riders.
        </p>
      ) : (
        <div className="space-y-6">
          {needsVendor && (
            <RateTarget orderId={order.id} targetType="vendor" name={order.vendorName} />
          )}
          {needsRider && (
            <RateTarget orderId={order.id} targetType="rider" name={order.rider?.name ?? 'rider'} />
          )}
        </div>
      )}
    </Card>
  );
}
