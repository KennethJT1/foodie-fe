import { Star } from 'lucide-react';

import { EmptyState, ErrorState, SkeletonText } from '@/components/feedback';
import { Avatar, Rating } from '@/components/ui';
import { formatRelative } from '@/lib/format';

import { useReviews } from '../hooks/useReviews';

/** Latest reviews for a vendor or rider. */
export function VendorReviews({ targetId, targetType = 'vendor', limit = 5 }) {
  const { data, isLoading, isError, error, refetch } = useReviews({
    targetType,
    targetId,
    limit,
    sort: '-createdAt',
  });
  return (
    <section aria-labelledby="reviews-title" className="space-y-3">
      <h2 id="reviews-title" className="text-lg font-semibold">
        Reviews{data ? ` (${data.meta.total})` : ''}
      </h2>
      {isLoading ? (
        <SkeletonText lines={4} />
      ) : isError ? (
        <ErrorState compact title="We couldn't load reviews" error={error} onRetry={refetch} />
      ) : !data.data.length ? (
        <EmptyState
          compact
          icon={Star}
          title="No reviews yet"
          message="Reviews appear after customers receive their orders."
        />
      ) : (
        <ul className="divide-y divide-surface-border rounded-card bg-surface px-4 shadow-card">
          {data.data.map((r) => (
            <li key={r.id} className="flex gap-3 py-3">
              <Avatar name={r.userName} size="sm" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{r.userName}</span>
                  <Rating value={r.rating} readOnly size="sm" />
                  <span className="text-xs text-ink-muted">{formatRelative(r.createdAt)}</span>
                </div>
                {r.comment && <p className="text-sm">{r.comment}</p>}
                {r.reply && (
                  <p className="rounded-lg bg-primary-50 p-2 text-sm">
                    <span className="font-medium">Vendor reply: </span>
                    {r.reply}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
