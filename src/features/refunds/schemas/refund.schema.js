import { z } from 'zod';

import { formatNaira } from '@/lib/format';
import { v } from '@/lib/validation';

/** Amount is typed in naira and capped at the food subtotal (kobo). */
export const refundRequestSchema = (subtotalKobo) =>
  z.object({
    reason: v.requiredString('Pick a reason'),
    details: z.string().trim().max(500, 'Keep it under 500 characters').optional(),
    amount: v
      .naira('Amount')
      .refine(
        (naira) => Math.round(naira * 100) <= subtotalKobo,
        `You can ask for up to ${formatNaira(subtotalKobo)}`,
      ),
    photos: z.array(z.string()).max(3, 'Add up to 3 photos').default([]),
  });

export const disputeSchema = z.object({
  reason: v.requiredString('Tell us what went wrong').pipe(z.string().max(500)),
});
