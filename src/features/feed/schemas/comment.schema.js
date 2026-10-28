import { z } from 'zod';

export const COMMENT_MAX = 500;

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Write a comment first')
    .max(COMMENT_MAX, `Keep it under ${COMMENT_MAX} characters`),
});

export const REPORT_REASONS = [
  'Spam',
  'Offensive language',
  'Harassment',
  'Misleading',
  'Something else',
];
