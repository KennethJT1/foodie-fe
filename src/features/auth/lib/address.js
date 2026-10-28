/** "12 Herbert Macaulay Way, Yaba, Lagos" */
export const formatAddress = (a) => (a ? [a.line1, a.area, a.city].filter(Boolean).join(', ') : '');

/** Field errors for an address typed into AddressPicker; empty when it can be saved. */
export function addressErrors(a = {}) {
  const errors = {};
  if (!a.line1?.trim()) errors.line1 = 'Enter the street address';
  if (!a.area?.trim()) errors.area = 'Enter the area';
  if (!a.city) errors.city = 'Pick a city';
  if (a.lat == null || a.lng == null) errors.pin = 'Drop a pin on the map so the rider finds you';
  return errors;
}
