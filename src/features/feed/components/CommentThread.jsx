import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { InfiniteList } from '@/components/data';
import { EmptyState, SkeletonText } from '@/components/feedback';
import { ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { useSession } from '@/features/auth';

import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { ReportDialog } from './ReportDialog';
import { useAddComment, useComments } from '../hooks/useFeed';

/** Comments on a food post with vendor replies and reporting (FR-SOC-04). */
export function CommentThread({ foodItemId, vendorId, count }) {
  const { user } = useSession();
  const location = useLocation();
  const query = useComments(foodItemId);
  const add = useAddComment(foodItemId);
  const [reportTarget, setReportTarget] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  const isCustomer = user?.role === ROLES.CUSTOMER;
  const isOwnerVendor = user?.role === ROLES.VENDOR && user.vendor?.id === vendorId;
  const next = encodeURIComponent(`${location.pathname}#comments`);

  return (
    <section id="comments" aria-labelledby="comments-title" className="space-y-3">
      <h2 id="comments-title" className="text-lg font-semibold">
        Comments{count != null ? ` (${count})` : ''}
      </h2>

      {isCustomer && <CommentForm onSubmit={(body) => add.mutateAsync({ body })} />}
      {!user && (
        <p className="text-sm text-ink-muted">
          <Link to={`${ROUTES.login}?next=${next}`} className="font-medium text-primary-700">
            Log in
          </Link>{' '}
          to join the conversation.
        </p>
      )}

      <InfiniteList
        query={query}
        className="divide-y divide-surface-border"
        autoLoad={false}
        renderItem={(c) => (
          <div>
            <CommentItem
              comment={c}
              foodItemId={foodItemId}
              canReport={Boolean(user)}
              onReport={setReportTarget}
              onReply={isOwnerVendor && !c.removed ? setReplyTo : undefined}
            />
            {c.replies?.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                foodItemId={foodItemId}
                canReport={Boolean(user)}
                onReport={setReportTarget}
                isReply
              />
            ))}
            {replyTo?.id === c.id && (
              <div className="pb-3 pl-10">
                <CommentForm
                  label={`Reply to ${c.author.name}`}
                  submitLabel="Post reply"
                  onCancel={() => setReplyTo(null)}
                  onSubmit={async (body) => {
                    await add.mutateAsync({ body, parentId: c.id });
                    setReplyTo(null);
                  }}
                />
              </div>
            )}
          </div>
        )}
        loadingFallback={<SkeletonText lines={4} />}
        emptyState={
          <EmptyState
            compact
            icon={MessageCircle}
            title="No comments yet"
            message={isCustomer ? 'Be the first to say something about this dish.' : undefined}
          />
        }
      />
      <ReportDialog
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        targetType="comment"
        targetId={reportTarget?.id}
      />
    </section>
  );
}
