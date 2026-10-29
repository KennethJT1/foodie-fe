import { z } from 'zod';

import { v } from '@/lib/validation';

export const businessSchema = z.object({
  name: z.string().trim().min(2, 'Enter your business name').max(60, 'That looks too long'),
  description: z.string().trim().max(300, 'Keep it under 300 characters').optional(),
  phone: v.phone(),
  logo: z.string().nullable().optional(),
  cover: z.string().nullable().optional(),
});

export const accountNumberSchema = z
  .string()
  .regex(/^\d{10}$/, 'Enter the 10-digit account number');
