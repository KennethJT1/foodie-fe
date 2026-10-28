import { RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DataTable, FilterBar, Pagination } from '@/components/data';
import { EmptyState } from '@/components/feedback';
import { ROUTES } from '@/constants/routes';
import { REFUND_STATUS_META, toOptions } from '@/constants/statuses';
import { useTableQuery } from '@/hooks/useTableQuery';
import { formatDateTime } from '@/lib/format';

import { refundColumns } from './RefundList';
import { useRefunds } from '../hooks/useRefunds';

const columns = [
  ...refundColumns({ refundHref: (r) => ROUTES.vendor.refund(r.id), show: { customer: true } }),
  {
    key: 'deadline',
    header: 'Answer by',
    hideOnMobile: true,
    cell: (r) => (r.status === 'requested' ? formatDateTime(r.deadline) : '—'),
  },
];

/** Refund requests on the store's orders, open ones first. */
export function VendorRefundList() {
  const table = useTableQuery({ defaults: { limit: 20, sort: '-createdAt' } });
  const { data, isLoading, error, refetch } = useRefunds(table.params);
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Order no. or customer' },
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
        onRowClick={(r) => navigate(ROUTES.vendor.refund(r.id))}
        emptyState={
          <EmptyState
            icon={RotateCcw}
            title="No refund requests"
            message="When a customer asks for money back on an order, it shows up here."
          />
        }
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </div>
  );
}
