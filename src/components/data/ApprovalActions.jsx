import { useState } from 'react';

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { ReasonDialog } from '@/components/feedback/ReasonDialog';
import { Button } from '@/components/ui/Button';

/**
 * Approve / reject (pending), suspend (approved) or reinstate (suspended) with a reason where
 * one is needed. Each handler returns a promise. `noun` reads "vendor" or "rider".
 */
export function ApprovalActions({
  status,
  name,
  noun,
  onApprove,
  onReject,
  onSuspend,
  onReinstate,
}) {
  const [dialog, setDialog] = useState(null);
  const [isBusy, setBusy] = useState(false);
  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      setDialog(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'pending' && (
        <>
          <Button variant="secondary" onClick={() => setDialog('approve')}>
            Approve {noun}
          </Button>
          <Button variant="outline" onClick={() => setDialog('reject')}>
            Reject {noun}
          </Button>
        </>
      )}
      {status === 'approved' && onSuspend && (
        <Button variant="outline" onClick={() => setDialog('suspend')}>
          Suspend {noun}
        </Button>
      )}
      {status === 'suspended' && onReinstate && (
        <Button onClick={() => setDialog('reinstate')}>Reinstate {noun}</Button>
      )}
      <ConfirmDialog
        open={dialog === 'approve'}
        onClose={() => setDialog(null)}
        title={`Approve ${name}?`}
        message="They'll be told straight away and can start using KJT Foodie."
        confirmLabel={`Approve ${noun}`}
        isLoading={isBusy}
        onConfirm={() => run(onApprove).catch(() => null)}
      />
      <ConfirmDialog
        open={dialog === 'reinstate'}
        onClose={() => setDialog(null)}
        title={`Reinstate ${name}?`}
        confirmLabel={`Reinstate ${noun}`}
        isLoading={isBusy}
        onConfirm={() => run(onReinstate).catch(() => null)}
      />
      <ReasonDialog
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        title={`Reject ${name}?`}
        description="They see this reason and can fix their application."
        label="What needs fixing?"
        confirmLabel={`Reject ${noun}`}
        onSubmit={onReject}
      />
      <ReasonDialog
        open={dialog === 'suspend'}
        onClose={() => setDialog(null)}
        title={`Suspend ${name}?`}
        description="They can't use KJT Foodie until you reinstate them."
        confirmLabel={`Suspend ${noun}`}
        onSubmit={onSuspend}
      />
    </div>
  );
}
