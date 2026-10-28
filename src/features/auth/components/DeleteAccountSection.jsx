import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ConfirmDialog, toast } from '@/components/feedback';
import { Button, Input } from '@/components/ui';
import { ROUTES } from '@/constants/routes';

import { useDeleteAccount } from '../hooks/useAuth';

/** NDPA 2023: customers can delete their account and personal data. */
export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const remove = useDeleteAccount();
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold">Delete account</h2>
      <p className="text-sm text-ink-muted">
        We remove your name, email and phone number. Order records we must keep by law stay
        anonymous.
      </p>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setTyped('');
        }}
        title="Delete your account?"
        message="This can't be undone. Type DELETE to confirm."
        confirmLabel="Delete account"
        tone="danger"
        isLoading={remove.isPending}
        onConfirm={() => {
          if (typed.trim() !== 'DELETE') return;
          remove.mutate(undefined, {
            onSuccess: () => {
              toast.success('Your account has been deleted.');
              navigate(ROUTES.home, { replace: true });
            },
            onError: (e) => toast.error(e),
          });
        }}
      >
        <Input
          label="Type DELETE"
          className="mt-3"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
      </ConfirmDialog>
    </div>
  );
}
