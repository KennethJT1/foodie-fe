import { AlertTriangle, CreditCard, Download } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { DataTable, FilterBar, Pagination, StatCard } from '@/components/data';
import { EmptyState, ReasonDialog, toast } from '@/components/feedback';
import { Badge, Button, StatusBadge } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTES } from '@/constants/routes';
import { SETTLEMENT_STATUS_META, toOptions } from '@/constants/statuses';
import { Can } from '@/features/auth';
import { useTableQuery } from '@/hooks/useTableQuery';
import { downloadCsv, toCsv } from '@/lib/csv';
import { formatDateTime, formatNaira, formatOrderNumber } from '@/lib/format';

import { paymentsApi } from '../api/payments.api';
import {
  PAYMENT_CHANNEL_LABELS,
  PAYMENT_FLAG_LABELS,
  PAYMENT_STATUS_META,
  PAYMENT_TYPE_LABELS,
} from '../constants';
import { useAdminPayments, useReconcilePayment } from '../hooks/useAdminPayments';

const naira = (k) => (k / 100).toFixed(2);
const FLAGGED = [{ value: 'true', label: 'Needs checking' }];

/** Every transaction with the Paystack split, settlement and reconciliation flags (BR-PAY-08). */
export function AdminPayments() {
  const table = useTableQuery({ defaults: { limit: 20, sort: '-createdAt' } });
  const { data, isLoading, error, refetch } = useAdminPayments(table.params);
  const reconcile = useReconcilePayment();
  const [checking, setChecking] = useState(null);
  const [isExporting, setExporting] = useState(false);
  const s = data?.meta?.summary;

  const columns = [
    { key: 'reference', header: 'Reference', primary: true, className: 'font-mono text-xs' },
    { key: 'createdAt', header: 'Date', sortable: true, cell: (p) => formatDateTime(p.createdAt) },
    {
      key: 'type',
      header: 'For',
      cell: (p) =>
        p.orderId ? (
          <Link to={ROUTES.admin.order(p.orderId)} className="text-primary-700 hover:underline">
            {formatOrderNumber(p.orderCode)}
          </Link>
        ) : (
          `${PAYMENT_TYPE_LABELS[p.type]} · ${p.vendorName}`
        ),
    },
    {
      key: 'amount',
      header: 'Paid',
      align: 'right',
      sortable: true,
      cell: (p) => formatNaira(p.amount),
    },
    {
      key: 'vendorShare',
      header: 'To vendor',
      align: 'right',
      hideOnMobile: true,
      cell: (p) => formatNaira(p.vendorShare),
    },
    {
      key: 'platformShare',
      header: 'To KJT',
      align: 'right',
      hideOnMobile: true,
      cell: (p) => formatNaira(p.platformShare),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => <StatusBadge status={p.status} meta={PAYMENT_STATUS_META} />,
    },
    {
      key: 'settlementStatus',
      header: 'Settlement',
      hideOnMobile: true,
      cell: (p) =>
        p.settlementStatus ? (
          <StatusBadge status={p.settlementStatus} meta={SETTLEMENT_STATUS_META} />
        ) : (
          '—'
        ),
    },
    {
      key: 'flag',
      header: 'Check',
      cell: (p) =>
        p.flag ? (
          <Badge tone="danger" title={PAYMENT_FLAG_LABELS[p.flag]}>
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            {PAYMENT_FLAG_LABELS[p.flag] ?? p.flag}
          </Badge>
        ) : p.reconciled ? (
          <Badge tone="success">Reconciled</Badge>
        ) : (
          <Badge>Waiting</Badge>
        ),
    },
  ];

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await paymentsApi.adminList({ ...table.params, page: 1, limit: 100 });
      downloadCsv(
        'kjt-payments.csv',
        toCsv(all.data, [
          { header: 'Reference', value: (p) => p.reference },
          { header: 'Date', value: (p) => p.createdAt },
          { header: 'Type', value: (p) => PAYMENT_TYPE_LABELS[p.type] },
          { header: 'Order', value: (p) => (p.orderCode ? formatOrderNumber(p.orderCode) : '') },
          { header: 'Vendor', value: (p) => p.vendorName },
          { header: 'Channel', value: (p) => PAYMENT_CHANNEL_LABELS[p.channel] ?? p.channel },
          { header: 'Paid (NGN)', value: (p) => naira(p.amount) },
          { header: 'To vendor (NGN)', value: (p) => naira(p.vendorShare) },
          { header: 'To KJT (NGN)', value: (p) => naira(p.platformShare) },
          { header: 'Paystack fee (NGN)', value: (p) => naira(p.fee) },
          { header: 'Status', value: (p) => p.status },
          { header: 'Settlement', value: (p) => p.settlementStatus ?? '' },
          { header: 'Flag', value: (p) => p.flag ?? '' },
        ]),
      );
    } catch (e) {
      toast.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Paid in this view"
          loading={isLoading}
          value={formatNaira(s?.amount ?? 0)}
        />
        <StatCard
          label="Split to vendors"
          loading={isLoading}
          value={formatNaira(s?.vendorShare ?? 0)}
        />
        <StatCard
          label="KJT Foodie share"
          loading={isLoading}
          value={formatNaira(s?.platformShare ?? 0)}
        />
        <StatCard label="Need checking" loading={isLoading} value={s?.flagged ?? 0} />
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <FilterBar
          value={table.filters}
          onChange={table.setFilters}
          fields={[
            { type: 'search', name: 'search', placeholder: 'Reference, order or vendor' },
            {
              type: 'select',
              name: 'type',
              label: 'Type',
              options: Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            },
            {
              type: 'select',
              name: 'status',
              label: 'Status',
              options: toOptions(PAYMENT_STATUS_META),
            },
            {
              type: 'select',
              name: 'settlementStatus',
              label: 'Settlement',
              options: toOptions(SETTLEMENT_STATUS_META),
            },
            { type: 'select', name: 'flagged', label: 'Flags', options: FLAGGED },
            { type: 'dateRange', name: ['from', 'to'], label: 'Date' },
          ]}
        />
        <Can permission={PERMISSIONS.REPORTS_EXPORT}>
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            loading={isExporting}
            onClick={exportCsv}
          >
            Export CSV
          </Button>
        </Can>
      </div>
      <DataTable
        caption="Payments"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        rowActions={(p) =>
          p.flag ? [{ label: 'Mark as reconciled', onSelect: () => setChecking(p) }] : []
        }
        emptyState={<EmptyState icon={CreditCard} title="No payments match these filters" />}
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
      <ReasonDialog
        open={Boolean(checking)}
        onClose={() => setChecking(null)}
        title={`Reconcile ${checking?.reference}?`}
        description={checking && PAYMENT_FLAG_LABELS[checking.flag]}
        label="How did you check it?"
        hint="For example: matched the Paystack dashboard and the bank statement."
        confirmLabel="Mark as reconciled"
        tone="primary"
        onSubmit={(note) => reconcile.mutateAsync({ id: checking.id, note })}
      />
    </div>
  );
}
