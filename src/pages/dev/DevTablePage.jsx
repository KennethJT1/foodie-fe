import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { DataTable, FilterBar, PageHeader, Pagination } from '@/components/data';
import { EmptyState } from '@/components/feedback';
import { Avatar, StatusBadge } from '@/components/ui';
import { useTableQuery } from '@/hooks/useTableQuery';
import { api, unwrapList } from '@/lib/api-client';
import { formatDate, formatPhone } from '@/lib/format';

/** Demo list (phase 6): filters, sort and pagination all live in the URL. */

const STATUS_META = {
  active: { label: 'Active', tone: 'success' },
  suspended: { label: 'Suspended', tone: 'warning' },
  banned: { label: 'Banned', tone: 'danger' },
};

const columns = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    primary: true,
    cell: (u) => (
      <span className="flex items-center gap-2">
        <Avatar name={u.name} size="sm" />
        <span>
          <span className="block font-medium">{u.name}</span>
          <span className="block text-xs text-ink-muted">{u.email}</span>
        </span>
      </span>
    ),
  },
  { key: 'phone', header: 'Phone', cell: (u) => formatPhone(u.phone) },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    cell: (u) => <span className="capitalize">{u.role}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (u) => <StatusBadge status={u.status} meta={STATUS_META} />,
  },
  { key: 'createdAt', header: 'Joined', sortable: true, cell: (u) => formatDate(u.createdAt) },
];

export default function DevTablePage() {
  const table = useTableQuery({ defaults: { limit: 10, sort: '-createdAt' } });
  const query = useQuery({
    queryKey: ['dev-people', table.params],
    queryFn: () => api.get('/dev/people', { params: table.params }).then(unwrapList),
    placeholderData: keepPreviousData,
  });

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 md:px-6">
      <PageHeader
        title="Demo list"
        description="Everything here is driven by the URL."
        backTo="/dev/ui"
        backLabel="UI kit"
        actions={
          <Link to="/dev/form" className="text-sm text-primary-700 underline">
            Demo form
          </Link>
        }
      />
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Name, email or phone' },
          {
            type: 'select',
            name: 'role',
            label: 'Roles',
            options: ['customer', 'vendor', 'rider', 'admin'].map((r) => ({
              value: r,
              label: r[0].toUpperCase() + r.slice(1),
            })),
          },
          {
            type: 'chips',
            name: 'status',
            label: 'Status',
            options: Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label })),
          },
        ]}
      />
      <DataTable
        caption="People"
        columns={columns}
        rows={query.data?.data}
        loading={query.isLoading}
        error={query.error}
        onRetry={query.refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        rowActions={() => [{ label: 'View profile', onSelect: () => {} }]}
        emptyState={
          <EmptyState title="No one matches" message="Try another name or clear the filters." />
        }
      />
      <Pagination
        meta={query.data?.meta}
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
      />
    </main>
  );
}
