import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/feedback';
import { queryKeys } from '@/constants/query-keys';

import { subscriptionsApi } from '../api/subscriptions.api';

export const useAdminPlans = () =>
  useQuery({
    queryKey: queryKeys.plans.list({ scope: 'admin' }),
    queryFn: subscriptionsApi.adminPlans,
  });

export function useSavePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscriptionsApi.savePlan,
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: queryKeys.plans.all });
      toast.success(`${plan.name} saved`);
    },
  });
}

export const useAdminSubscriptions = (params) =>
  useQuery({
    queryKey: queryKeys.subscriptions.list(params),
    queryFn: () => subscriptionsApi.adminList(params),
    placeholderData: keepPreviousData,
  });

export function useExtendSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscriptionsApi.extend,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.subscriptions.all }),
  });
}
