import { Flag } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Pagination } from '@/components/data';
import { EmptyState, ErrorState, SkeletonText } from '@/components/feedback';
import { Badge, Button, Card, Tabs } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { formatRelative } from '@/lib/format';

import { useModerationQueue, useResolveReport } from '../hooks/useFeed';

const VIEWS = [
  { value: 'open', label: 'Waiting' },
  { value: 'resolved,dismissed', label: 'Handled' },
];
const ACTION_LABELS = { hide: 'Hidden', remove: 'Removed', dismiss: 'Dismissed' };

function Target({ report }) {
  const t = report.target;
  if (!t) return <p className="text-sm text-ink-muted">This was already deleted.</p>;
  if (report.targetType === 'comment')
    return (
      <div className="rounded-lg bg-surface-muted p-3 text-sm">
        <p className="text-xs text-ink-muted">
          {t.authorName} on{' '}
          {t.foodItemId ? (
            <Link to={ROUTES.food(t.foodItemId)} className="text-primary-700 hover:underline">
              {t.foodItemName}
            </Link>
          ) : (
            t.foodItemName
          )}
        </p>
        <p>{t.body}</p>
      </div>
    );
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-muted p-3 text-sm">
      {t.photo && (
        <img
          loading="lazy"
          src={t.photo}
          alt={t.name}
          className="h-14 w-14 rounded-lg object-cover"
        />
      )}
      <div>
        <Link
          to={ROUTES.food(t.foodItemId)}
          className="font-medium text-primary-700 hover:underline"
        >
          {t.name}
        </Link>
        <p className="text-xs text-ink-muted">{t.vendorName}</p>
      </div>
    </div>
  );
}

/** Reported comments and dishes: hide, remove or dismiss. */
export function ModerationQueue() {
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useModerationQueue({
    status,
    page,
    limit: 10,
    sort: '-createdAt',
  });
  const resolve = useResolveReport();
  const busy = resolve.isPending ? resolve.variables?.id : null;

  return (
    <div className="space-y-4">
      <Tabs
        variant="pills"
        aria-label="Reports"
        items={VIEWS}
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />
      {isLoading ? (
        <SkeletonText lines={8} />
      ) : isError ? (
        <ErrorState title="We couldn't load reports" error={error} onRetry={refetch} />
      ) : !data.data.length ? (
        <EmptyState
          icon={Flag}
          title={status === 'open' ? 'Nothing to review' : 'No handled reports yet'}
          message="Reports from customers show up here."
        />
      ) : (
        <>
          {data.data.map((r) => (
            <Card
              key={r.id}
              as="article"
              padding="sm"
              aria-label={`Report: ${r.reason}`}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  <Badge tone="danger">{r.reason}</Badge>{' '}
                  <span className="text-ink-muted">
                    {r.targetType === 'comment' ? 'Comment' : 'Dish'} reported by {r.reporterName} ·{' '}
                    {formatRelative(r.createdAt)}
                  </span>
                </p>
                {r.status !== 'open' && (
                  <Badge>
                    {ACTION_LABELS[r.action] ?? r.status}
                    {r.resolvedBy && ` by ${r.resolvedBy}`}
                  </Badge>
                )}
              </div>
              <Target report={r} />
              {r.status === 'open' && r.target && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busy === r.id && resolve.variables?.action === 'hide'}
                    disabled={Boolean(busy)}
                    onClick={() => resolve.mutate({ id: r.id, action: 'hide' })}
                  >
                    Hide
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={busy === r.id && resolve.variables?.action === 'remove'}
                    disabled={Boolean(busy)}
                    onClick={() => resolve.mutate({ id: r.id, action: 'remove' })}
                  >
                    Remove
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={Boolean(busy)}
                    onClick={() => resolve.mutate({ id: r.id, action: 'dismiss' })}
                  >
                    Dismiss report
                  </Button>
                </div>
              )}
            </Card>
          ))}
          <Pagination meta={data.meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
