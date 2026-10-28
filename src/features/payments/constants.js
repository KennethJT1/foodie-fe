export const PAYMENT_CHANNEL_LABELS = {
  card: 'Card',
  bank_transfer: 'Bank transfer',
  ussd: 'USSD',
};

export const PAYMENT_STATUS_META = {
  success: { label: 'Paid', tone: 'success' },
  refunded: { label: 'Refunded', tone: 'info' },
  failed: { label: 'Failed', tone: 'danger' },
  pending: { label: 'Pending', tone: 'warning' },
};
