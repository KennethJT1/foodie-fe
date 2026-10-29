import { Bike } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { DataTable, FilterBar, Pagination } from '@/components/data';
import { EmptyState } from '@/components/feedback';
import { Badge, StatusBadge } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { APPROVAL_STATUS_META, toOptions } from '@/constants/statuses';
import { useTableQuery } from '@/hooks/useTableQuery';
import { formatCount, formatDate, formatRating } from '@/lib/format';

import { VEHICLE_LABELS, VEHICLE_OPTIONS } from '../../constants';
import { useAdminRiders } from '../../hooks/useAdminRiders';

const columns = [
  {
    key: 'name',
    header: 'Rider',
    primary: true,
    sortable: true,
    cell: (r) => (
      <div>
        <Link
          to={ROUTES.admin.rider(r.id)}
          className="font-medium hover:text-primary-700 hover:underline"
        >
          {r.name}
        </Link>
        <p className="text-xs text-ink-muted">
          {VEHICLE_LABELS[r.vehicleType] ?? '—'} · {r.city}
        </p>
      </div>
    ),
  },
  {
    key: 'approvalStatus',
    header: 'Status',
    cell: (r) => <StatusBadge status={r.approvalStatus} meta={APPROVAL_STATUS_META} />,
  },
  {
    key: 'isOnline',
    header: 'Now',
    cell: (r) =>
      r.isOnline ? (
        <Badge tone={r.isBusy ? 'info' : 'success'} dot>
          {r.isBusy ? 'On a delivery' : 'Online'}
        </Badge>
      ) : (
        <Badge dot>Offline</Badge>
      ),
  },
  {
    key: 'tripsCount',
    header: 'Trips',
    align: 'right',
    sortable: true,
    cell: (r) => formatCount(r.tripsCount),
  },
  {
    key: 'rating',
    header: 'Rating',
    align: 'right',
    sortable: true,
    hideOnMobile: true,
    cell: (r) => formatRating(r.rating),
  },
  {
    key: 'createdAt',
    header: 'Joined',
    sortable: true,
    hideOnMobile: true,
    cell: (r) => formatDate(r.createdAt),
  },
];

const ONLINE = [
  { value: 'true', label: 'Online' },
  { value: 'false', label: 'Offline' },
];

/** Riders with online status, trips and rating. Pass `defaults` to pin a filter (approval queue). */
export function AdminRiderList({
  defaults = { sort: '-createdAt' },
  showStatusFilter = true,
  emptyTitle = 'No riders match these filters',
}) {
  const table = useTableQuery({ defaults: { limit: 20, ...defaults } });
  const { data, isLoading, error, refetch } = useAdminRiders(table.params);
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Name, phone, plate or city' },
          ...(showStatusFilter
            ? [
                {
                  type: 'select',
                  name: 'approvalStatus',
                  label: 'Status',
                  options: toOptions(APPROVAL_STATUS_META).filter((o) => o.value !== 'draft'),
                },
              ]
            : []),
          { type: 'select', name: 'online', label: 'Online', options: ONLINE },
          {
            type: 'select',
            name: 'vehicleType',
            label: 'Vehicle',
            options: VEHICLE_OPTIONS.map(({ value, label }) => ({ value, label })),
          },
        ]}
      />
      <DataTable
        caption="Riders"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        onRowClick={(r) => navigate(ROUTES.admin.rider(r.id))}
        emptyState={<EmptyState icon={Bike} title={emptyTitle} />}
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </div>
  );
}
