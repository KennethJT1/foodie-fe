import { History } from 'lucide-react';

import { DataTable, FilterBar, PageHeader, Pagination } from '@/components/data';
import { EmptyState } from '@/components/feedback';
import { useTableQuery } from '@/hooks/useTableQuery';
import { formatDateTime, formatDistance, formatNaira, formatOrderNumber } from '@/lib/format';

import { useTrips } from '../hooks/useRider';

const columns = [
  { key: 'orderCode', header: 'Order', primary: true, cell: (t) => formatOrderNumber(t.orderCode) },
  {
    key: 'deliveredAt',
    header: 'Delivered',
    sortable: true,
    cell: (t) => formatDateTime(t.deliveredAt),
  },
  { key: 'vendorName', header: 'From', cell: (t) => t.vendorName },
  { key: 'dropoffArea', header: 'To', hideOnMobile: true },
  {
    key: 'distanceM',
    header: 'Distance',
    align: 'right',
    hideOnMobile: true,
    cell: (t) => formatDistance(t.distanceM),
  },
  {
    key: 'earning',
    header: 'You earned',
    align: 'right',
    sortable: true,
    cell: (t) => formatNaira(t.earning),
  },
];

/** Completed deliveries, newest first. */
export function TripsList() {
  const table = useTableQuery({ defaults: { limit: 20, sort: '-deliveredAt' } });
  const { data, isLoading, error, refetch } = useTrips(table.params);
  return (
    <div className="space-y-4">
      <PageHeader title="Trips" description="Every delivery you have completed." />
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Order no., vendor or area' },
          { type: 'dateRange', name: ['from', 'to'], label: 'Date' },
        ]}
      />
      <DataTable
        caption="Trips"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        emptyState={
          <EmptyState
            icon={History}
            title="No trips yet"
            message="Go online and accept a job to make your first delivery."
          />
        }
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </div>
  );
}
