import { RotateCcw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { DataTable, FilterBar, Pagination } from '@/components/data';
import { EmptyState } from '@/components/feedback';
import { Button, StatusBadge } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { REFUND_STATUS_META, toOptions } from '@/constants/statuses';
import { useTableQuery } from '@/hooks/useTableQuery';
import { formatDate, formatNaira, formatOrderNumber } from '@/lib/format';

import { useRefunds } from '../hooks/useRefunds';

/**
 * Refund columns shared by customer, vendor and admin lists.
 * @param {{ refundHref: (r: object) => string, show?: { vendor?: boolean, customer?: boolean } }} opts
 */
export function refundColumns({ refundHref, show = { vendor: true } }) {
  return [
    {
      key: 'orderCode',
      header: 'Order',
      primary: true,
      cell: (r) => (
        <Link to={refundHref(r)} className="font-medium text-primary-700 hover:underline">
          {formatOrderNumber(r.orderCode)}
        </Link>
      ),
    },
    ...(show.vendor ? [{ key: 'vendorName', header: 'Vendor' }] : []),
    ...(show.customer ? [{ key: 'customerName', header: 'Customer' }] : []),
    { key: 'reason', header: 'Reason', hideOnMobile: true },
    { key: 'createdAt', header: 'Requested', sortable: true, cell: (r) => formatDate(r.createdAt) },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      cell: (r) => formatNaira(r.amount),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => <StatusBadge status={r.status} meta={REFUND_STATUS_META} />,
    },
  ];
}

const columns = refundColumns({ refundHref: (r) => ROUTES.account.refund(r.id) });

/** The customer's refund requests. */
export function RefundList() {
  const table = useTableQuery({ defaults: { limit: 20, sort: '-createdAt' } });
  const { data, isLoading, error, refetch } = useRefunds(table.params);
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Order no. or vendor' },
          {
            type: 'select',
            name: 'status',
            label: 'Status',
            options: toOptions(REFUND_STATUS_META),
          },
        ]}
      />
      <DataTable
        caption="Refund requests"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        onRowClick={(r) => navigate(ROUTES.account.refund(r.id))}
        emptyState={
          <EmptyState
            icon={RotateCcw}
            title="No refund requests"
            message="If something is wrong with a delivered order, request a refund from the order page."
            action={
              <Button asChild variant="outline">
                <Link to={ROUTES.account.orders}>See your orders</Link>
              </Button>
            }
          />
        }
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </div>
  );
}
