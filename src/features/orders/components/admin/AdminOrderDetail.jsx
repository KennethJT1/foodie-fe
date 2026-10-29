import { SearchX } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader, Timeline } from '@/components/data';
import { EmptyState, ErrorState, Skeleton, SkeletonText } from '@/components/feedback';
import { Button, Card, CardTitle } from '@/components/ui';
import { ORDER_STATUS } from '@/constants/order-status';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTES } from '@/constants/routes';
import { Can } from '@/features/auth';
import { useOrderLive } from '@/features/tracking';
import { formatDateTime, formatOrderNumber, formatPhone } from '@/lib/format';

import { ReassignRiderDialog } from './ReassignRiderDialog';
import { useOrder } from '../../hooks/useOrders';
import { orderTimeline } from '../../lib/timeline';
import { OrderStatusBadge } from '../OrderStatusBadge';
import { OrderTotals } from '../OrderTotals';

const REASSIGNABLE = [ORDER_STATUS.READY_FOR_PICKUP, ORDER_STATUS.RIDER_ASSIGNED];

function Party({ title, name, phone, children }) {
  return (
    <Card header={<CardTitle title={title} />} className="text-sm">
      <p className="font-medium">{name ?? '—'}</p>
      {phone && (
        <a href={`tel:${phone}`} className="text-primary-700 hover:underline">
          {formatPhone(phone)}
        </a>
      )}
      {children}
    </Card>
  );
}

/** Any order for support and dispatch: parties, money, history, payment and rider reassignment. */
export function AdminOrderDetail({ id }) {
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  useOrderLive(id, { enabled: Boolean(order?.isActive) });
  const [isReassigning, setReassigning] = useState(false);

  if (isLoading)
    return (
      <div role="status" aria-label="Loading order" className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <SkeletonText lines={8} />
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
              <Link to={ROUTES.admin.orders}>All orders</Link>
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
        description={`Placed ${formatDateTime(order.createdAt)}`}
        backTo={ROUTES.admin.orders}
        backLabel="Orders"
        actions={
          REASSIGNABLE.includes(order.status) && (
            <Can permission={PERMISSIONS.ORDERS_REASSIGN}>
              <Button onClick={() => setReassigning(true)}>
                {order.rider ? 'Reassign rider' : 'Assign a rider'}
              </Button>
            </Can>
          )
        }
      >
        <OrderStatusBadge status={order.status} />
      </PageHeader>
      {order.cancelReason && <p className="text-sm text-ink-muted">Reason: {order.cancelReason}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        <Party title="Customer" name={order.customerName} phone={order.customerPhone}>
          <p className="text-ink-muted">
            {[order.address.line1, order.address.area, order.address.city]
              .filter(Boolean)
              .join(', ')}
          </p>
          {order.deliveryCode && <p className="mt-1">Delivery code {order.deliveryCode}</p>}
        </Party>
        <Party title="Vendor" name={order.vendor?.name} phone={order.vendor?.phone}>
          {order.vendor && (
            <Link
              to={ROUTES.admin.vendor(order.vendor.id)}
              className="mt-1 block text-primary-700 hover:underline"
            >
              Vendor details
            </Link>
          )}
        </Party>
        <Party
          title="Rider"
          name={order.rider?.name ?? 'Not assigned yet'}
          phone={order.rider?.phone}
        >
          {order.rider && (
            <Link
              to={ROUTES.admin.rider(order.rider.id)}
              className="mt-1 block text-primary-700 hover:underline"
            >
              Rider details
            </Link>
          )}
        </Party>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <Card header={<CardTitle title="History" />}>
          <Timeline items={orderTimeline(order, { describe: false })} live={order.isActive} />
        </Card>
        <div className="space-y-4">
          <Card header={<CardTitle title="Money" />}>
            <OrderTotals order={order} />
          </Card>
          {order.payment && (
            <Card header={<CardTitle title="Payment" />} className="text-sm">
              <p>Reference {order.payment.reference}</p>
              <p className="text-ink-muted">
                {order.payment.channel} · {order.payment.status}
              </p>
            </Card>
          )}
          {order.refund && (
            <Button asChild variant="outline">
              <Link to={ROUTES.admin.refund(order.refund.id)}>View refund request</Link>
            </Button>
          )}
        </div>
      </div>
      {isReassigning && (
        <ReassignRiderDialog order={order} open onClose={() => setReassigning(false)} />
      )}
    </div>
  );
}
