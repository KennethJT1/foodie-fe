import { ReceiptText } from 'lucide-react';

import { DataTable, Pagination } from '@/components/data';
import { EmptyState } from '@/components/feedback';
import { StatusBadge } from '@/components/ui';
import { useTableQuery } from '@/hooks/useTableQuery';
import { formatDate, formatNaira } from '@/lib/format';

import { INTERVAL_LABELS, INVOICE_STATUS_META } from '../constants';
import { useInvoices } from '../hooks/useSubscription';

const columns = [
  {
    key: 'createdAt',
    header: 'Date',
    primary: true,
    sortable: true,
    cell: (i) => formatDate(i.createdAt),
  },
  {
    key: 'planName',
    header: 'Plan',
    cell: (i) => `${i.planName} · ${INTERVAL_LABELS[i.interval]}`,
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    sortable: true,
    cell: (i) => formatNaira(i.amount),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (i) => <StatusBadge status={i.status} meta={INVOICE_STATUS_META} />,
  },
  { key: 'reference', header: 'Reference', hideOnMobile: true, className: 'font-mono text-xs' },
];

/** The vendor's subscription invoices. */
export function InvoiceTable() {
  const table = useTableQuery({ defaults: { limit: 10, sort: '-createdAt' } });
  const { data, isLoading, error, refetch } = useInvoices(table.params);
  return (
    <div className="space-y-4">
      <DataTable
        caption="Invoices"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        emptyState={
          <EmptyState
            icon={ReceiptText}
            title="No invoices yet"
            message="Your first invoice shows up here after your first plan payment."
            compact
          />
        }
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </div>
  );
}
