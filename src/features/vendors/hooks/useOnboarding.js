import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useSyncSession } from '@/features/auth';

import { banksApi, onboardingApi } from '../api/onboarding.api';

export const useOnboarding = (options = {}) =>
  useQuery({ queryKey: queryKeys.vendorMe.onboarding, queryFn: onboardingApi.get, ...options });

const useOnboardingMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => qc.setQueryData(queryKeys.vendorMe.onboarding, data),
  });
};

export const useSaveOnboardingStep = () => useOnboardingMutation(onboardingApi.saveStep);

/** Sends the application for review and refreshes the session so the guards see "pending". */
export const useSubmitOnboarding = () => {
  const sync = useSyncSession();
  return useOnboardingMutation(async () => {
    const data = await onboardingApi.submit();
    await sync();
    return data;
  });
};

/** Keeps the cached onboarding documents in step with uploads and removals. */
const useDocumentMutation = (mutationFn, patch) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result, variables) =>
      qc.setQueryData(queryKeys.vendorMe.onboarding, (data) =>
        data ? { ...data, documents: patch(data.documents, result, variables) } : data,
      ),
  });
};

export const useUploadDocument = () =>
  useDocumentMutation(onboardingApi.uploadDocument, (docs, doc) => [
    ...docs.filter((d) => d.type !== doc.type),
    doc,
  ]);

export const useRemoveDocument = () =>
  useDocumentMutation(onboardingApi.removeDocument, (docs, _result, id) =>
    docs.filter((d) => d.id !== id),
  );

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
