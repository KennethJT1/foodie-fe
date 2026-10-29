/** Status values shared by several features, each with a label and a fixed badge tone. */

export const APPROVAL_STATUS = Object.freeze({
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
});

export const APPROVAL_STATUS_META = {
  draft: { label: 'Not submitted', tone: 'neutral' },
  pending: { label: 'Pending review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  suspended: { label: 'Suspended', tone: 'danger' },
};

export const SUBSCRIPTION_STATUS = Object.freeze({
  NONE: 'none',
  TRIAL: 'trial',
  ACTIVE: 'active',
  GRACE: 'grace',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
});

export const SUBSCRIPTION_STATUS_META = {
  none: { label: 'No plan', tone: 'neutral' },
  trial: { label: 'Free trial', tone: 'info' },
  active: { label: 'Active', tone: 'success' },
  grace: { label: 'Payment failed', tone: 'warning' },
  expired: { label: 'Expired', tone: 'danger' },
  cancelled: { label: 'Ends at period end', tone: 'warning' },
};

export const REFUND_STATUS = Object.freeze({
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  PAID: 'paid',
  CONFIRMED: 'confirmed',
  DISPUTED: 'disputed',
  ESCALATED: 'escalated',
});

export const REFUND_STATUS_META = {
  requested: { label: 'Waiting for vendor', tone: 'warning' },
  accepted: { label: 'Accepted', tone: 'info' },
  rejected: { label: 'Rejected', tone: 'danger' },
  paid: { label: 'Marked paid', tone: 'info' },
  confirmed: { label: 'Received', tone: 'success' },
  disputed: { label: 'Disputed', tone: 'danger' },
  escalated: { label: 'Escalated', tone: 'danger' },
};

export const SETTLEMENT_STATUS_META = {
  settling: { label: 'Settling', tone: 'warning' },
  settled: { label: 'Settled', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
};

export const PAYOUT_STATUS_META = {
  draft: { label: 'Draft', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'info' },
  paid: { label: 'Paid', tone: 'success' },
};

export const TICKET_STATUS_META = {
  open: { label: 'Open', tone: 'warning' },
  pending: { label: 'Waiting on you', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
};

export const VENDOR_TYPES = Object.freeze({ RESTAURANT: 'restaurant', HOME_COOK: 'home_cook' });

export const VENDOR_TYPE_LABELS = { restaurant: 'Registered restaurant', home_cook: 'Home cook' };

export const toOptions = (meta) =>
  Object.entries(meta).map(([value, m]) => ({ value, label: m.label }));
