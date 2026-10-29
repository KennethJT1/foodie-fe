import { Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DataTable, FilterBar, Pagination } from '@/components/data';
import { EmptyState } from '@/components/feedback';
import { ROUTES } from '@/constants/routes';
import {
  APPROVAL_STATUS_META,
  SUBSCRIPTION_STATUS_META,
  toOptions,
  VENDOR_TYPE_LABELS,
} from '@/constants/statuses';
import { useTableQuery } from '@/hooks/useTableQuery';

import { vendorColumns } from './vendor-columns';
import { useAdminVendors } from '../../hooks/useAdminVendors';

/** Every vendor with status, plan and type filters. Pass `defaults` to pin a filter (approval queue). */
export function AdminVendorList({
  defaults = { sort: '-createdAt' },
  showStatusFilter = true,
  emptyTitle = 'No vendors match these filters',
}) {
  const table = useTableQuery({ defaults: { limit: 20, ...defaults } });
  const { data, isLoading, error, refetch } = useAdminVendors(table.params);
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Store, owner, phone or city' },
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
          {
            type: 'select',
            name: 'subscriptionStatus',
            label: 'Plan',
            options: toOptions(SUBSCRIPTION_STATUS_META),
          },
          {
            type: 'select',
            name: 'type',
            label: 'Type',
            options: Object.entries(VENDOR_TYPE_LABELS).map(([value, label]) => ({ value, label })),
          },
        ]}
      />
      <DataTable
        caption="Vendors"
        columns={vendorColumns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        onRowClick={(v) => navigate(ROUTES.admin.vendor(v.id))}
        emptyState={<EmptyState icon={Store} title={emptyTitle} />}
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </div>
  );
}
