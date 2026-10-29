import { useState } from 'react';

import { ConfirmDialog, toast } from '@/components/feedback';
import { Select } from '@/components/ui';

import { useCancelOrder } from '../hooks/useOrders';

const REASONS = ['Changed my mind', 'Ordered by mistake', 'Taking too long', 'Wrong address'];

/** Cancel before the vendor accepts (FR-ORD-05). */
export function CancelOrderDialog({ order, open, onClose }) {
  const [reason, setReason] = useState(REASONS[0]);
  const cancel = useCancelOrder();
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Cancel this order?"
      message="You'll get a full refund to the card or account you paid with."
      confirmLabel="Cancel order"
      cancelLabel="Keep order"
      tone="danger"
      isLoading={cancel.isPending}
      onConfirm={() =>
        cancel.mutate(
          { id: order.id, reason },
          {
            onSuccess: () => {
              toast.success('Order cancelled. Your refund is on its way.');
              onClose();
            },
            onError: (e) => {
              toast.error(e);
              onClose();
            },
          },
        )
      }
    >
      <Select
        label="Reason"
        className="mt-3"
        options={REASONS.map((r) => ({ value: r, label: r }))}
        value={reason}
        onValueChange={setReason}
      />
    </ConfirmDialog>
  );
}
