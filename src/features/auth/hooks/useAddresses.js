import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import { addressesApi } from '../api/addresses.api';

export const useAddresses = (options = {}) =>
  useQuery({ queryKey: queryKeys.addresses.all, queryFn: addressesApi.list, ...options });

const useAddressMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses.all }),
  });
};

/** Creates when there is no id, updates otherwise. */
export const useSaveAddress = () =>
  useAddressMutation((body) => (body.id ? addressesApi.update(body) : addressesApi.create(body)));
export const useDeleteAddress = () => useAddressMutation(addressesApi.remove);
export const useSetDefaultAddress = () => useAddressMutation(addressesApi.setDefault);
