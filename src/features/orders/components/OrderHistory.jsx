import { Receipt } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { DataTable, FilterBar, Pagination } from '@/components/data';
import { EmptyState } from '@/components/feedback';
import { Button } from '@/components/ui';
import { ORDER_STATUS_OPTIONS } from '@/constants/order-status';
import { ROUTES } from '@/constants/routes';
import { NewCartDialog } from '@/features/cart';
import { useTableQuery } from '@/hooks/useTableQuery';

import { orderColumns } from './order-columns';
import { useOrders, useReorder } from '../hooks/useOrders';

const columns = orderColumns({
  orderHref: (o) => ROUTES.account.order(o.id),
  show: { vendor: true },
});

/** The customer's orders with filters and reorder (FR-ORD-06). */
export function OrderHistory() {
  const table = useTableQuery({ defaults: { limit: 10, sort: '-createdAt' } });
  const { data, isLoading, error, refetch } = useOrders(table.params);
  const { reorder, dialog } = useReorder();
  const navigate = useNavigate();
  const hasFilters = Object.keys(table.filters).length > 0;

  return (
    <div className="space-y-4">
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Order no. or vendor' },
          { type: 'select', name: 'status', label: 'Status', options: ORDER_STATUS_OPTIONS },
          { type: 'dateRange', name: ['from', 'to'], label: 'Date' },
        ]}
      />
      <DataTable
        caption="Your orders"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        onRowClick={(o) => navigate(ROUTES.account.order(o.id))}
        rowActions={(o) => [
          { label: 'View order', onSelect: () => navigate(ROUTES.account.order(o.id)) },
          { label: 'Reorder', onSelect: () => reorder(o) },
        ]}
        emptyState={
          hasFilters ? (
            <EmptyState
              icon={Receipt}
              title="No orders match these filters"
              action={
                <Button variant="outline" onClick={table.reset}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="No orders yet"
              message="Your orders show up here once you place one."
              action={
                <Button asChild>
                  <Link to={ROUTES.home}>Find food</Link>
                </Button>
              }
            />
          )
        }
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
      <NewCartDialog {...dialog} />
    </div>
  );
}
