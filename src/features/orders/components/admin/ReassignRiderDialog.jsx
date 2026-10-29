import { useState } from 'react';

import { EmptyState, ErrorState, SkeletonText, toast } from '@/components/feedback';
import { Button, Modal, RadioGroup } from '@/components/ui';
import { useAdminRiders, VEHICLE_LABELS } from '@/features/riders';
import { formatDistance, formatOrderNumber, formatRating } from '@/lib/format';

import { useReassignOrder } from '../../hooks/useVendorOrders';

/** Pick a free online rider, nearest to the vendor first, and move the order to them. */
export function ReassignRiderDialog({ order, open, onClose }) {
  const riders = useAdminRiders({ nearOrderId: order.id, limit: 10 }, { enabled: open });
  const reassign = useReassignOrder();
  const [riderId, setRiderId] = useState('');
  const [error, setError] = useState(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reassign ${formatOrderNumber(order.code)}`}
      description="Free online riders, nearest to the vendor first."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!riderId}
            loading={reassign.isPending}
            onClick={() =>
              reassign.mutate(
                { id: order.id, riderId },
                {
                  onSuccess: (o) => {
                    toast.success(`${formatOrderNumber(o.code)} reassigned to ${o.rider?.name}`);
                    onClose();
                  },
                  onError: (e) => setError(e.fieldErrors?.riderId ?? e.message),
                },
              )
            }
          >
            Reassign order
          </Button>
        </>
      }
    >
      {riders.isLoading ? (
        <SkeletonText lines={4} />
      ) : riders.isError ? (
        <ErrorState
          compact
          title="We couldn't load riders"
          error={riders.error}
          onRetry={riders.refetch}
        />
      ) : riders.data.data.length ? (
        <RadioGroup
          label="Rider"
          value={riderId}
          error={error}
          onChange={(v) => {
            setRiderId(v);
            setError(null);
          }}
          options={riders.data.data.map((r) => ({
            value: r.id,
            label: r.name,
            description: [
              VEHICLE_LABELS[r.vehicleType],
              r.distanceM != null && `${formatDistance(r.distanceM)} from the vendor`,
              `${formatRating(r.rating)} rating`,
            ]
              .filter(Boolean)
              .join(' · '),
          }))}
        />
      ) : (
        <EmptyState compact title="No free riders online" message="Try again in a minute or two." />
      )}
    </Modal>
  );
}
