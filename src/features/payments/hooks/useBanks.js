import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import { banksApi } from '../api/banks.api';

export const useBanks = () =>
  useQuery({ queryKey: queryKeys.banks.all, queryFn: banksApi.list, staleTime: Infinity });

/** Looks up the account name once a bank and a 10-digit number are entered. */
export const useResolveAccount = ({ bankCode, accountNumber }) =>
  useQuery({
    queryKey: queryKeys.banks.resolve({ bankCode, accountNumber }),
    queryFn: () => banksApi.resolve({ bankCode, accountNumber }),
    enabled: Boolean(bankCode) && /^\d{10}$/.test(accountNumber ?? ''),
    staleTime: Infinity,
    retry: false,
  });
