import { Bike, Phone, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PageHeader, Timeline } from '@/components/data';
import { EmptyState, ErrorState, Skeleton, SkeletonText } from '@/components/feedback';
import { MapView } from '@/components/maps';
import { Button, Card, CardTitle } from '@/components/ui';
import { ORDER_STATUS } from '@/constants/order-status';
import { ROUTES } from '@/constants/routes';
import { useOrderLive } from '@/features/tracking';
import {
  formatDateTime,
  formatDistance,
  formatNaira,
  formatOrderNumber,
  formatPhone,
} from '@/lib/format';
import { distanceBetween } from '@/lib/geo';

import { AcceptCountdown } from './AcceptCountdown';
import { VendorOrderActions } from './VendorOrderActions';
import { useOrder } from '../../hooks/useOrders';
import { orderTimeline } from '../../lib/timeline';
import { OrderStatusBadge } from '../OrderStatusBadge';

const S = ORDER_STATUS;

function RiderCard({ order }) {
  const { rider, vendor } = order;
  const isComing = order.status === S.RIDER_ASSIGNED;
  const hasPosition = rider.lat != null && vendor?.lat != null;
  return (
    <Card header={<CardTitle title={isComing ? 'Rider on the way to you' : 'Rider'} />}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            <Bike className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="font-medium">{rider.name}</p>
            <p className="text-sm text-ink-muted" aria-live="polite">
              {isComing && hasPosition
                ? `${formatDistance(distanceBetween(rider, vendor))} from your store`
                : order.status === S.PICKED_UP
                  ? 'Picked up. On the way to the customer.'
                  : rider.plateNumber}
            </p>
          </div>
          {rider.phone && (
            <a
              href={`tel:${rider.phone}`}
              aria-label={`Call ${rider.name}`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-primary-50"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </div>
        {isComing && hasPosition && (
          <MapView
            height={200}
            label="Rider location"
            center={{ lat: vendor.lat, lng: vendor.lng }}
            markers={[
              {
                id: 'vendor',
                kind: 'vendor',
                label: vendor.name,
                position: { lat: vendor.lat, lng: vendor.lng },
              },
              {
                id: 'rider',
                kind: 'rider',
                label: `Rider ${rider.name}`,
                isActive: true,
                position: { lat: rider.lat, lng: rider.lng },
              },
            ]}
            route={[
              { lat: rider.lat, lng: rider.lng },
              { lat: vendor.lat, lng: vendor.lng },
            ]}
          />
        )}
      </div>
    </Card>
  );
}

/** One order for the vendor: what to cook, the next step, the rider and the history. */
export function VendorOrderDetail({ id }) {
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  useOrderLive(id, { enabled: Boolean(order?.isActive) });

  if (isLoading)
    return (
      <div role="status" aria-label="Loading order" className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full rounded-card" />
        <SkeletonText lines={6} />
      </div>
    );
  if (isError) {
    if (error?.status === 404)
      return (
        <EmptyState
          icon={SearchX}
          title="We couldn't find that order"
          action={
            <Button asChild>
              <Link to={ROUTES.vendor.orders}>Back to live orders</Link>
            </Button>
          }
        />
      );
    return <ErrorState title="We couldn't load this order" error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Order ${formatOrderNumber(order.code)}`}
        description={`Placed ${formatDateTime(order.createdAt)}${order.scheduledFor ? ` · for ${formatDateTime(order.scheduledFor)}` : ''}`}
        backTo={order.isActive ? ROUTES.vendor.orders : ROUTES.vendor.orderHistory}
        backLabel={order.isActive ? 'Live orders' : 'Order history'}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <OrderStatusBadge status={order.status} />
              {order.status === S.PAID && (
                <AcceptCountdown deadline={order.acceptDeadline} onExpire={refetch} />
              )}
            </div>
            {order.cancelReason && (
              <p className="text-sm text-ink-muted">Reason: {order.cancelReason}</p>
            )}
            <VendorOrderActions order={order} />
          </Card>
          {order.rider && [S.RIDER_ASSIGNED, S.PICKED_UP].includes(order.status) && (
            <RiderCard order={order} />
          )}
          <Card header={<CardTitle title="Items" />}>
            <ul className="divide-y divide-surface-border text-sm">
              {order.items.map((l, i) => (
                <li key={`${l.foodItemId}-${i}`} className="flex justify-between gap-3 py-2">
                  <span>
                    <span className="font-semibold">{l.quantity} ×</span> {l.name}
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
            <div className="mt-2 flex justify-between border-t border-surface-border pt-3 font-semibold">
              <span>You get</span>
              <span>{formatNaira(order.subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Paid straight to your bank account the next working day. The delivery fee goes to KJT
              Foodie.
            </p>
          </Card>
        </div>
        <div className="space-y-4">
          <Card header={<CardTitle title="Customer" />} className="text-sm">
            <div className="space-y-2">
              <p className="font-medium">{order.customerName}</p>
              {order.customerPhone && (
                <a href={`tel:${order.customerPhone}`} className="text-primary-700 hover:underline">
                  {formatPhone(order.customerPhone)}
                </a>
              )}
              <p className="text-ink-muted">
                {[order.address.area, order.address.city].filter(Boolean).join(', ')}
              </p>
              {order.deliveryNote && <p>Note: {order.deliveryNote}</p>}
            </div>
          </Card>
          <Card header={<CardTitle title="Progress" />}>
            <Timeline items={orderTimeline(order, { describe: false })} live={order.isActive} />
          </Card>
        </div>
      </div>
    </div>
  );
}
