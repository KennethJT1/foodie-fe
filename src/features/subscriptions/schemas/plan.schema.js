import { z } from 'zod';

import { koboToNaira, nairaToKobo } from '@/lib/format';
import { v } from '@/lib/validation';

const count = (message) => z.coerce.number({ invalid_type_error: message }).int().min(1, message);

export const planSchema = z
  .object({
    name: z.string().trim().min(2, 'Name the plan').max(40, 'Keep it short'),
    monthlyPrice: v.naira('Monthly price'),
    unlimitedItems: z.boolean(),
    menuItems: z.string().optional(),
    photosPerItem: count('At least 1').max(10, 'At most 10'),
    staff: count('At least 1'),
    featured: z.enum(['none', 'occasional', 'priority']),
    analytics: z.enum(['basic', 'full', 'export']),
    isPopular: z.boolean(),
    isRetired: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (!val.unlimitedItems && !(Number(val.menuItems) >= 1))
      ctx.addIssue({
        code: 'custom',
        path: ['menuItems'],
        message: 'At least 1, or tick unlimited',
      });
  });

export const toPlanForm = (plan) => ({
  name: plan?.name ?? '',
  monthlyPrice: plan ? String(koboToNaira(plan.monthlyPrice)) : '',
  unlimitedItems: plan ? plan.limits.menuItems == null : false,
  menuItems: plan?.limits.menuItems != null ? String(plan.limits.menuItems) : '20',
  photosPerItem: String(plan?.limits.photosPerItem ?? 1),
  staff: String(plan?.limits.staff ?? 1),
  featured: plan?.featured ?? 'none',
  analytics: plan?.analytics ?? 'basic',
  isPopular: Boolean(plan?.isPopular),
  isRetired: Boolean(plan?.isRetired),
});

export const toPlanBody = (values) => ({
  name: values.name,
  monthlyPrice: nairaToKobo(values.monthlyPrice),
  limits: {
    menuItems: values.unlimitedItems ? null : Number(values.menuItems),
    photosPerItem: Number(values.photosPerItem),
    staff: Number(values.staff),
  },
  featured: values.featured,
  analytics: values.analytics,
  isPopular: values.isPopular,
  isRetired: values.isRetired,
});
