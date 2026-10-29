import { useState } from 'react';

import { ErrorState, SkeletonText } from '@/components/feedback';
import { Button, Card, CardTitle, Checkbox } from '@/components/ui';
import { ADMIN_ROLE_LABELS, ADMIN_ROLES } from '@/constants/roles';

import { useResetRole, useRoles, useUpdateRole } from '../hooks/useSettings';
import { PERMISSION_LABELS } from '../lib/permission-labels';

function RoleCard({ role, permissions }) {
  const [picked, setPicked] = useState(role.permissions);
  const save = useUpdateRole();
  const reset = useResetRole();
  const locked = role.id === ADMIN_ROLES.SUPER_ADMIN;
  const changed =
    picked.length !== role.permissions.length || picked.some((p) => !role.permissions.includes(p));
  return (
    <Card
      header={
        <CardTitle
          title={ADMIN_ROLE_LABELS[role.id] ?? role.id}
          description={locked ? 'Always has every permission.' : `${picked.length} permissions`}
        />
      }
    >
      <fieldset disabled={locked} className="grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">Permissions for {ADMIN_ROLE_LABELS[role.id]}</legend>
        {permissions.map((p) => (
          <Checkbox
            key={p}
            label={PERMISSION_LABELS[p] ?? p}
            checked={picked.includes(p)}
            onChange={(e) =>
              setPicked((list) => (e.target.checked ? [...list, p] : list.filter((x) => x !== p)))
            }
          />
        ))}
      </fieldset>
      {!locked && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            disabled={!changed}
            loading={save.isPending}
            onClick={() => save.mutate({ id: role.id, permissions: picked })}
          >
            Save {ADMIN_ROLE_LABELS[role.id]} permissions
          </Button>
          <Button
            variant="ghost"
            loading={reset.isPending}
            onClick={() => reset.mutate(role.id, { onSuccess: (r) => setPicked(r.permissions) })}
          >
            Reset to defaults
          </Button>
        </div>
      )}
    </Card>
  );
}

/** What each admin sub-role may do (FR-ACC-03). The server re-checks every permission. */
export function RolesEditor() {
  const { data, isLoading, isError, error, refetch } = useRoles();
  if (isLoading) return <SkeletonText lines={10} />;
  if (isError)
    return <ErrorState title="We couldn't load the roles" error={error} onRetry={refetch} />;
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {data.roles.map((role) => (
        <RoleCard key={role.id} role={role} permissions={data.permissions} />
      ))}
    </div>
  );
}
