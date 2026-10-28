import { z } from 'zod';

import { normalisePhone } from './format';

/** Reusable Zod pieces so every form words its errors the same way. */
export const v = {
  email: () =>
    z.string().trim().min(1, 'Enter your email address').email('Enter a valid email address'),
  optionalEmail: () =>
    z.string().trim().email('Enter a valid email address').optional().or(z.literal('')),
  password: () => z.string().min(8, 'Use at least 8 characters'),
  phone: () =>
    z
      .string()
      .trim()
      .min(1, 'Enter your phone number')
      .refine((p) => normalisePhone(p) != null, 'Enter a valid Nigerian phone number')
      .transform((p) => normalisePhone(p)),
  otp: () => z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  name: (what = 'name') =>
    z.string().trim().min(2, `Enter your ${what}`).max(60, 'That looks too long'),
  /** Naira typed by a person (converted to kobo before sending). */
  naira: (label = 'Amount') =>
    z.coerce
      .number({ invalid_type_error: `Enter ${label.toLowerCase()}` })
      .positive(`${label} must be more than ₦0`)
      .max(10_000_000, `${label} looks too high`),
  requiredString: (message) => z.string().trim().min(1, message),
};
