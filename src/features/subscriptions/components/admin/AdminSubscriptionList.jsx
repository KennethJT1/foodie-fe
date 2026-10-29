import { CreditCard } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { DataTable, FilterBar, Pagination } from '@/components/data';
import { EmptyState, toast } from '@/components/feedback';
import { Button, Input, Modal, StatusBadge, Textarea } from '@/components/ui';
import { PERMISSIONS, hasPermission } from '@/constants/permissions';
import { ROUTES } from '@/constants/routes';
import { SUBSCRIPTION_STATUS_META, toOptions } from '@/constants/statuses';
import { useSession } from '@/features/auth';
import { useTableQuery } from '@/hooks/useTableQuery';
import { formatDate } from '@/lib/format';

import { INTERVAL_LABELS } from '../../constants';
import { useAdminSubscriptions, useExtendSubscription } from '../../hooks/useAdminSubscriptions';

function ExtendDialog({ sub, onClose }) {
  const [days, setDays] = useState('7');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const extend = useExtendSubscription();
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Extend ${sub.vendorName}'s plan`}
      description="A free extension. Expired stores become visible again straight away."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={extend.isPending}
            onClick={() =>
              extend.mutate(
                { id: sub.id, days: Number(days), reason },
                {
                  onSuccess: (r) => {
                    toast.success(
                      `${sub.vendorName}'s plan now ends ${formatDate(r.currentPeriodEnd)}`,
                    );
                    onClose();
                  },
                  onError: (e) => (e.fieldErrors ? setErrors(e.fieldErrors) : toast.error(e)),
                },
              )
            }
          >
            Extend plan
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="Days to add"
          type="number"
          min={1}
          max={365}
          value={days}
          error={errors.days}
          onChange={(e) => setDays(e.target.value)}
        />
        <Textarea
          label="Reason"
          rows={2}
          value={reason}
          error={errors.reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}

/** Every vendor subscription by status, with complimentary extensions (BR-SUB-07). */
export function AdminSubscriptionList() {
  const table = useTableQuery({ defaults: { limit: 20, sort: 'currentPeriodEnd' } });
  const { data, isLoading, error, refetch } = useAdminSubscriptions(table.params);
  const { user } = useSession();
  const canManage = hasPermission(user, PERMISSIONS.SUBSCRIPTIONS_MANAGE);
  const [extending, setExtending] = useState(null);
  const columns = [
    {
      key: 'vendorName',
      header: 'Vendor',
      primary: true,
      sortable: true,
      cell: (s) => (
        <Link
          to={ROUTES.admin.vendor(s.vendorId)}
          className="font-medium hover:text-primary-700 hover:underline"
        >
          {s.vendorName}
        </Link>
      ),
    },
    {
      key: 'planName',
      header: 'Plan',
      cell: (s) => `${s.planName} · ${INTERVAL_LABELS[s.interval]}`,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => (
        <StatusBadge
          status={s.cancelAtPeriodEnd && s.status === 'active' ? 'cancelled' : s.status}
          meta={SUBSCRIPTION_STATUS_META}
        />
      ),
    },
    {
      key: 'currentPeriodEnd',
      header: 'Ends',
      sortable: true,
      cell: (s) => formatDate(s.status === 'grace' ? s.graceEndsAt : s.currentPeriodEnd),
    },
  ];
  return (
    <div className="space-y-4">
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Vendor or plan' },
          {
            type: 'select',
            name: 'status',
            label: 'Status',
            options: toOptions(SUBSCRIPTION_STATUS_META).filter(
              (o) => !['none', 'cancelled'].includes(o.value),
            ),
          },
          {
            type: 'select',
            name: 'interval',
            label: 'Billing',
            options: Object.entries(INTERVAL_LABELS).map(([value, label]) => ({ value, label })),
          },
        ]}
      />
      <DataTable
        caption="Subscriptions"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        rowActions={
          canManage ? (s) => [{ label: 'Extend plan', onSelect: () => setExtending(s) }] : undefined
        }
        emptyState={<EmptyState icon={CreditCard} title="No subscriptions match these filters" />}
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
      {extending && <ExtendDialog sub={extending} onClose={() => setExtending(null)} />}
    </div>
  );
}
