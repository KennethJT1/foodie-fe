import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useSyncSession } from '@/features/auth';
import { PaymentNotCompleted, startPayment } from '@/features/payments';

import { subscriptionsApi } from '../api/subscriptions.api';

export const usePlans = () =>
  useQuery({ queryKey: queryKeys.plans.list(), queryFn: subscriptionsApi.plans });

export const useMySubscription = (options = {}) =>
  useQuery({
    queryKey: queryKeys.vendorMe.subscription,
    queryFn: subscriptionsApi.mine,
    ...options,
  });

export const useInvoices = (params) =>
  useQuery({
    queryKey: [...queryKeys.vendorMe.invoices, params],
    queryFn: () => subscriptionsApi.invoices(params),
    placeholderData: keepPreviousData,
  });

/**
 * Every plan change returns the new subscription. The session is refreshed too, so
 * RequireActiveSubscription and the banner see the new status straight away.
 */
const useSubscriptionMutation = (mutationFn) => {
  const qc = useQueryClient();
  const sync = useSyncSession();
  return useMutation({
    mutationFn,
    onSuccess: async (data) => {
      qc.setQueryData(queryKeys.vendorMe.subscription, data);
      qc.invalidateQueries({ queryKey: queryKeys.vendorMe.invoices });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      await sync().catch(() => null);
    },
  });
};

export const useStartTrial = () => useSubscriptionMutation(subscriptionsApi.startTrial);
export const useSchedulePlanChange = () => useSubscriptionMutation(subscriptionsApi.scheduleChange);
export const useCancelPlan = () => useSubscriptionMutation(subscriptionsApi.cancel);
export const useResumePlan = () => useSubscriptionMutation(subscriptionsApi.resume);

/** initialize → Paystack popup → verify. Throws PaymentNotCompleted when the popup fails. */
export const usePayForPlan = () =>
  useSubscriptionMutation(async ({ planId, interval }) => {
    const tx = await subscriptionsApi.initialize({ planId, interval });
    const result = await startPayment(tx);
    if (result.status !== 'success') throw new PaymentNotCompleted(result.status, result.message);
    return subscriptionsApi.verify(result.reference ?? tx.reference);
  });
