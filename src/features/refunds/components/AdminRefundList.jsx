import { RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DataTable, FilterBar, Pagination } from '@/components/data';
import { EmptyState } from '@/components/feedback';
import { ROUTES } from '@/constants/routes';
import { REFUND_STATUS_META, toOptions } from '@/constants/statuses';
import { useTableQuery } from '@/hooks/useTableQuery';

import { refundColumns } from './RefundList';
import { useRefunds } from '../hooks/useRefunds';

const columns = refundColumns({
  refundHref: (r) => ROUTES.admin.refund(r.id),
  show: { vendor: true, customer: true },
});

/** Every refund request on the platform (BR-REF-05). */
export function AdminRefundList() {
  const table = useTableQuery({ defaults: { limit: 20, sort: '-createdAt' } });
  const { data, isLoading, error, refetch } = useRefunds(table.params);
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Order no., vendor or customer' },
          {
            type: 'select',
            name: 'status',
            label: 'Status',
            options: toOptions(REFUND_STATUS_META),
          },
          { type: 'dateRange', name: ['from', 'to'], label: 'Requested' },
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
        onRowClick={(r) => navigate(ROUTES.admin.refund(r.id))}
        emptyState={<EmptyState icon={RotateCcw} title="No refunds match these filters" />}
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </div>
  );
}
