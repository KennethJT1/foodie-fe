import { MapPin, Phone, SearchX } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader, Timeline } from '@/components/data';
import { EmptyState, ErrorState, Skeleton, SkeletonText } from '@/components/feedback';
import { Avatar, Button, Card, CardTitle } from '@/components/ui';
import { getOrderStatusMeta, ORDER_STATUS } from '@/constants/order-status';
import { ROUTES } from '@/constants/routes';
import { NewCartDialog } from '@/features/cart';
import { formatDateTime, formatEta, formatOrderNumber } from '@/lib/format';

import { CancelOrderDialog } from './CancelOrderDialog';
import { OrderReceipt } from './OrderReceipt';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderTotals } from './OrderTotals';
import { useOrder, useReorder } from '../hooks/useOrders';
import { orderTimeline } from '../lib/timeline';

/**
 * Customer order detail: status, timeline, items, receipt, cancel and reorder.
 * `live` (tracking map), `afterStatus` and `actions` are slots other features fill.
 */
export function OrderDetail({ id, live, afterStatus, actions }) {
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  const [showReceipt, setShowReceipt] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { reorder, isLoading: reordering, dialog } = useReorder();

  if (isLoading) return <OrderDetailSkeleton />;
  if (isError) {
    if (error?.status === 404)
      return (
        <EmptyState
          icon={SearchX}
          title="We couldn't find that order"
          action={
            <Button asChild>
              <Link to={ROUTES.account.orders}>See your orders</Link>
            </Button>
          }
        />
      );
    return <ErrorState title="We couldn't load this order" error={error} onRetry={refetch} />;
  }

  const meta = getOrderStatusMeta(order.status);
  const render = (slot) => (typeof slot === 'function' ? slot(order) : slot);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Order ${formatOrderNumber(order.code)}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        backTo={ROUTES.account.orders}
        backLabel="Orders"
        actions={
          <>
            {render(actions)}
            <Button variant="outline" size="sm" onClick={() => setShowReceipt(true)}>
              View receipt
            </Button>
            <Button variant="outline" size="sm" loading={reordering} onClick={() => reorder(order)}>
              Reorder
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <OrderStatusBadge status={order.status} />
              {order.isActive && (
                <span className="text-sm text-ink-muted">
                  {order.scheduledFor
                    ? `Scheduled for ${formatDateTime(order.scheduledFor)}`
                    : `Arrives in about ${formatEta(order.etaMins?.[0], order.etaMins?.[1])}`}
                </span>
              )}
            </div>
            <p className="text-lg font-semibold" aria-live="polite">
              {meta.customer}
            </p>
            {order.cancelReason && (
              <p className="text-sm text-ink-muted">Reason: {order.cancelReason}</p>
            )}
            {order.isActive && order.deliveryCode && (
              <div className="rounded-lg bg-primary-50 p-3">
                <p className="text-sm text-ink-muted">Delivery code</p>
                <p className="font-mono text-2xl font-semibold tracking-[0.3em]">
                  {order.deliveryCode}
                </p>
                <p className="text-xs text-ink-muted">
                  Give this code to the rider only when your food arrives.
                </p>
              </div>
            )}
            {order.status === ORDER_STATUS.PAID && (
              <Button variant="danger" size="sm" onClick={() => setCancelling(true)}>
                Cancel order
              </Button>
            )}
          </Card>

          {render(live)}
          {render(afterStatus)}

          <Card header={<CardTitle title="Progress" />}>
            <Timeline items={orderTimeline(order)} live={order.isActive} />
          </Card>
        </div>

        <div className="space-y-4">
          <Card header={<CardTitle title="Your food" />}>
            <OrderTotals order={order} />
          </Card>
          <Card header={<CardTitle title="Delivery" />} className="text-sm">
            <div className="space-y-3">
              <p className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                {[order.address.line1, order.address.area, order.address.city]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {order.deliveryNote && <p className="text-ink-muted">Note: {order.deliveryNote}</p>}
              {order.vendor && (
                <div className="flex items-center gap-3 border-t border-surface-border pt-3">
                  <Avatar
                    src={order.vendor.logo}
                    name={order.vendor.name}
                    size="sm"
                    shape="square"
                  />
                  <Link
                    to={ROUTES.storefront(order.vendor.slug)}
                    className="flex-1 font-medium hover:text-primary-700"
                  >
                    {order.vendor.name}
                  </Link>
                  {order.vendor.phone && (
                    <a
                      href={`tel:${order.vendor.phone}`}
                      aria-label={`Call ${order.vendor.name}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-primary-50"
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <OrderReceipt order={order} open={showReceipt} onClose={() => setShowReceipt(false)} />
      <CancelOrderDialog order={order} open={cancelling} onClose={() => setCancelling(false)} />
      <NewCartDialog {...dialog} />
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading order" className="space-y-4">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-32 w-full rounded-card" />
      <SkeletonText lines={6} />
    </div>
  );
}
