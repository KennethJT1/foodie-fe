/** Onboarding wizard steps in order (FR-VEN-01). */
export const ONBOARDING_STEPS = [
  { key: 'type', label: 'Vendor type' },
  { key: 'business', label: 'Business details' },
  { key: 'location', label: 'Location' },
  { key: 'documents', label: 'Documents' },
  { key: 'bank', label: 'Bank account' },
  { key: 'review', label: 'Review' },
];

export const DELIVERY_RADIUS_OPTIONS = [3, 5, 8, 10, 15, 20].map((km) => ({
  value: String(km),
  label: `${km} km`,
}));

export const PREP_TIME_OPTIONS = [10, 15, 20, 25, 30, 40, 50, 60].map((m) => ({
  value: String(m),
  label: `${m} min`,
}));
