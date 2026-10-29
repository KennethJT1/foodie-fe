import { Download, ScrollText } from 'lucide-react';

import { DataTable, FilterBar, Pagination } from '@/components/data';
import { EmptyState } from '@/components/feedback';
import { Button } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { ADMIN_ROLE_LABELS } from '@/constants/roles';
import { Can } from '@/features/auth';
import { useTableQuery } from '@/hooks/useTableQuery';
import { downloadCsv, toCsv } from '@/lib/csv';
import { formatDateTime } from '@/lib/format';

import { useAuditLog } from '../hooks/useSettings';

const AREAS = [
  'vendor',
  'rider',
  'order',
  'payment',
  'payout',
  'plan',
  'subscription',
  'refund',
  'settings',
  'user',
  'role',
  'comment',
  'ticket',
].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));
const actorLabel = (role) => ADMIN_ROLE_LABELS[role] ?? (role === 'system' ? 'System' : role);

const columns = [
  {
    key: 'createdAt',
    header: 'When',
    primary: true,
    sortable: true,
    cell: (r) => formatDateTime(r.createdAt),
  },
  { key: 'actorName', header: 'Who', cell: (r) => `${r.actorName} · ${actorLabel(r.actorRole)}` },
  { key: 'action', header: 'Action', className: 'font-mono text-xs' },
  {
    key: 'summary',
    header: 'What changed',
    cell: (r) => <span className="line-clamp-2 max-w-md">{r.summary}</span>,
  },
  { key: 'ip', header: 'IP', hideOnMobile: true, className: 'font-mono text-xs' },
];

/** Every admin action and money event, filterable and exportable. */
export function AuditLogTable() {
  const table = useTableQuery({ defaults: { limit: 25, sort: '-createdAt' } });
  const { data, isLoading, error, refetch } = useAuditLog(table.params);
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <FilterBar
          value={table.filters}
          onChange={table.setFilters}
          fields={[
            { type: 'search', name: 'search', placeholder: 'Person, action or detail' },
            { type: 'select', name: 'targetType', label: 'Area', options: AREAS },
            {
              type: 'select',
              name: 'actorRole',
              label: 'Role',
              options: Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            },
            { type: 'dateRange', name: ['from', 'to'], label: 'Date' },
          ]}
        />
        <Can permission={PERMISSIONS.REPORTS_EXPORT}>
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            disabled={!data?.data.length}
            onClick={() =>
              downloadCsv(
                'kjt-audit-log.csv',
                toCsv(data.data, [
                  { header: 'When', value: (r) => r.createdAt },
                  { header: 'Who', value: (r) => r.actorName },
                  { header: 'Role', value: (r) => actorLabel(r.actorRole) },
                  { header: 'Action', value: (r) => r.action },
                  { header: 'Target', value: (r) => `${r.targetType}:${r.targetId}` },
                  { header: 'Summary', value: (r) => r.summary },
                  { header: 'IP', value: (r) => r.ip },
                ]),
              )
            }
          >
            Export CSV
          </Button>
        </Can>
      </div>
      <DataTable
        caption="Audit log"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        emptyState={<EmptyState icon={ScrollText} title="Nothing matches these filters" />}
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </div>
  );
}
