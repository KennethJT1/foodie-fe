import { Bike, ClipboardCheck, CreditCard, Receipt, Truck, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ChartCard, PageHeader, StatCard } from '@/components/data';
import { ErrorState } from '@/components/feedback';
import { Card, CardTitle } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { formatCount, formatNaira } from '@/lib/format';

import { SalesChart } from './SalesChart';
import { useAdminOverview } from '../hooks/useAdminReports';

function Waiting({ to, count, label }) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center justify-between gap-3 rounded-lg p-2 text-sm hover:bg-surface-muted"
      >
        <span>{label}</span>
        <span className="rounded-full bg-primary-50 px-2 font-semibold text-primary-700">
          {count}
        </span>
      </Link>
    </li>
  );
}

/** Platform today: GMV, orders, active deliveries, MRR, delivery-fee revenue and sign-ups. */
export function AdminOverview() {
  const { data, isLoading, isError, error, refetch } = useAdminOverview();
  if (isError)
    return <ErrorState title="We couldn't load the overview" error={error} onRetry={refetch} />;
  const d = data;
  return (
    <div className="space-y-4">
      <PageHeader title="Overview" description="KJT Foodie today, across every city." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="GMV today"
          icon={Wallet}
          loading={isLoading}
          value={formatNaira(d?.gmvToday ?? 0)}
          change={d?.gmvChange}
          changeLabel="vs yesterday"
        />
        <StatCard
          label="Orders today"
          icon={Receipt}
          loading={isLoading}
          value={formatCount(d?.ordersToday)}
          change={d?.ordersChange}
          changeLabel="vs yesterday"
        />
        <StatCard
          label="Active deliveries"
          icon={Truck}
          loading={isLoading}
          value={formatCount(d?.activeDeliveries)}
          hint={d && `${d.onlineRiders} riders online`}
        />
        <StatCard
          label="MRR"
          icon={CreditCard}
          loading={isLoading}
          value={formatNaira(d?.mrr ?? 0)}
          hint={d && `${d.payingVendors} paying vendors`}
        />
        <StatCard
          label="Delivery fees this month"
          icon={Bike}
          loading={isLoading}
          value={formatNaira(d?.deliveryFeeRevenue ?? 0)}
        />
        <StatCard
          label="Sign-ups, last 7 days"
          icon={Users}
          loading={isLoading}
          value={formatCount(d ? d.signups.customers + d.signups.vendors + d.signups.riders : 0)}
          hint={
            d &&
            `${d.signups.customers} customers · ${d.signups.vendors} vendors · ${d.signups.riders} riders`
          }
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <ChartCard
          title="GMV, last 14 days"
          description="Everything customers paid, after cancelled and rejected orders."
          loading={isLoading}
          isEmpty={d && d.series.every((x) => x.gmv === 0)}
        >
          {d && <SalesChart series={d.series.map((x) => ({ ...x, sales: x.gmv }))} />}
        </ChartCard>
        <Card header={<CardTitle title="Waiting for the team" />}>
          {d && (
            <ul className="space-y-1">
              <Waiting
                to={ROUTES.admin.vendorApprovals}
                count={d.pending.vendors}
                label="Vendors to approve"
              />
              <Waiting
                to={ROUTES.admin.riderApprovals}
                count={d.pending.riders}
                label="Riders to approve"
              />
              <Waiting
                to={ROUTES.admin.refunds}
                count={d.pending.refunds}
                label="Disputed refunds"
              />
            </ul>
          )}
          {!d && <ClipboardCheck className="h-6 w-6 text-ink-muted" aria-hidden="true" />}
        </Card>
      </div>
    </div>
  );
}
