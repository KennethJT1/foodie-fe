import { ConfirmDialog } from '@/components/feedback';

/** "Start a new cart?" — a cart holds food from one vendor per order. */
export function NewCartDialog({ open, currentVendor, newVendor, onConfirm, onClose }) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Start a new cart?"
      message={`Your cart has food from ${currentVendor?.name ?? 'another vendor'}. Each order comes from one vendor, so starting a new cart removes it and adds this from ${newVendor?.name ?? 'this vendor'}.`}
      confirmLabel="Start new cart"
      cancelLabel="Keep my cart"
    />
  );
}
