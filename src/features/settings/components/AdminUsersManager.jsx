import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { DataTable, FilterBar, Pagination } from '@/components/data';
import { ConfirmDialog, EmptyState, toast } from '@/components/feedback';
import { Button, Input, Modal, Select, StatusBadge } from '@/components/ui';
import { ADMIN_ROLE_LABELS } from '@/constants/roles';
import { useSession } from '@/features/auth';
import { useTableQuery } from '@/hooks/useTableQuery';

import { useAddAdmin, useAdminUsers, useUpdateAdmin } from '../hooks/useSettings';

const ROLE_OPTIONS = Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_META = {
  active: { label: 'Active', tone: 'success' },
  suspended: { label: 'Suspended', tone: 'danger' },
};

function AddAdminDialog({ onClose }) {
  const [value, setValue] = useState({
    firstName: '',
    lastName: '',
    email: '',
    adminRole: 'support',
  });
  const [errors, setErrors] = useState({});
  const add = useAddAdmin();
  const set = (patch) => setValue((v) => ({ ...v, ...patch }));
  return (
    <Modal
      open
      onClose={onClose}
      title="Add an admin"
      description="We email them a link to set their password."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={add.isPending}
            onClick={() =>
              add.mutate(value, {
                onSuccess: (a) => {
                  toast.success(`${a.name} added as ${ADMIN_ROLE_LABELS[a.adminRole]}`);
                  onClose();
                },
                onError: (e) => (e.fieldErrors ? setErrors(e.fieldErrors) : toast.error(e)),
              })
            }
          >
            Add admin
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="First name"
            value={value.firstName}
            error={errors.firstName}
            onChange={(e) => set({ firstName: e.target.value })}
          />
          <Input
            label="Last name"
            value={value.lastName}
            error={errors.lastName}
            onChange={(e) => set({ lastName: e.target.value })}
          />
        </div>
        <Input
          label="Work email"
          type="email"
          value={value.email}
          error={errors.email}
          onChange={(e) => set({ email: e.target.value })}
        />
        <Select
          label="Role"
          options={ROLE_OPTIONS}
          value={value.adminRole}
          error={errors.adminRole}
          onValueChange={(adminRole) => set({ adminRole })}
        />
      </div>
    </Modal>
  );
}

/** Admin accounts: add, change role, suspend or restore (not your own). */
export function AdminUsersManager() {
  const table = useTableQuery({ defaults: { limit: 20, sort: 'name' } });
  const { data, isLoading, error, refetch } = useAdminUsers(table.params);
  const update = useUpdateAdmin();
  const { user } = useSession();
  const [isAdding, setAdding] = useState(false);
  const [toggling, setToggling] = useState(null);
  const columns = [
    { key: 'name', header: 'Name', primary: true, sortable: true },
    { key: 'email', header: 'Email', hideOnMobile: true },
    {
      key: 'adminRole',
      header: 'Role',
      cell: (a) =>
        a.id === user?.id ? (
          ADMIN_ROLE_LABELS[a.adminRole]
        ) : (
          <Select
            label={`Role for ${a.name}`}
            labelHidden
            options={ROLE_OPTIONS}
            value={a.adminRole}
            onValueChange={(adminRole) =>
              update.mutate(
                { id: a.id, adminRole },
                {
                  onSuccess: () =>
                    toast.success(`${a.name} is now ${ADMIN_ROLE_LABELS[adminRole]}`),
                  onError: (e) => toast.error(e),
                },
              )
            }
          />
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (a) => <StatusBadge status={a.status} meta={STATUS_META} />,
    },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <FilterBar
          value={table.filters}
          onChange={table.setFilters}
          fields={[
            { type: 'search', name: 'search', placeholder: 'Name or email' },
            { type: 'select', name: 'adminRole', label: 'Role', options: ROLE_OPTIONS },
          ]}
        />
        <Button onClick={() => setAdding(true)}>Add admin</Button>
      </div>
      <DataTable
        caption="Admin users"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        rowActions={(a) =>
          a.id === user?.id
            ? []
            : [
                {
                  label: a.status === 'active' ? 'Suspend admin' : 'Restore admin',
                  onSelect: () => setToggling(a),
                },
              ]
        }
        emptyState={<EmptyState icon={ShieldCheck} title="No admins match these filters" />}
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
      {isAdding && <AddAdminDialog onClose={() => setAdding(false)} />}
      <ConfirmDialog
        open={Boolean(toggling)}
        onClose={() => setToggling(null)}
        title={
          toggling?.status === 'active'
            ? `Suspend ${toggling?.name}?`
            : `Restore ${toggling?.name}?`
        }
        message={
          toggling?.status === 'active'
            ? "They won't be able to log in until you restore them."
            : undefined
        }
        confirmLabel={toggling?.status === 'active' ? 'Suspend admin' : 'Restore admin'}
        tone={toggling?.status === 'active' ? 'danger' : 'primary'}
        isLoading={update.isPending}
        onConfirm={() =>
          update.mutate(
            { id: toggling.id, status: toggling.status === 'active' ? 'suspended' : 'active' },
            { onSuccess: () => setToggling(null), onError: (e) => toast.error(e) },
          )
        }
      />
    </div>
  );
}
