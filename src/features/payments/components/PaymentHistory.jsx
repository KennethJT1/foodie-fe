import { CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

import { DataTable, FilterBar, Pagination } from '@/components/data';
import { EmptyState } from '@/components/feedback';
import { StatusBadge } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { toOptions } from '@/constants/statuses';
import { useTableQuery } from '@/hooks/useTableQuery';
import { formatDateTime, formatNaira, formatOrderNumber } from '@/lib/format';

import { PAYMENT_CHANNEL_LABELS, PAYMENT_STATUS_META } from '../constants';
import { usePaymentHistory } from '../hooks/usePayments';

const columns = [
  {
    key: 'orderCode',
    header: 'Order',
    primary: true,
    cell: (p) =>
      p.orderId ? (
        <Link to={ROUTES.account.order(p.orderId)} className="font-medium text-primary-700">
          {formatOrderNumber(p.orderCode)}
        </Link>
      ) : (
        '—'
      ),
  },
  { key: 'vendorName', header: 'Vendor' },
  { key: 'createdAt', header: 'Date', sortable: true, cell: (p) => formatDateTime(p.createdAt) },
  { key: 'channel', header: 'Method', cell: (p) => PAYMENT_CHANNEL_LABELS[p.channel] ?? p.channel },
  { key: 'reference', header: 'Reference', hideOnMobile: true, className: 'font-mono text-xs' },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    sortable: true,
    cell: (p) => formatNaira(p.amount),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (p) => <StatusBadge status={p.status} meta={PAYMENT_STATUS_META} />,
  },
];

/** The customer's order payments with refunds marked. */
export function PaymentHistory() {
  const table = useTableQuery({ defaults: { limit: 20, sort: '-createdAt' } });
  const { data, isLoading, error, refetch } = usePaymentHistory(table.params);
  return (
    <div className="space-y-4">
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Reference, order or vendor' },
          {
            type: 'select',
            name: 'status',
            label: 'Status',
            options: toOptions(PAYMENT_STATUS_META),
          },
        ]}
      />
      <DataTable
        caption="Payments"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        emptyState={
          <EmptyState
            icon={CreditCard}
            title="No payments yet"
            message="When you pay for an order, the receipt shows up here."
          />
        }
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </div>
  );
}
