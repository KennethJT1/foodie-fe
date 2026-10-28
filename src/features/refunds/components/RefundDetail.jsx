import { SearchX } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader, Timeline } from '@/components/data';
import { EmptyState, ErrorState, Skeleton, SkeletonText, toast } from '@/components/feedback';
import { Button, Card, CardTitle, StatusBadge } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { REFUND_STATUS_META } from '@/constants/statuses';
import { formatDateTime, formatNaira, formatOrderNumber } from '@/lib/format';

import { DisputeDialog } from './DisputeDialog';
import { useConfirmRefund, useRefund } from '../hooks/useRefunds';
import { refundTimeline } from '../lib/timeline';

/** A refund request with its history; the customer confirms receipt or disputes. */
export function RefundDetail({ id }) {
  const { data: refund, isLoading, isError, error, refetch } = useRefund(id);
  const confirm = useConfirmRefund();
  const [disputing, setDisputing] = useState(false);

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading refund" className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <SkeletonText lines={6} />
      </div>
    );
  }
  if (isError) {
    if (error?.status === 404)
      return (
        <EmptyState
          icon={SearchX}
          title="We couldn't find that refund"
          action={
            <Button asChild>
              <Link to={ROUTES.account.refunds}>See your refunds</Link>
            </Button>
          }
        />
      );
    return <ErrorState title="We couldn't load this refund" error={error} onRetry={refetch} />;
  }

  const response = refund.vendorResponse;
  return (
    <div className="space-y-4">
      <PageHeader
        title={`Refund for ${formatOrderNumber(refund.orderCode)}`}
        description={`${refund.vendorName} · requested ${formatDateTime(refund.createdAt)}`}
        backTo={ROUTES.account.refunds}
        backLabel="Refunds"
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge status={refund.status} meta={REFUND_STATUS_META} />
              <span className="text-lg font-semibold">{formatNaira(refund.amount)}</span>
            </div>
            {refund.status === 'requested' && (
              <p className="text-sm text-ink-muted">
                {refund.vendorName} should respond by {formatDateTime(refund.deadline)}. If they
                don&apos;t, KJT Foodie steps in.
              </p>
            )}
            {refund.status === 'paid' && (
              <div className="space-y-2" aria-live="polite">
                <p className="text-sm">
                  The vendor says they have paid
                  {refund.paymentReference ? ` (reference ${refund.paymentReference})` : ''}. Did
                  you get it?
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    loading={confirm.isPending}
                    onClick={() =>
                      confirm.mutate(refund.id, {
                        onSuccess: () => toast.success('Thanks. This refund is now closed.'),
                        onError: (e) => toast.error(e),
                      })
                    }
                  >
                    Yes, I got it
                  </Button>
                  <Button variant="outline" onClick={() => setDisputing(true)}>
                    I didn&apos;t get it
                  </Button>
                </div>
              </div>
            )}
            {refund.status === 'rejected' && (
              <Button variant="outline" onClick={() => setDisputing(true)}>
                Dispute this decision
              </Button>
            )}
          </Card>
          <Card header={<CardTitle title="History" />}>
            <Timeline items={refundTimeline(refund)} live />
          </Card>
        </div>
        <div className="space-y-4">
          <Card header={<CardTitle title="Your request" />} className="text-sm">
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
          </Card>
          {response && (
            <Card header={<CardTitle title="Vendor's answer" />} className="text-sm">
              <p className="font-medium">
                {response.decision === 'accepted'
                  ? `Accepted ${formatNaira(response.amount)}`
                  : 'Declined'}
              </p>
              {response.reason && <p className="text-ink-muted">{response.reason}</p>}
            </Card>
          )}
          <Button asChild variant="ghost">
            <Link to={ROUTES.account.order(refund.orderId)}>View the order</Link>
          </Button>
        </div>
      </div>
      <DisputeDialog refund={refund} open={disputing} onClose={() => setDisputing(false)} />
    </div>
  );
}
