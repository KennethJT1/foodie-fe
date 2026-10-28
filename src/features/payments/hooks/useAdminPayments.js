import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/feedback';
import { queryKeys } from '@/constants/query-keys';

import { paymentsApi } from '../api/payments.api';

export const useAdminPayments = (params) =>
  useQuery({
    queryKey: queryKeys.payments.list({ scope: 'admin', ...params }),
    queryFn: () => paymentsApi.adminList(params),
    placeholderData: keepPreviousData,
  });

export function useReconcilePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paymentsApi.reconcile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payments.all });
      toast.success('Payment marked as reconciled');
    },
  });
}
