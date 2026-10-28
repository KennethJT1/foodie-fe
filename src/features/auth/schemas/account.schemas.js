import { z } from 'zod';

import { v } from '@/lib/validation';

export const profileSchema = z.object({
  firstName: v.name('first name'),
  lastName: v.name('last name'),
  email: v.optionalEmail(),
});
