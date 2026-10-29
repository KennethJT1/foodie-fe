import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/feedback';

import { reportsApi } from '../api/reports.api';

export const useAdminOverview = (params = { days: 14 }) =>
  useQuery({
    queryKey: ['admin', 'overview', params],
    queryFn: () => reportsApi.adminOverview(params),
    refetchInterval: 60000,
  });

export const useAdminCustomers = (params) =>
  useQuery({
    queryKey: ['admin', 'customers', params],
    queryFn: () => reportsApi.customers(params),
    placeholderData: keepPreviousData,
  });

const DONE = { active: 'restored', suspended: 'suspended', banned: 'banned' };

export function useSetCustomerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reportsApi.setCustomerStatus,
    onSuccess: (_r, { name, status }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'customers'] });
      toast.success(`${name} ${DONE[status]}`);
    },
    onError: (e) => toast.error(e),
  });
}
