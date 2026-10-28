import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/feedback';

import { adminRidersApi } from '../api/admin-riders.api';

const KEY = ['admin', 'riders'];

export const useAdminRiders = (params, options = {}) =>
  useQuery({
    queryKey: [...KEY, 'list', params],
    queryFn: () => adminRidersApi.list(params),
    placeholderData: keepPreviousData,
    ...options,
  });

export const useAdminRider = (id) =>
  useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => adminRidersApi.get(id),
    enabled: Boolean(id),
  });

const DONE = {
  approve: 'approved',
  reject: 'rejected',
  suspend: 'suspended',
  reinstate: 'reinstated',
};

export function useRiderDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminRidersApi.decide,
    onSuccess: (rider, { action }) => {
      qc.setQueryData([...KEY, 'detail', rider.id], rider);
      qc.invalidateQueries({ queryKey: [...KEY, 'list'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success(`${rider.name} ${DONE[action]}`);
    },
    onError: (e) => toast.error(e),
  });
}

export const useAdminPayouts = (params) =>
  useQuery({
    queryKey: ['admin', 'payouts', params],
    queryFn: () => adminRidersApi.payouts(params),
    placeholderData: keepPreviousData,
  });

const usePayoutMutation = (mutationFn, message) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      toast.success(message(s));
    },
  });
};

export const useApprovePayout = () =>
  usePayoutMutation(
    adminRidersApi.approvePayout,
    (s) => `${s.riderName}'s ${s.month} statement approved`,
  );
export const useMarkPayoutPaid = () =>
  usePayoutMutation(adminRidersApi.markPayoutPaid, (s) => `${s.riderName}'s payout marked paid`);
