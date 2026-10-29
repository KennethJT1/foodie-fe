import { useState } from 'react';

import { toast } from '@/components/feedback';
import { Button, Modal, RadioGroup, Textarea } from '@/components/ui';
import { formatOrderNumber } from '@/lib/format';

import { useRejectOrder } from '../../hooks/useVendorOrders';

const REASONS = ['Item sold out', 'Kitchen is too busy', 'Closing soon', 'Other'].map((r) => ({
  value: r,
  label: r,
}));

/** Reject with a reason the customer sees; they are refunded in full. */
export function RejectOrderDialog({ order, open, onClose }) {
  const [reason, setReason] = useState('');
  const [other, setOther] = useState('');
  const [error, setError] = useState(null);
  const reject = useRejectOrder();

  const submit = () => {
    const text = reason === 'Other' ? other.trim() : reason;
    if (!text) return setError('Tell the customer why');
    reject.mutate(
      { id: order.id, reason: text },
      {
        onSuccess: () => {
          toast.success(
            `Order ${formatOrderNumber(order.code)} rejected. The customer will be refunded.`,
          );
          onClose();
        },
        onError: (e) => setError(e.fieldErrors?.reason ?? e.message),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={`Reject order ${formatOrderNumber(order.code)}?`}
      description="The customer gets a full refund."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Keep order
          </Button>
          <Button variant="danger" loading={reject.isPending} onClick={submit}>
            Reject order
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <RadioGroup
          label="Why can't you take it?"
          options={REASONS}
          value={reason}
          error={reason === 'Other' ? undefined : error}
          onChange={(v) => {
            setReason(v);
            setError(null);
          }}
        />
        {reason === 'Other' && (
          <Textarea
            label="Reason"
            rows={2}
            maxLength={200}
            value={other}
            error={error}
            onChange={(e) => setOther(e.target.value)}
          />
        )}
      </div>
    </Modal>
  );
}
