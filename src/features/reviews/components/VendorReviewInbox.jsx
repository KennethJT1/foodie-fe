import { Star } from 'lucide-react';

import { Pagination } from '@/components/data';
import { EmptyState, ErrorState, SkeletonText, toast } from '@/components/feedback';
import { ReplyForm } from '@/components/forms';
import { Card, Rating } from '@/components/ui';
import { useTableQuery } from '@/hooks/useTableQuery';
import { formatDate } from '@/lib/format';

import { useReplyToReview, useReviews } from '../hooks/useReviews';

/** Reviews of the vendor's store, each with a one-time public reply. */
export function VendorReviewInbox({ vendorId }) {
  const table = useTableQuery({ defaults: { limit: 10, sort: '-createdAt' } });
  const params = { targetType: 'vendor', targetId: vendorId, page: table.params.page, limit: 10 };
  const { data, isLoading, isError, error, refetch } = useReviews(params);
  const reply = useReplyToReview();

  if (isLoading) return <SkeletonText lines={6} />;
  if (isError)
    return <ErrorState title="We couldn't load your reviews" error={error} onRetry={refetch} />;
  if (!data.data.length)
    return (
      <EmptyState
        icon={Star}
        title="No reviews yet"
        message="Customers can rate your store after each delivery."
      />
    );
  return (
    <div className="space-y-3">
      {data.data.map((r) => (
        <Card key={r.id} as="article" padding="sm" className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{r.userName}</p>
            <span className="text-xs text-ink-muted">{formatDate(r.createdAt)}</span>
          </div>
          <Rating value={r.rating} readOnly size="sm" />
          {r.comment && <p className="text-sm">{r.comment}</p>}
          {r.reply ? (
            <p className="rounded-lg bg-surface-muted p-2 text-sm">
              <span className="font-medium">Your reply: </span>
              {r.reply.body}
            </p>
          ) : (
            <ReplyForm
              label={`Reply to ${r.userName}`}
              onSubmit={(body) =>
                reply.mutateAsync({ id: r.id, body }).then(() => toast.success('Reply posted'))
              }
            />
          )}
        </Card>
      ))}
      <Pagination meta={data.meta} onPageChange={table.setPage} />
    </div>
  );
}
