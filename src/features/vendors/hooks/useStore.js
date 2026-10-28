import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import { storeApi } from '../api/store.api';

export const useStoreSettings = () =>
  useQuery({ queryKey: queryKeys.vendorMe.profile, queryFn: storeApi.get });

const useStoreMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (store) => {
      qc.setQueryData(queryKeys.vendorMe.profile, store);
      qc.invalidateQueries({ queryKey: queryKeys.vendorMe.all });
      qc.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
};

export const useUpdateStore = () => useStoreMutation(storeApi.update);
export const useRequestBankChange = () => useStoreMutation(storeApi.requestBankChange);

export const useStaff = () =>
  useQuery({ queryKey: queryKeys.vendorMe.staff, queryFn: storeApi.staff });

const useStaffMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.vendorMe.staff }),
  });
};

export const useAddStaff = () => useStaffMutation(storeApi.addStaff);
export const useRemoveStaff = () => useStaffMutation(storeApi.removeStaff);
