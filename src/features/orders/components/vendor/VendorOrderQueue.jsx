import { ChefHat, Inbox, PackageCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '@/components/data';
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { Button, Tabs } from '@/components/ui';
import { ORDER_STATUS } from '@/constants/order-status';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/cn';

import { VendorOrderCard } from './VendorOrderCard';
import { useOrders } from '../../hooks/useOrders';

const S = ORDER_STATUS;

const COLUMNS = [
  {
    key: 'new',
    title: 'New',
    statuses: [S.PAID],
    icon: Inbox,
    empty: 'New orders appear here with a sound.',
  },
  {
    key: 'kitchen',
    title: 'In the kitchen',
    statuses: [S.ACCEPTED, S.PREPARING],
    icon: ChefHat,
    empty: 'Accepted orders you are cooking.',
  },
  {
    key: 'ready',
    title: 'Ready for pickup',
    statuses: [S.READY_FOR_PICKUP, S.RIDER_ASSIGNED],
    icon: PackageCheck,
    empty: 'Orders waiting for a rider.',
  },
];

const PARAMS = { active: 'true', limit: 100, sort: 'createdAt' };

/** Live order queue: new → in the kitchen → ready, updated over the socket (FR-ORD-07). */
export function VendorOrderQueue() {
  const { data, isLoading, isError, error, refetch } = useOrders(PARAMS, {
    refetchInterval: 30000,
  });
  const [tab, setTab] = useState('new');
  const orders = (data?.data ?? []).filter((o) => o.status !== S.PICKED_UP);
  const byColumn = Object.fromEntries(
    COLUMNS.map((c) => [c.key, orders.filter((o) => c.statuses.includes(o.status))]),
  );

  return (
    <div>
      <PageHeader
        title="Live orders"
        description="Accept new orders quickly: they are rejected and refunded when the timer runs out."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.vendor.orderHistory}>Order history</Link>
          </Button>
        }
      />
      {isError ? (
        <ErrorState title="We couldn't load your orders" error={error} onRetry={refetch} />
      ) : (
        <>
          <Tabs
            variant="pills"
            aria-label="Order stage"
            className="mb-4 lg:hidden"
            value={tab}
            onChange={setTab}
            items={COLUMNS.map((c) => ({
              value: c.key,
              label: c.title,
              count: byColumn[c.key].length,
            }))}
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {COLUMNS.map((c) => (
              <section
                key={c.key}
                aria-labelledby={`queue-${c.key}`}
                className={cn('space-y-3', tab !== c.key && 'hidden lg:block')}
              >
                <h2
                  id={`queue-${c.key}`}
                  className="hidden items-center gap-2 font-semibold lg:flex"
                >
                  <c.icon className="h-5 w-5 text-primary-700" aria-hidden="true" />
                  {c.title}
                  <span className="rounded-full bg-surface-muted px-2 text-xs">
                    {byColumn[c.key].length}
                  </span>
                </h2>
                {isLoading ? (
                  [0, 1].map((i) => <Skeleton key={i} className="h-48 rounded-card" />)
                ) : byColumn[c.key].length ? (
                  byColumn[c.key].map((o) => (
                    <VendorOrderCard key={o.id} order={o} onExpire={refetch} />
                  ))
                ) : (
                  <EmptyState
                    compact
                    icon={c.icon}
                    title={`Nothing ${c.key === 'new' ? 'new' : 'here'} yet`}
                    message={c.empty}
                    className="rounded-card border border-dashed border-surface-border"
                  />
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
