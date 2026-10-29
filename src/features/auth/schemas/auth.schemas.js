import { z } from 'zod';

import { v } from '@/lib/validation';

export const phoneLoginSchema = z.object({ phone: v.phone() });

export const emailLoginSchema = z.object({
  email: v.email(),
  password: z.string().min(1, 'Enter your password'),
});

export const signupSchema = z
  .object({
    firstName: v.name('first name'),
    lastName: v.name('last name'),
    email: v.optionalEmail(),
    phone: v.phone(),
    password: v.password(),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Accept the terms to continue' }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: "The passwords don't match",
  });

export const forgotSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or phone number'),
});

export const resetSchema = z
  .object({
    code: v.otp(),
    password: v.password(),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: "The passwords don't match",
  });
