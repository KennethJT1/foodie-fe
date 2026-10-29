import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

/**
 * Asks before a risky action. Buttons say what happens ("Reject order"), never "OK".
 * `onConfirm` may return a promise; the button shows loading until it settles.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  isLoading = false,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={isLoading}
            onClick={onConfirm}
            data-autofocus
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p className="text-sm text-ink-muted">{message}</p>}
      {children}
    </Modal>
  );
}
