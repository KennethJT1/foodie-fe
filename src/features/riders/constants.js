export const RIDER_ONBOARDING_STEPS = [
  { key: 'vehicle', label: 'Vehicle and licence' },
  { key: 'guarantor', label: 'Guarantor' },
  { key: 'documents', label: 'Documents' },
  { key: 'bank', label: 'Bank account' },
  { key: 'review', label: 'Review' },
];

export const VEHICLE_OPTIONS = [
  { value: 'motorcycle', label: 'Motorbike', description: 'Most deliveries in the city.' },
  { value: 'bicycle', label: 'Bicycle', description: 'Short trips. No plate number needed.' },
  { value: 'car', label: 'Car', description: 'Large orders and longer trips.' },
];

export const VEHICLE_LABELS = Object.fromEntries(VEHICLE_OPTIONS.map((v) => [v.value, v.label]));
