import { toast as sonner } from 'sonner';

import { getErrorMessage } from '@/lib/api-error';

/** Toasts for small actions. Full confirmation screens are used for orders and payments. */
export const toast = {
  success: (message, opts) => sonner.success(message, opts),
  info: (message, opts) => sonner(message, opts),
  error: (errorOrMessage, opts) =>
    sonner.error(
      typeof errorOrMessage === 'string' ? errorOrMessage : getErrorMessage(errorOrMessage),
      opts,
    ),
};
