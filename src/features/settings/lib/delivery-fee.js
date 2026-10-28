/** Same formula as the server (BR-PAY-07): base + per km (whole km, rounded up), capped. Kobo. */
export const previewDeliveryFee = ({ base, perKm, max }, km) =>
  Math.min(base + Math.ceil(km) * perKm, max);
