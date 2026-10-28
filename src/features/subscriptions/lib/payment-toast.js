import { toast } from '@/components/feedback';
import { getErrorMessage } from '@/lib/api-error';

/** Plain words for a plan payment that did not go through; null when the vendor cancelled. */
export function paymentErrorMessage(error) {
  if (error?.paymentStatus === 'cancelled') return null;
  if (error?.paymentStatus === 'failed')
    return "We couldn't take that payment. Try another card or bank.";
  return getErrorMessage(error);
}

/** One message per way a plan payment can end without success. */
export function toastPaymentError(error) {
  const message = paymentErrorMessage(error);
  if (message) toast.error(message);
  else toast.info('Payment cancelled. Your plan has not changed.');
}
