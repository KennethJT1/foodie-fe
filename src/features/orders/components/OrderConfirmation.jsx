import { Link } from 'react-router-dom';

import { ErrorState, SkeletonText } from '@/components/feedback';
import { Button, Card } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { formatDateTime, formatEta, formatNaira, formatOrderNumber } from '@/lib/format';

import { useOrder } from '../hooks/useOrders';

/** Full confirmation screen after payment (content guidelines: success → full screen). */
export function OrderConfirmation({ id }) {
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  if (isLoading) return <SkeletonText lines={5} />;
  if (isError)
    return <ErrorState title="We couldn't load your order" error={error} onRetry={refetch} />;
  return (
    <Card className="mx-auto max-w-md space-y-4 text-center">
      <p className="text-5xl" aria-hidden="true">
        🎉
      </p>
      <h1 className="text-2xl font-semibold">Order placed</h1>
      <p className="text-ink-muted">
        We sent order {formatOrderNumber(order.code)} to {order.vendorName}. You&apos;ll get an
        update as soon as they accept it.
      </p>
      <dl className="grid grid-cols-2 gap-2 rounded-lg bg-primary-50 p-3 text-left text-sm">
        <dt className="text-ink-muted">Paid</dt>
        <dd className="text-right font-semibold">{formatNaira(order.total)}</dd>
        <dt className="text-ink-muted">{order.scheduledFor ? 'Scheduled for' : 'Arrives in'}</dt>
        <dd className="text-right font-semibold">
          {order.scheduledFor
            ? formatDateTime(order.scheduledFor)
            : formatEta(order.etaMins?.[0], order.etaMins?.[1])}
        </dd>
      </dl>
      <div className="flex flex-col gap-2">
        <Button asChild size="lg">
          <Link to={ROUTES.account.order(order.id)}>Track your order</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to={ROUTES.home}>Keep browsing</Link>
        </Button>
      </div>
    </Card>
  );
}
