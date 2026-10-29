import { Users } from 'lucide-react';
import { useState } from 'react';

import { DataTable, FilterBar, Pagination } from '@/components/data';
import { ConfirmDialog, EmptyState, ReasonDialog } from '@/components/feedback';
import { StatusBadge } from '@/components/ui';
import { PERMISSIONS, hasPermission } from '@/constants/permissions';
import { useSession } from '@/features/auth';
import { useTableQuery } from '@/hooks/useTableQuery';
import { formatDate, formatPhone } from '@/lib/format';

import { useAdminCustomers, useSetCustomerStatus } from '../hooks/useAdminReports';

const STATUS_META = {
  active: { label: 'Active', tone: 'success' },
  suspended: { label: 'Suspended', tone: 'warning' },
  banned: { label: 'Banned', tone: 'danger' },
};

const columns = [
  { key: 'name', header: 'Customer', primary: true, sortable: true },
  { key: 'phone', header: 'Phone', cell: (c) => formatPhone(c.phone) },
  { key: 'email', header: 'Email', hideOnMobile: true },
  { key: 'ordersCount', header: 'Orders', align: 'right', sortable: true },
  {
    key: 'createdAt',
    header: 'Joined',
    sortable: true,
    hideOnMobile: true,
    cell: (c) => formatDate(c.createdAt),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (c) => <StatusBadge status={c.status} meta={STATUS_META} />,
  },
];

/** Customers with suspend / ban (with a reason) and restore. */
export function AdminCustomerList() {
  const table = useTableQuery({ defaults: { limit: 20, sort: '-createdAt' } });
  const { data, isLoading, error, refetch } = useAdminCustomers(table.params);
  const setStatus = useSetCustomerStatus();
  const { user } = useSession();
  const canBan = hasPermission(user, PERMISSIONS.CUSTOMERS_BAN);
  const [action, setAction] = useState(null); // { customer, status }
  const apply = (reason) =>
    setStatus.mutateAsync({
      id: action.customer.id,
      name: action.customer.name,
      status: action.status,
      reason,
    });

  return (
    <div className="space-y-4">
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Name, email or phone' },
          {
            type: 'select',
            name: 'status',
            label: 'Status',
            options: Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label })),
          },
        ]}
      />
      <DataTable
        caption="Customers"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        rowActions={
          canBan
            ? (c) =>
                c.status === 'active'
                  ? [
                      {
                        label: 'Suspend customer',
                        onSelect: () => setAction({ customer: c, status: 'suspended' }),
                      },
                      {
                        label: 'Ban customer',
                        onSelect: () => setAction({ customer: c, status: 'banned' }),
                      },
                    ]
                  : [
                      {
                        label: 'Restore customer',
                        onSelect: () => setAction({ customer: c, status: 'active' }),
                      },
                    ]
            : undefined
        }
        emptyState={<EmptyState icon={Users} title="No customers match these filters" />}
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
      <ReasonDialog
        open={Boolean(action && action.status !== 'active')}
        onClose={() => setAction(null)}
        title={
          action?.status === 'banned'
            ? `Ban ${action?.customer.name}?`
            : `Suspend ${action?.customer.name}?`
        }
        description={
          action?.status === 'banned'
            ? 'They can no longer log in or order.'
            : "They can't order until you restore them."
        }
        confirmLabel={action?.status === 'banned' ? 'Ban customer' : 'Suspend customer'}
        onSubmit={apply}
      />
      <ConfirmDialog
        open={action?.status === 'active'}
        onClose={() => setAction(null)}
        title={`Restore ${action?.customer.name}?`}
        confirmLabel="Restore customer"
        isLoading={setStatus.isPending}
        onConfirm={() =>
          apply()
            .then(() => setAction(null))
            .catch(() => null)
        }
      />
    </div>
  );
}
