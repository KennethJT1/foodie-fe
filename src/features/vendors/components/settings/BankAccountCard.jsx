import { Landmark } from 'lucide-react';
import { useState } from 'react';

import { toast } from '@/components/feedback';
import { Badge, Button, Card, CardTitle, Modal } from '@/components/ui';
import { BankAccountFields, useAccountCheck } from '@/features/payments';
import { formatDate } from '@/lib/format';

import { useRequestBankChange } from '../../hooks/useStore';

function BankChangeDialog({ open, onClose }) {
  const [value, setValue] = useState({ bankCode: '', accountNumber: '' });
  const [error, setError] = useState(null);
  const { isReady } = useAccountCheck(value);
  const request = useRequestBankChange();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change your bank account"
      description="Our team checks the new account before payouts move to it."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!isReady}
            loading={request.isPending}
            onClick={() =>
              request.mutate(value, {
                onSuccess: () => {
                  toast.success("Request sent. We'll let you know when it's approved.");
                  onClose();
                },
                onError: (e) => setError(e.fieldErrors?.accountNumber ?? e.message),
              })
            }
          >
            Send for approval
          </Button>
        </>
      }
    >
      <BankAccountFields
        value={value}
        error={error}
        onChange={(v) => {
          setValue(v);
          setError(null);
        }}
      />
    </Modal>
  );
}

/** Current settlement account and any change waiting for admin approval (BR-PAY-02). */
export function BankAccountCard({ store }) {
  const [isChanging, setChanging] = useState(false);
  const pending = store.bankChangeRequest?.status === 'pending' ? store.bankChangeRequest : null;
  return (
    <Card
      header={<CardTitle title="Bank account" description="Where Paystack pays your food sales." />}
    >
      {store.bank ? (
        <div className="flex items-center gap-3 text-sm">
          <Landmark className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
          <div>
            <p className="font-medium">{store.bank.accountName}</p>
            <p className="text-ink-muted">
              {store.bank.bankName} · ending {store.bank.accountNumberLast4}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">No bank account yet.</p>
      )}
      {pending ? (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="warning">Waiting for approval</Badge>
          {pending.bankName} · {pending.accountName}, sent {formatDate(pending.requestedAt)}
        </p>
      ) : (
        <Button variant="outline" className="mt-4" onClick={() => setChanging(true)}>
          Change bank account
        </Button>
      )}
      {isChanging && <BankChangeDialog open onClose={() => setChanging(false)} />}
    </Card>
  );
}
