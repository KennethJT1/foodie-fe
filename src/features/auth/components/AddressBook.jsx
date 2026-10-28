import { MapPin, Plus } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog, EmptyState, ErrorState, Skeleton, toast } from '@/components/feedback';
import { Badge, Button, Card } from '@/components/ui';

import { AddressFormModal } from './AddressFormModal';
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from '../hooks/useAddresses';
import { formatAddress } from '../lib/address';

/** Saved delivery addresses: add, edit, delete and pick the default (FR-ACC-04). */
export function AddressBook() {
  const { data, isLoading, isError, error, refetch } = useAddresses();
  const remove = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [editing, setEditing] = useState(null); // null | 'new' | address
  const [deleting, setDeleting] = useState(null);

  const addButton = (
    <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>
      Add address
    </Button>
  );

  let body;
  if (isLoading) {
    body = (
      <div role="status" aria-label="Loading addresses" className="space-y-3">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
      </div>
    );
  } else if (isError) {
    body = <ErrorState title="We couldn't load your addresses" error={error} onRetry={refetch} />;
  } else if (!data.length) {
    body = (
      <EmptyState
        icon={MapPin}
        title="No saved addresses"
        message="Save your home or office so checkout is quicker next time."
        action={addButton}
      />
    );
  } else {
    body = (
      <ul className="grid gap-3 md:grid-cols-2">
        {data.map((a) => (
          <li key={a.id}>
            <Card padding="sm" className="flex h-full flex-col gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-600" aria-hidden="true" />
                <h2 className="font-semibold">{a.label}</h2>
                {a.isDefault && <Badge tone="brand">Default</Badge>}
              </div>
              <p className="text-sm">{formatAddress(a)}</p>
              {a.directions && <p className="text-sm text-ink-muted">{a.directions}</p>}
              <div className="mt-auto flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                  Edit
                </Button>
                {!a.isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDefault.mutate(a.id, {
                        onSuccess: () => toast.success(`${a.label} is now your default address`),
                        onError: (e) => toast.error(e),
                      })
                    }
                  >
                    Make default
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger"
                  onClick={() => setDeleting(a)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-4">
      {!isLoading && !isError && data.length > 0 && (
        <div className="flex justify-end">{addButton}</div>
      )}
      {body}
      {editing && (
        <AddressFormModal
          open
          address={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this address?"
        message={deleting ? formatAddress(deleting) : ''}
        confirmLabel="Delete address"
        tone="danger"
        isLoading={remove.isPending}
        onConfirm={() =>
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success('Address deleted');
              setDeleting(null);
            },
            onError: (e) => toast.error(e),
          })
        }
      />
    </div>
  );
}
