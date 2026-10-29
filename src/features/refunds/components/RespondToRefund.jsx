import { useState } from 'react';

import { toast } from '@/components/feedback';
import { MoneyInput } from '@/components/forms';
import { Button, Input, RadioGroup, Textarea } from '@/components/ui';
import { formatDateTime, formatNaira, koboToNaira, nairaToKobo } from '@/lib/format';

import { useMarkRefundPaid, useRespondToRefund } from '../hooks/useRefunds';

const DECISIONS = [
  { value: 'full', label: 'Refund in full' },
  { value: 'partial', label: 'Refund part of it' },
  { value: 'rejected', label: 'Decline' },
];

/** BR-REF-03: accept (full or part) or decline before the deadline. */
export function RespondToRefund({ refund }) {
  const [decision, setDecision] = useState('full');
  const [amount, setAmount] = useState(String(koboToNaira(refund.amount)));
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const respond = useRespondToRefund();

  const submit = () => {
    const body =
      decision === 'rejected'
        ? { decision: 'rejected', reason }
        : {
            decision: 'accepted',
            amount: decision === 'full' ? refund.amount : nairaToKobo(amount),
            reason,
          };
    respond.mutate(
      { id: refund.id, ...body },
      {
        onSuccess: (r) =>
          toast.success(
            r.status === 'accepted'
              ? `Refund of ${formatNaira(r.amount)} accepted. Pay the customer, then mark it paid.`
              : 'Refund declined. The customer can dispute it.',
          ),
        onError: (e) => (e.fieldErrors ? setErrors(e.fieldErrors) : toast.error(e)),
      },
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">
        Answer by {formatDateTime(refund.deadline)}. If you don&apos;t, KJT Foodie steps in.
      </p>
      <RadioGroup label="Your answer" options={DECISIONS} value={decision} onChange={setDecision} />
      {decision === 'partial' && (
        <MoneyInput
          label="Amount to refund"
          hint={`Up to ${formatNaira(refund.orderSubtotal)}, the food subtotal.`}
          value={amount}
          error={errors.amount}
          onChange={setAmount}
        />
      )}
      <Textarea
        label={
          decision === 'rejected' ? 'Why are you declining?' : 'Message to the customer (optional)'
        }
        rows={2}
        maxLength={500}
        value={reason}
        error={errors.reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <Button
        variant={decision === 'rejected' ? 'danger' : 'primary'}
        loading={respond.isPending}
        onClick={submit}
      >
        {decision === 'rejected' ? 'Decline refund' : 'Accept refund'}
      </Button>
    </div>
  );
}

/** After paying the customer, record the transfer reference. */
export function MarkRefundPaid({ refund }) {
  const [reference, setReference] = useState('');
  const [error, setError] = useState(null);
  const markPaid = useMarkRefundPaid();
  return (
    <div className="space-y-3">
      <p className="text-sm">
        Send {formatNaira(refund.amount)} to {refund.customerName} (a bank transfer or a Paystack
        refund), then add the reference here.
      </p>
      <Input
        label="Payment reference"
        placeholder="TRF-20261028-1234"
        value={reference}
        error={error}
        onChange={(e) => setReference(e.target.value)}
      />
      <Button
        variant="secondary"
        loading={markPaid.isPending}
        onClick={() =>
          markPaid.mutate(
            { id: refund.id, reference },
            {
              onSuccess: () => toast.success('Marked as paid. We asked the customer to confirm.'),
              onError: (e) => setError(e.fieldErrors?.reference ?? e.message),
            },
          )
        }
      >
        Mark as paid
      </Button>
    </div>
  );
}
