import { z } from 'zod';

import { koboToNaira, nairaToKobo } from '@/lib/format';
import { v } from '@/lib/validation';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const option = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Name this option').max(40, 'Keep it short'),
  price: z.coerce.number({ invalid_type_error: 'Enter a price' }).min(0, 'Use 0 for free extras'),
});

const group = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Name this group').max(40, 'Keep it short'),
  required: z.boolean(),
  max: z.coerce.number().int().min(1, 'At least 1'),
  options: z.array(option).min(1, 'Add at least one option'),
});

/** Create/edit food item. `photoLimit` comes from the vendor's plan. */
export const menuItemSchema = (photoLimit = 1) =>
  z
    .object({
      name: z.string().trim().min(2, 'Enter the food name').max(80, 'Keep it under 80 characters'),
      description: z.string().trim().max(500, 'Keep it under 500 characters').optional(),
      categoryId: z.string().min(1, 'Pick a category'),
      price: v.naira('Price'),
      portion: z.string().trim().max(40, 'Keep it short').optional(),
      prepTimeMins: z.coerce.number().int().min(5).max(120),
      photos: z
        .array(z.string())
        .min(1, 'Add at least one photo')
        .max(
          photoLimit,
          `Your plan allows ${photoLimit} photo${photoLimit > 1 ? 's' : ''} per item`,
        ),
      isAvailable: z.boolean(),
      availableDays: z.array(z.coerce.number()).min(1, 'Pick at least one day'),
      limitHours: z.boolean(),
      availableFrom: z.string().optional(),
      availableTo: z.string().optional(),
      optionGroups: z.array(group),
    })
    .superRefine((val, ctx) => {
      if (!val.limitHours) return;
      if (!TIME.test(val.availableFrom ?? ''))
        ctx.addIssue({ code: 'custom', path: ['availableFrom'], message: 'Enter a start time' });
      if (!TIME.test(val.availableTo ?? ''))
        ctx.addIssue({ code: 'custom', path: ['availableTo'], message: 'Enter an end time' });
      else if (val.availableFrom >= val.availableTo)
        ctx.addIssue({
          code: 'custom',
          path: ['availableTo'],
          message: 'The end time must be after the start time',
        });
    });

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** API item (kobo) → form values (naira). */
export const toMenuForm = (item) => ({
  name: item?.name ?? '',
  description: item?.description ?? '',
  categoryId: item?.categoryId ?? '',
  price: item ? String(koboToNaira(item.price)) : '',
  portion: item?.portion ?? '',
  prepTimeMins: String(item?.prepTimeMins ?? 20),
  photos: item?.photos ?? [],
  isAvailable: item?.isAvailable ?? true,
  availableDays: item?.availableDays ?? ALL_DAYS,
  limitHours: Boolean(item?.availableFrom),
  availableFrom: item?.availableFrom ?? '',
  availableTo: item?.availableTo ?? '',
  optionGroups: (item?.optionGroups ?? []).map((g) => ({
    ...g,
    options: g.options.map((o) => ({ ...o, price: String(koboToNaira(o.price)) })),
  })),
});

/** Form values (naira) → API body (kobo). */
export const toMenuBody = ({ limitHours, ...values }) => ({
  ...values,
  price: nairaToKobo(values.price),
  prepTimeMins: Number(values.prepTimeMins),
  availableFrom: limitHours ? values.availableFrom : null,
  availableTo: limitHours ? values.availableTo : null,
  optionGroups: values.optionGroups.map((g) => ({
    ...g,
    options: g.options.map((o) => ({ ...o, price: nairaToKobo(o.price) })),
  })),
});
