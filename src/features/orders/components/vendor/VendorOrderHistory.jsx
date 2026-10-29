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
  orderHref: (o) => ROUTES.vendor.order(o.id),
  show: { customer: true },
});

/** Every order the store has received, with filters (reuses the shared order columns). */
export function VendorOrderHistory() {
  const table = useTableQuery({ defaults: { limit: 20, sort: '-createdAt' } });
  const { data, isLoading, error, refetch } = useOrders(table.params);
  const navigate = useNavigate();
  const hasFilters = Object.keys(table.filters).length > 0;
  return (
    <div className="space-y-4">
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Order no. or customer' },
          { type: 'select', name: 'status', label: 'Status', options: ORDER_STATUS_OPTIONS },
          { type: 'dateRange', name: ['from', 'to'], label: 'Date' },
        ]}
      />
      <DataTable
        caption="Store orders"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        onRowClick={(o) => navigate(ROUTES.vendor.order(o.id))}
        emptyState={
          <EmptyState
            icon={Receipt}
            title={hasFilters ? 'No orders match these filters' : 'No orders yet'}
            message={hasFilters ? undefined : 'Share your store link to get your first order.'}
            action={
              hasFilters && (
                <Button variant="outline" onClick={table.reset}>
                  Clear filters
                </Button>
              )
            }
          />
        }
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </div>
  );
}
