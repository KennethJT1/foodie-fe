import { Clock, Heart, ShoppingBag, Star, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ChartCard, PageHeader, StatCard } from '@/components/data';
import { ErrorState, SkeletonText } from '@/components/feedback';
import { Button, Card, CardTitle } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { formatCount, formatNaira, formatRating } from '@/lib/format';

import { SalesChart } from './SalesChart';
import { useVendorStats } from '../hooks/useVendorReports';

/** Today at a glance: orders, sales, rating, waiting orders, sales chart and top dishes. */
export function VendorOverview() {
  const { data, isLoading, isError, error, refetch } = useVendorStats();
  if (isError)
    return <ErrorState title="We couldn't load your overview" error={error} onRetry={refetch} />;
  const stats = data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Overview"
        description="How your store is doing today."
        actions={
          <Button asChild>
            <Link to={ROUTES.vendor.orders}>Open live orders</Link>
          </Button>
        }
      />
      {stats?.waiting > 0 && (
        <Link
          to={ROUTES.vendor.orders}
          className="flex items-center gap-2 rounded-card bg-warning-50 p-3 text-sm font-medium text-amber-900 hover:underline"
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          {stats.waiting} order{stats.waiting > 1 ? 's are' : ' is'} waiting for you to accept
        </Link>
      )}
      {stats?.isPaused && (
        <p className="rounded-card bg-danger-50 p-3 text-sm text-red-800">
          Orders are paused, so customers can&apos;t order from you.{' '}
          <Link to={ROUTES.vendor.settings} className="font-medium underline">
            Resume orders
          </Link>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Orders today"
          icon={ShoppingBag}
          loading={isLoading}
          value={formatCount(stats?.today.orders)}
          change={stats?.today.ordersChange}
          changeLabel="vs yesterday"
        />
        <StatCard
          label="Sales today"
          icon={Wallet}
          loading={isLoading}
          value={formatNaira(stats?.today.sales ?? 0)}
          change={stats?.today.salesChange}
          changeLabel="vs yesterday"
        />
        <StatCard
          label="Rating"
          icon={Star}
          loading={isLoading}
          value={formatRating(stats?.rating)}
          hint={stats && `${formatCount(stats.ratingCount)} reviews`}
        />
        <StatCard
          label="Followers"
          icon={Heart}
          loading={isLoading}
          value={formatCount(stats?.followersCount)}
          hint={stats && `${stats.inProgress} orders in progress`}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <ChartCard
          title="Sales, last 14 days"
          description="Food sales after rejected and cancelled orders."
          loading={isLoading}
          isEmpty={stats && stats.series.every((d) => d.sales === 0)}
        >
          {stats && <SalesChart series={stats.series} />}
        </ChartCard>
        <Card header={<CardTitle title="Top dishes" description="Last 14 days" />}>
          {isLoading ? (
            <SkeletonText lines={5} />
          ) : stats.topItems.length ? (
            <ol className="space-y-2 text-sm">
              {stats.topItems.map((t, i) => (
                <li key={t.foodItemId} className="flex justify-between gap-3">
                  <span>
                    <span className="mr-2 text-ink-muted">{i + 1}.</span>
                    {t.name}
                  </span>
                  <span className="shrink-0 text-ink-muted">{t.quantity} sold</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-muted">
              No sales yet. Share your store link to get your first order.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
