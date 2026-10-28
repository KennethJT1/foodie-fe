import { Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DataTable, FilterBar, Pagination } from '@/components/data';
import { EmptyState } from '@/components/feedback';
import { Button } from '@/components/ui';
import { ORDER_STATUS_OPTIONS } from '@/constants/order-status';
import { ROUTES } from '@/constants/routes';
import { useTableQuery } from '@/hooks/useTableQuery';

import { useOrders } from '../../hooks/useOrders';
import { orderColumns } from '../order-columns';

const columns = orderColumns({
  orderHref: (o) => ROUTES.admin.order(o.id),
  show: { vendor: true, customer: true, rider: true },
});

const ACTIVE = [
  { value: 'true', label: 'In progress' },
  { value: 'false', label: 'Finished' },
];

/** Every order on the platform with filters (shared order columns). */
export function AdminOrderList() {
  const table = useTableQuery({ defaults: { limit: 20, sort: '-createdAt' } });
  const { data, isLoading, error, refetch } = useOrders(table.params);
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Order no., vendor or customer' },
          { type: 'select', name: 'status', label: 'Status', options: ORDER_STATUS_OPTIONS },
          { type: 'select', name: 'active', label: 'Progress', options: ACTIVE },
          { type: 'dateRange', name: ['from', 'to'], label: 'Date' },
        ]}
      />
      <DataTable
        caption="Orders"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        onRowClick={(o) => navigate(ROUTES.admin.order(o.id))}
        emptyState={
          <EmptyState
            icon={Receipt}
            title="No orders match these filters"
            action={
              <Button variant="outline" onClick={table.reset}>
                Clear filters
              </Button>
            }
          />
        }
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </div>
  );
}
