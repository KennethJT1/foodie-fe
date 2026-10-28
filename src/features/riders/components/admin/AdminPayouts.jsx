import { Download, Wallet } from 'lucide-react';
import { useState } from 'react';

import { DataTable, FilterBar, Pagination } from '@/components/data';
import { ConfirmDialog, EmptyState, toast } from '@/components/feedback';
import { Button, Input, Modal, StatusBadge } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { PAYOUT_STATUS_META, toOptions } from '@/constants/statuses';
import { Can } from '@/features/auth';
import { useTableQuery } from '@/hooks/useTableQuery';
import { downloadCsv, toCsv } from '@/lib/csv';
import { formatDate, formatNaira } from '@/lib/format';

import { useAdminPayouts, useApprovePayout, useMarkPayoutPaid } from '../../hooks/useAdminRiders';

const monthLabel = (m) =>
  new Date(`${m}-15T12:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

function MarkPaidDialog({ statement, onClose }) {
  const [reference, setReference] = useState('');
  const [error, setError] = useState(null);
  const markPaid = useMarkPayoutPaid();
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Mark ${statement.riderName}'s payout paid`}
      description={`Send ${formatNaira(statement.amount)} by bank transfer first.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            loading={markPaid.isPending}
            onClick={() =>
              markPaid.mutate(
                { id: statement.id, reference },
                {
                  onSuccess: onClose,
                  onError: (e) => setError(e.fieldErrors?.reference ?? e.message),
                },
              )
            }
          >
            Mark as paid
          </Button>
        </>
      }
    >
      <Input
        label="Transfer reference"
        value={reference}
        error={error}
        onChange={(e) => setReference(e.target.value)}
      />
    </Modal>
  );
}

/** Monthly rider payout statements: review, approve, pay and record the reference (BR-PAY-06). */
export function AdminPayouts() {
  const table = useTableQuery({ defaults: { limit: 20, sort: '-month' } });
  const { data, isLoading, error, refetch } = useAdminPayouts(table.params);
  const approve = useApprovePayout();
  const [approving, setApproving] = useState(null);
  const [paying, setPaying] = useState(null);
  const columns = [
    { key: 'riderName', header: 'Rider', primary: true, sortable: true },
    { key: 'month', header: 'Month', sortable: true, cell: (s) => monthLabel(s.month) },
    { key: 'trips', header: 'Trips', align: 'right', sortable: true },
    {
      key: 'deliveryFees',
      header: 'Delivery fees',
      align: 'right',
      hideOnMobile: true,
      cell: (s) => formatNaira(s.deliveryFees),
    },
    {
      key: 'amount',
      header: 'Payout',
      align: 'right',
      sortable: true,
      cell: (s) => `${formatNaira(s.amount)} (${s.payoutPct}%)`,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => <StatusBadge status={s.status} meta={PAYOUT_STATUS_META} />,
    },
    {
      key: 'paidAt',
      header: 'Paid',
      hideOnMobile: true,
      cell: (s) => (s.paidAt ? `${formatDate(s.paidAt)} · ${s.reference}` : '—'),
    },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <FilterBar
          value={table.filters}
          onChange={table.setFilters}
          fields={[
            { type: 'search', name: 'search', placeholder: 'Rider or reference' },
            {
              type: 'select',
              name: 'status',
              label: 'Status',
              options: toOptions(PAYOUT_STATUS_META),
            },
          ]}
        />
        <Can permission={PERMISSIONS.REPORTS_EXPORT}>
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            disabled={!data?.data.length}
            onClick={() =>
              downloadCsv(
                'kjt-rider-payouts.csv',
                toCsv(data.data, [
                  { header: 'Rider', value: (s) => s.riderName },
                  { header: 'Month', value: (s) => s.month },
                  { header: 'Trips', value: (s) => s.trips },
                  { header: 'Payout (NGN)', value: (s) => (s.amount / 100).toFixed(2) },
                  { header: 'Status', value: (s) => s.status },
                  { header: 'Reference', value: (s) => s.reference ?? '' },
                ]),
              )
            }
          >
            Export CSV
          </Button>
        </Can>
      </div>
      <DataTable
        caption="Payout statements"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        rowActions={(s) =>
          s.status === 'draft'
            ? [{ label: 'Approve statement', onSelect: () => setApproving(s) }]
            : s.status === 'approved'
              ? [{ label: 'Mark as paid', onSelect: () => setPaying(s) }]
              : []
        }
        emptyState={<EmptyState icon={Wallet} title="No statements match these filters" />}
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
      <ConfirmDialog
        open={Boolean(approving)}
        onClose={() => setApproving(null)}
        title={`Approve ${approving?.riderName}'s ${approving ? monthLabel(approving.month) : ''} statement?`}
        message={approving && `${approving.trips} trips · ${formatNaira(approving.amount)} to pay.`}
        confirmLabel="Approve statement"
        isLoading={approve.isPending}
        onConfirm={() =>
          approve.mutate(approving.id, {
            onSuccess: () => setApproving(null),
            onError: (e) => toast.error(e),
          })
        }
      />
      {paying && <MarkPaidDialog statement={paying} onClose={() => setPaying(null)} />}
    </div>
  );
}
