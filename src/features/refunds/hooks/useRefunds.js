import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import { refundsApi } from '../api/refunds.api';

/** Role-scoped: customers their own, vendors their store's, admins all. */
export const useRefunds = (params) =>
  useQuery({
    queryKey: queryKeys.refunds.list(params),
    queryFn: () => refundsApi.list(params),
    placeholderData: keepPreviousData,
  });

export const useRefund = (id) =>
  useQuery({
    queryKey: queryKeys.refunds.detail(id),
    queryFn: () => refundsApi.get(id),
    enabled: Boolean(id),
  });

const useRefundMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (refund) => {
      qc.setQueryData(queryKeys.refunds.detail(refund.id), refund);
      qc.invalidateQueries({ queryKey: queryKeys.refunds.all });
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(refund.orderId) });
    },
  });
};

export const useRequestRefund = () => useRefundMutation(refundsApi.create);
export const useConfirmRefund = () => useRefundMutation(refundsApi.confirm);
export const useDisputeRefund = () => useRefundMutation(refundsApi.dispute);
export const useRespondToRefund = () => useRefundMutation(refundsApi.respond);
export const useMarkRefundPaid = () => useRefundMutation(refundsApi.markPaid);
export const useCommentOnRefund = () => useRefundMutation(refundsApi.comment);
export const useEscalateRefund = () => useRefundMutation(refundsApi.escalate);
