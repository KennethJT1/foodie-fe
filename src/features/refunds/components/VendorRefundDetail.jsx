import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PageHeader, Timeline } from '@/components/data';
import { EmptyState, ErrorState, Skeleton, SkeletonText } from '@/components/feedback';
import { Button, Card, CardTitle, StatusBadge } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { REFUND_STATUS_META } from '@/constants/statuses';
import { formatDateTime, formatNaira, formatOrderNumber } from '@/lib/format';

import { MarkRefundPaid, RespondToRefund } from './RespondToRefund';
import { useRefund } from '../hooks/useRefunds';
import { refundTimeline } from '../lib/timeline';

/** A refund request on the vendor's order: the claim, the deadline and the next step. */
export function VendorRefundDetail({ id }) {
  const { data: refund, isLoading, isError, error, refetch } = useRefund(id);

  if (isLoading)
    return (
      <div role="status" aria-label="Loading refund" className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <SkeletonText lines={6} />
      </div>
    );
  if (isError) {
    if (error?.status === 404)
      return (
        <EmptyState
          icon={SearchX}
          title="We couldn't find that refund"
          action={
            <Button asChild>
              <Link to={ROUTES.vendor.refunds}>See refund requests</Link>
            </Button>
          }
        />
      );
    return <ErrorState title="We couldn't load this refund" error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Refund for ${formatOrderNumber(refund.orderCode)}`}
        description={`${refund.customerName} · requested ${formatDateTime(refund.createdAt)}`}
        backTo={ROUTES.vendor.refunds}
        backLabel="Refunds"
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge status={refund.status} meta={REFUND_STATUS_META} />
              <span className="text-lg font-semibold">{formatNaira(refund.amount)}</span>
            </div>
            {refund.status === 'requested' && <RespondToRefund refund={refund} />}
            {refund.status === 'accepted' && <MarkRefundPaid refund={refund} />}
            {refund.status === 'paid' && (
              <p className="text-sm text-ink-muted">
                Waiting for {refund.customerName} to confirm they got it (reference{' '}
                {refund.paymentReference}).
              </p>
            )}
          </Card>
          <Card header={<CardTitle title="History" />}>
            <Timeline items={refundTimeline(refund)} live />
          </Card>
        </div>
        <Card header={<CardTitle title="The customer's request" />} className="text-sm">
          <dl className="space-y-2">
            <div>
              <dt className="text-ink-muted">Reason</dt>
              <dd>{refund.reason}</dd>
            </div>
            {refund.details && (
              <div>
                <dt className="text-ink-muted">Details</dt>
                <dd>{refund.details}</dd>
              </div>
            )}
            <div>
              <dt className="text-ink-muted">Food subtotal</dt>
              <dd>{formatNaira(refund.orderSubtotal)}</dd>
            </div>
          </dl>
          {refund.photos?.length > 0 && (
            <ul className="mt-3 grid grid-cols-3 gap-2">
              {refund.photos.map((p, i) => (
                <li key={p.slice(-24) + i}>
                  <img
                    src={p}
                    alt={`Refund evidence ${i + 1} for ${formatOrderNumber(refund.orderCode)}`}
                    loading="lazy"
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="ghost" className="mt-3">
            <Link to={ROUTES.vendor.order(refund.orderId)}>View the order</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
