import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/feedback';

import { adminVendorsApi } from '../api/admin-vendors.api';

const KEY = ['admin', 'vendors'];

export const useAdminVendors = (params) =>
  useQuery({
    queryKey: [...KEY, 'list', params],
    queryFn: () => adminVendorsApi.list(params),
    placeholderData: keepPreviousData,
  });

export const useAdminVendor = (id) =>
  useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => adminVendorsApi.get(id),
    enabled: Boolean(id),
  });

const DONE = {
  approve: (v) => `${v.name} approved`,
  reject: (v) => `${v.name} rejected`,
  suspend: (v) => `${v.name} suspended`,
  reinstate: (v) => `${v.name} reinstated`,
};

/** approve | reject | suspend | reinstate, then refresh the queue and the detail. */
export function useVendorDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminVendorsApi.decide,
    onSuccess: (vendor, { action }) => {
      qc.setQueryData([...KEY, 'detail', vendor.id], vendor);
      qc.invalidateQueries({ queryKey: [...KEY, 'list'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success(DONE[action](vendor));
    },
    onError: (e) => toast.error(e),
  });
}

export function useBankChangeDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminVendorsApi.bankChange,
    onSuccess: (vendor, { decision }) => {
      qc.setQueryData([...KEY, 'detail', vendor.id], vendor);
      toast.success(decision === 'approve' ? 'New bank account approved' : 'Bank change rejected');
    },
    onError: (e) => toast.error(e),
  });
}
