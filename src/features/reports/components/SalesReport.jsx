import { Download, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { DataTable, FilterBar, PageHeader, Pagination, StatCard } from '@/components/data';
import { EmptyState, toast } from '@/components/feedback';
import { Button, StatusBadge, Tabs } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { SETTLEMENT_STATUS_META } from '@/constants/statuses';
import { useTableQuery } from '@/hooks/useTableQuery';
import { downloadCsv, toCsv } from '@/lib/csv';
import { formatDateTime, formatNaira, formatOrderNumber } from '@/lib/format';

import { shortDay } from './SalesChart';
import { reportsApi } from '../api/reports.api';
import { useVendorSales, useVendorSalesDaily } from '../hooks/useVendorReports';

const SETTLEMENT_META = {
  ...SETTLEMENT_STATUS_META,
  refunded: { label: 'Refunded', tone: 'neutral' },
};
const naira = (kobo) => (kobo / 100).toFixed(2);

const orderColumns = [
  {
    key: 'orderCode',
    header: 'Order',
    primary: true,
    cell: (r) => (
      <Link
        to={ROUTES.vendor.order(r.orderId)}
        className="font-medium text-primary-700 hover:underline"
      >
        {formatOrderNumber(r.orderCode)}
      </Link>
    ),
  },
  { key: 'createdAt', header: 'Paid', sortable: true, cell: (r) => formatDateTime(r.createdAt) },
  { key: 'customerName', header: 'Customer', hideOnMobile: true },
  {
    key: 'amount',
    header: 'You get',
    align: 'right',
    sortable: true,
    cell: (r) => formatNaira(r.amount),
  },
  {
    key: 'settlementStatus',
    header: 'Payout',
    cell: (r) => <StatusBadge status={r.settlementStatus} meta={SETTLEMENT_META} />,
  },
];

const dayColumns = [
  { key: 'date', header: 'Day', primary: true, cell: (d) => shortDay(d.date) },
  { key: 'orders', header: 'Orders', align: 'right' },
  { key: 'amount', header: 'Sales', align: 'right', cell: (d) => formatNaira(d.amount) },
  { key: 'settling', header: 'Settling', align: 'right', cell: (d) => formatNaira(d.settling) },
  { key: 'settled', header: 'Settled', align: 'right', cell: (d) => formatNaira(d.settled) },
];

function ByOrder() {
  const table = useTableQuery({ defaults: { limit: 20, sort: '-createdAt' } });
  const { data, isLoading, error, refetch } = useVendorSales(table.params);
  const [isExporting, setExporting] = useState(false);
  const summary = data?.meta?.summary;

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await reportsApi.vendorSales({ ...table.params, page: 1, limit: 100 });
      downloadCsv(
        'kjt-sales-by-order.csv',
        toCsv(all.data, [
          { header: 'Order', value: (r) => formatOrderNumber(r.orderCode) },
          { header: 'Paid at', value: (r) => r.createdAt },
          { header: 'Customer', value: (r) => r.customerName },
          { header: 'Amount (NGN)', value: (r) => naira(r.amount) },
          {
            header: 'Payout',
            value: (r) => SETTLEMENT_META[r.settlementStatus]?.label ?? r.settlementStatus,
          },
          { header: 'Reference', value: (r) => r.reference },
        ]),
      );
    } catch (e) {
      toast.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Settling (paid out next working day)"
          value={formatNaira(summary?.settling ?? 0)}
          loading={isLoading}
        />
        <StatCard
          label="Settled to your bank"
          value={formatNaira(summary?.settled ?? 0)}
          loading={isLoading}
        />
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <FilterBar
          value={table.filters}
          onChange={table.setFilters}
          fields={[
            { type: 'search', name: 'search', placeholder: 'Order no., customer or reference' },
            {
              type: 'select',
              name: 'settlementStatus',
              label: 'Payout',
              options: Object.entries(SETTLEMENT_META)
                .filter(([k]) => k !== 'failed')
                .map(([value, m]) => ({ value, label: m.label })),
            },
            { type: 'dateRange', name: ['from', 'to'], label: 'Date' },
          ]}
        />
        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          loading={isExporting}
          onClick={exportCsv}
        >
          Export CSV
        </Button>
      </div>
      <DataTable
        caption="Sales by order"
        columns={orderColumns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        emptyState={
          <EmptyState
            icon={Wallet}
            title="No sales in this range"
            message="Paid orders show up here straight away."
          />
        }
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </div>
  );
}

function ByDay() {
  const { data, isLoading, error, refetch } = useVendorSalesDaily({ days: 30 });
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          disabled={!data?.length}
          onClick={() =>
            downloadCsv(
              'kjt-sales-by-day.csv',
              toCsv(data, [
                { header: 'Day', value: (d) => d.date },
                { header: 'Orders', value: (d) => d.orders },
                { header: 'Sales (NGN)', value: (d) => naira(d.amount) },
                { header: 'Settling (NGN)', value: (d) => naira(d.settling) },
                { header: 'Settled (NGN)', value: (d) => naira(d.settled) },
              ]),
            )
          }
        >
          Export CSV
        </Button>
      </div>
      <DataTable
        caption="Sales by day, last 30 days"
        columns={dayColumns}
        rows={data}
        getRowId={(d) => d.date}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        emptyState={
          <EmptyState
            icon={Wallet}
            title="No sales in the last 30 days"
            message="Share your store link to get your first order."
          />
        }
      />
    </div>
  );
}

/** Food money per order and per day, "settling" until Paystack pays it out (BR-PAY-04). */
export function SalesReport() {
  const [view, setView] = useState('orders');
  return (
    <div className="space-y-4">
      <PageHeader
        title="Sales and payouts"
        description="Customers pay for food straight into your bank account. Paystack settles it the next working day."
      />
      <Tabs
        variant="pills"
        aria-label="Sales view"
        value={view}
        onChange={setView}
        items={[
          { value: 'orders', label: 'By order' },
          { value: 'days', label: 'By day' },
        ]}
      />
      {view === 'orders' ? <ByOrder /> : <ByDay />}
    </div>
  );
}
