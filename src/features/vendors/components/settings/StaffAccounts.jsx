import { Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ConfirmDialog, EmptyState, ErrorState, SkeletonText, toast } from '@/components/feedback';
import { Badge, Button, Card, CardTitle, IconButton, Input, Modal, Select } from '@/components/ui';
import { ROUTES } from '@/constants/routes';

import { useAddStaff, useRemoveStaff, useStaff } from '../../hooks/useStore';

const ROLES = [
  { value: 'manager', label: 'Manager: orders, menu and refunds' },
  { value: 'kitchen', label: 'Kitchen: live orders only' },
];
const ROLE_LABELS = { manager: 'Manager', kitchen: 'Kitchen' };

function AddStaffDialog({ open, onClose }) {
  const [value, setValue] = useState({ name: '', email: '', role: 'kitchen' });
  const [errors, setErrors] = useState({});
  const add = useAddStaff();
  const set = (patch) => setValue((v) => ({ ...v, ...patch }));
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a staff login"
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
                onSuccess: () => {
                  toast.success(`Invite sent to ${value.email}`);
                  onClose();
                },
                onError: (e) => (e.fieldErrors ? setErrors(e.fieldErrors) : toast.error(e)),
              })
            }
          >
            Send invite
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="Full name"
          value={value.name}
          error={errors.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          value={value.email}
          error={errors.email}
          onChange={(e) => set({ email: e.target.value })}
        />
        <Select
          label="Role"
          options={ROLES}
          value={value.role}
          error={errors.role}
          onValueChange={(role) => set({ role })}
        />
      </div>
    </Modal>
  );
}

/** Staff logins within the plan limit (BRD section 4). */
export function StaffAccounts() {
  const { data, isLoading, isError, error, refetch } = useStaff();
  const remove = useRemoveStaff();
  const [isAdding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const isFull = data && data.staff.length >= data.limit;

  return (
    <Card
      header={
        <CardTitle
          title="Staff accounts"
          description={
            data ? `${data.staff.length} of ${data.limit} on your ${data.planName} plan` : undefined
          }
          action={
            data &&
            (isFull ? (
              <Button asChild size="sm" variant="outline">
                <Link to={ROUTES.vendor.plans}>Upgrade</Link>
              </Button>
            ) : (
              <Button size="sm" onClick={() => setAdding(true)}>
                Add staff
              </Button>
            ))
          }
        />
      }
    >
      {isLoading ? (
        <SkeletonText lines={3} />
      ) : isError ? (
        <ErrorState compact title="We couldn't load your staff" error={error} onRetry={refetch} />
      ) : data.staff.length ? (
        <ul className="divide-y divide-surface-border">
          {data.staff.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.name}</p>
                <p className="truncate text-ink-muted">{s.email}</p>
              </div>
              <Badge>{ROLE_LABELS[s.role]}</Badge>
              <IconButton icon={Trash2} label={`Remove ${s.name}`} onClick={() => setRemoving(s)} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          compact
          icon={Users}
          title="No staff yet"
          message="Give your team their own login for the live orders screen."
        />
      )}
      {isAdding && <AddStaffDialog open onClose={() => setAdding(false)} />}
      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.name}?`}
        message="They won't be able to log in any more."
        confirmLabel="Remove staff"
        tone="danger"
        isLoading={remove.isPending}
        onConfirm={() =>
          remove.mutate(removing.id, {
            onSuccess: () => {
              toast.success(`${removing.name} removed`);
              setRemoving(null);
            },
            onError: (e) => toast.error(e),
          })
        }
      />
    </Card>
  );
}
