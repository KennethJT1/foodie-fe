import { SearchX } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader, Timeline } from '@/components/data';
import {
  EmptyState,
  ErrorState,
  ReasonDialog,
  Skeleton,
  SkeletonText,
  toast,
} from '@/components/feedback';
import { ReplyForm } from '@/components/forms';
import { Button, Card, CardTitle, StatusBadge } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTES } from '@/constants/routes';
import { REFUND_STATUS_META } from '@/constants/statuses';
import { Can } from '@/features/auth';
import { formatDateTime, formatNaira, formatOrderNumber } from '@/lib/format';

import { useCommentOnRefund, useEscalateRefund, useRefund } from '../hooks/useRefunds';
import { refundTimeline } from '../lib/timeline';

/**
 * A refund for the support team: full timeline, both sides, internal comments and escalation.
 * Admins can't move vendor money (BR-REF-05).
 */
export function AdminRefundDetail({ id }) {
  const { data: refund, isLoading, isError, error, refetch } = useRefund(id);
  const comment = useCommentOnRefund();
  const escalate = useEscalateRefund();
  const [isEscalating, setEscalating] = useState(false);

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
              <Link to={ROUTES.admin.refunds}>All refunds</Link>
            </Button>
          }
        />
      );
    return <ErrorState title="We couldn't load this refund" error={error} onRetry={refetch} />;
  }

  const canEscalate = !['confirmed', 'escalated'].includes(refund.status);
  return (
    <div className="space-y-4">
      <PageHeader
        title={`Refund for ${formatOrderNumber(refund.orderCode)}`}
        description={`${refund.customerName} → ${refund.vendorName} · requested ${formatDateTime(refund.createdAt)}`}
        backTo={ROUTES.admin.refunds}
        backLabel="Refunds"
        actions={
          canEscalate && (
            <Can permission={PERMISSIONS.REFUNDS_ESCALATE}>
              <Button variant="danger" onClick={() => setEscalating(true)}>
                Escalate refund
              </Button>
            </Can>
          )
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={refund.status} meta={REFUND_STATUS_META} />
          <span className="font-semibold">{formatNaira(refund.amount)}</span>
          {refund.status === 'requested' && (
            <span className="text-sm text-ink-muted">
              Vendor must answer by {formatDateTime(refund.deadline)}
            </span>
          )}
        </div>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-4">
          <Card header={<CardTitle title="Timeline" />}>
            <Timeline items={refundTimeline(refund)} />
          </Card>
          <Card
            header={
              <CardTitle title="Team comments" description="Only KJT Foodie staff see these." />
            }
          >
            {refund.comments.length > 0 && (
              <ul className="mb-4 space-y-3 text-sm">
                {refund.comments.map((c) => (
                  <li key={c.id} className="rounded-lg bg-surface-muted p-3">
                    <p className="text-xs text-ink-muted">
                      {c.authorName} · {formatDateTime(c.createdAt)}
                    </p>
                    <p>{c.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <ReplyForm
              label="Add a comment"
              submitLabel="Add comment"
              onSubmit={(body) =>
                comment
                  .mutateAsync({ id: refund.id, body })
                  .then(() => toast.success('Comment added'))
              }
            />
          </Card>
        </div>
        <div className="space-y-4">
          <Card header={<CardTitle title="Customer's request" />} className="text-sm">
            <p className="font-medium">{refund.reason}</p>
            {refund.details && <p className="text-ink-muted">{refund.details}</p>}
            <p className="mt-2">Food subtotal {formatNaira(refund.orderSubtotal)}</p>
            {refund.photos?.length > 0 && (
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {refund.photos.map((p, i) => (
                  <li key={p.slice(-24) + i}>
                    <img
                      src={p}
                      alt={`Refund evidence ${i + 1}`}
                      loading="lazy"
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card header={<CardTitle title="Vendor's answer" />} className="text-sm">
            {refund.vendorResponse ? (
              <>
                <p className="font-medium">
                  {refund.vendorResponse.decision === 'accepted'
                    ? `Accepted ${formatNaira(refund.vendorResponse.amount)}`
                    : 'Declined'}
                </p>
                {refund.vendorResponse.reason && (
                  <p className="text-ink-muted">{refund.vendorResponse.reason}</p>
                )}
                {refund.paymentReference && (
                  <p className="mt-1">Paid · reference {refund.paymentReference}</p>
                )}
              </>
            ) : (
              <p className="text-ink-muted">No answer yet.</p>
            )}
          </Card>
          <Button asChild variant="ghost">
            <Link to={ROUTES.admin.order(refund.orderId)}>View the order</Link>
          </Button>
        </div>
      </div>
      <ReasonDialog
        open={isEscalating}
        onClose={() => setEscalating(false)}
        title="Escalate this refund?"
        description="The vendor and customer are told our team has stepped in."
        label="Why are you escalating it?"
        confirmLabel="Escalate refund"
        onSubmit={(reason) =>
          escalate
            .mutateAsync({ id: refund.id, reason })
            .then(() => toast.success('Refund escalated'))
        }
      />
    </div>
  );
}
