import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { getErrorMessage } from '@/lib/api-error';

/**
 * Asks for a reason before a decision (reject, suspend, ban). `onSubmit(reason)` returns a
 * promise; the dialog closes when it resolves and shows the error when it fails.
 */
export function ReasonDialog({
  open,
  onClose,
  onSubmit,
  title,
  description,
  label = 'Reason',
  hint,
  confirmLabel,
  tone = 'danger',
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setSaving] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return setError('Give a reason');
    setSaving(true);
    try {
      await onSubmit(reason.trim());
      setReason('');
      onClose();
    } catch (e) {
      setError(e?.fieldErrors?.reason ?? getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={isSaving}
            onClick={submit}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Textarea
        label={label}
        hint={hint}
        rows={3}
        maxLength={500}
        value={reason}
        error={error}
        onChange={(e) => {
          setReason(e.target.value);
          setError(null);
        }}
      />
    </Modal>
  );
}
