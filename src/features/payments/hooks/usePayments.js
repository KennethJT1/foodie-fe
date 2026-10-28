import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import { paymentsApi } from '../api/payments.api';
import { startPayment } from '../startPayment';

export const usePaymentHistory = (params) =>
  useQuery({
    queryKey: queryKeys.payments.list({ scope: 'me', ...params }),
    queryFn: () => paymentsApi.history(params),
    placeholderData: keepPreviousData,
  });

/** Thrown when the popup closes without a successful payment. */
export class PaymentNotCompleted extends Error {
  constructor(status, message) {
    super(message ?? status);
    this.paymentStatus = status;
  }
}

/**
 * initialize → Paystack popup → verify. The order is created by verify, only after the
 * gateway confirms payment (FR-ORD-03). Resolves the verify result `{ status, order }`.
 */
export function usePayAndPlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      const tx = await paymentsApi.initialize(input);
      const result = await startPayment(tx);
      if (result.status !== 'success') throw new PaymentNotCompleted(result.status, result.message);
      return paymentsApi.verify(result.reference ?? tx.reference);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      qc.invalidateQueries({ queryKey: queryKeys.payments.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
