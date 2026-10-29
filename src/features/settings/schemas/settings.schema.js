import { z } from 'zod';

import { koboToNaira, nairaToKobo } from '@/lib/format';

const num = (label, min, max) =>
  z.coerce
    .number({ invalid_type_error: `Enter the ${label}` })
    .min(min, `The ${label} can't be less than ${min}`)
    .max(max, `The ${label} can't be more than ${max}`);

export const settingsSchema = z
  .object({
    deliveryBaseFee: num('base fee', 0, 10000),
    deliveryPerKm: num('fee per km', 0, 5000),
    deliveryMaxFee: num('maximum fee', 0, 50000),
    riderPayoutPct: num('rider payout', 0, 100),
    riderOfferTimeoutSec: num('offer timeout', 10, 120),
    vendorAcceptTimeoutMin: num('accept timeout', 1, 30),
    trialDays: num('trial length', 0, 90),
    graceDays: num('grace period', 0, 14),
    yearlyDiscountPct: num('yearly discount', 0, 50),
    refundDeadlineHours: num('refund deadline', 1, 168),
    refundMissedAction: z.enum(['escalate', 'warn', 'suspend']),
    serviceAreas: z.array(z.string().trim().min(1)).min(1, 'Keep at least one city'),
    notificationTemplates: z.array(
      z.object({
        key: z.string(),
        channel: z.string(),
        subject: z.string().trim().max(120).optional(),
        body: z.string().trim().min(1, 'Write the message').max(1000),
      }),
    ),
  })
  .refine((v) => v.deliveryMaxFee >= v.deliveryBaseFee, {
    path: ['deliveryMaxFee'],
    message: 'The maximum fee must be at least the base fee',
  });

/** API (kobo, seconds) → form (naira, minutes). */
export const toSettingsForm = (s) => ({
  deliveryBaseFee: String(koboToNaira(s.deliveryBaseFee)),
  deliveryPerKm: String(koboToNaira(s.deliveryPerKm)),
  deliveryMaxFee: String(koboToNaira(s.deliveryMaxFee)),
  riderPayoutPct: String(s.riderPayoutPct),
  riderOfferTimeoutSec: String(s.riderOfferTimeoutSec),
  vendorAcceptTimeoutMin: String(Math.round(s.vendorAcceptTimeoutSec / 60)),
  trialDays: String(s.trialDays),
  graceDays: String(s.graceDays),
  yearlyDiscountPct: String(s.yearlyDiscountPct),
  refundDeadlineHours: String(s.refundDeadlineHours),
  refundMissedAction: s.refundMissedAction,
  serviceAreas: s.serviceAreas,
  notificationTemplates: s.notificationTemplates,
});

/** Form → API body. */
export const toSettingsBody = ({ vendorAcceptTimeoutMin, ...v }) => ({
  ...v,
  deliveryBaseFee: nairaToKobo(v.deliveryBaseFee),
  deliveryPerKm: nairaToKobo(v.deliveryPerKm),
  deliveryMaxFee: nairaToKobo(v.deliveryMaxFee),
  vendorAcceptTimeoutSec: vendorAcceptTimeoutMin * 60,
});
