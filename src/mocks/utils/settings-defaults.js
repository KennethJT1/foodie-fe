/** Platform settings an admin can change (BRD sections 4–5). Money in kobo. */
export const DEFAULT_SETTINGS = {
  deliveryBaseFee: 50000,
  deliveryPerKm: 15000,
  deliveryMaxFee: 300000,
  processingFeePct: 1.5,
  processingFeeFlat: 10000,
  processingFeeCap: 200000,
  riderPayoutPct: 70,
  vendorAcceptTimeoutSec: 300,
  riderOfferTimeoutSec: 30,
  trialDays: 14,
  graceDays: 3,
  yearlyDiscountPct: 15,
  refundDeadlineHours: 48,
  refundMissedAction: 'escalate',
  serviceAreas: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Enugu', 'Kano'],
  notificationTemplates: [
    {
      key: 'order_paid',
      channel: 'email',
      subject: 'We got your order',
      body: 'Hi {{name}}, your order {{orderNumber}} is with {{vendor}}.',
    },
    {
      key: 'order_on_the_way',
      channel: 'sms',
      subject: '',
      body: 'Your KJT Foodie order is on the way. Delivery code: {{code}}',
    },
    {
      key: 'vendor_new_order',
      channel: 'sms',
      subject: '',
      body: 'New order {{orderNumber}} — {{total}}. Accept within 5 min.',
    },
    {
      key: 'subscription_reminder',
      channel: 'email',
      subject: 'Your plan renews soon',
      body: 'Your {{plan}} plan renews on {{date}}.',
    },
  ],
};

/** Delivery fee from distance: base + per km, capped (BR-PAY-07). */
export function deliveryFeeFor(distanceM, s = DEFAULT_SETTINGS) {
  const fee = s.deliveryBaseFee + Math.ceil(distanceM / 1000) * s.deliveryPerKm;
  return Math.min(fee, s.deliveryMaxFee);
}

/** Paystack-style processing fee paid by the customer (BR-PAY-03). */
export function processingFeeFor(amount, s = DEFAULT_SETTINGS) {
  const fee =
    Math.round((amount * s.processingFeePct) / 100) + (amount >= 250000 ? s.processingFeeFlat : 0);
  return Math.min(fee, s.processingFeeCap);
}
