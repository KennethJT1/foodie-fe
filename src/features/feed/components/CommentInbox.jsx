import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Pagination } from '@/components/data';
import { EmptyState, ErrorState, SkeletonText, toast } from '@/components/feedback';
import { ReplyForm } from '@/components/forms';
import { Card, Tabs } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { formatRelative } from '@/lib/format';

import { useReplyToComment, useVendorComments } from '../hooks/useFeed';

const FILTERS = [
  { value: 'false', label: 'Waiting for you' },
  { value: 'true', label: 'Answered' },
];

/** Customers' comments on the vendor's dishes, newest first, with a reply box. */
export function CommentInbox() {
  const [answered, setAnswered] = useState('false');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useVendorComments({
    answered,
    page,
    limit: 10,
    sort: '-createdAt',
  });
  const reply = useReplyToComment();

  return (
    <div className="space-y-3">
      <Tabs
        variant="pills"
        aria-label="Comment filter"
        items={FILTERS}
        value={answered}
        onChange={(v) => {
          setAnswered(v);
          setPage(1);
        }}
      />
      {isLoading ? (
        <SkeletonText lines={6} />
      ) : isError ? (
        <ErrorState title="We couldn't load comments" error={error} onRetry={refetch} />
      ) : !data.data.length ? (
        <EmptyState
          icon={MessageCircle}
          title={answered === 'false' ? "You're all caught up" : 'No answered comments yet'}
          message="Comments customers leave on your dishes show up here."
        />
      ) : (
        <>
          {data.data.map((c) => (
            <Card key={c.id} as="article" padding="sm" className="space-y-2">
              <p className="text-xs text-ink-muted">
                <span className="font-medium text-ink">{c.authorName}</span> on{' '}
                <Link to={ROUTES.food(c.foodItemId)} className="text-primary-700 hover:underline">
                  {c.foodItemName}
                </Link>{' '}
                · {formatRelative(c.createdAt)}
              </p>
              <p className="text-sm">{c.body}</p>
              {c.reply ? (
                <p className="rounded-lg bg-surface-muted p-2 text-sm">
                  <span className="font-medium">Your reply: </span>
                  {c.reply.body}
                </p>
              ) : (
                <ReplyForm
                  label={`Reply to ${c.authorName}`}
                  onSubmit={(body) =>
                    reply
                      .mutateAsync({ foodItemId: c.foodItemId, parentId: c.id, body })
                      .then(() => toast.success('Reply posted'))
                  }
                />
              )}
            </Card>
          ))}
          <Pagination meta={data.meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
