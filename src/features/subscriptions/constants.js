export const BILLING_INTERVALS = Object.freeze({ MONTHLY: 'monthly', YEARLY: 'yearly' });

export const INTERVAL_LABELS = { monthly: 'Monthly', yearly: 'Yearly' };

export const INVOICE_STATUS_META = {
  paid: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
};

/** Days before the trial ends when the banner starts showing (BR-SUB-04). */
export const TRIAL_REMINDER_DAYS = 7;
