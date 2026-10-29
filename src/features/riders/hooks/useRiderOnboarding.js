import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useSyncSession } from '@/features/auth';

import { ridersApi } from '../api/riders.api';

const KEY = queryKeys.riderMe.onboarding;

export const useRiderOnboarding = () => useQuery({ queryKey: KEY, queryFn: ridersApi.onboarding });

const useOnboardingMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn, onSuccess: (data) => qc.setQueryData(KEY, data) });
};

export const useSaveRiderStep = () => useOnboardingMutation(ridersApi.saveStep);

/** Sends the application and refreshes the session so RequireApproved sees "pending". */
export const useSubmitRiderOnboarding = () => {
  const sync = useSyncSession();
  return useOnboardingMutation(async () => {
    const data = await ridersApi.submit();
    await sync();
    return data;
  });
};

const useDocumentMutation = (mutationFn, patch) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result, variables) =>
      qc.setQueryData(KEY, (data) =>
        data ? { ...data, documents: patch(data.documents, result, variables) } : data,
      ),
  });
};

export const useUploadRiderDocument = () =>
  useDocumentMutation(ridersApi.uploadDocument, (docs, doc) => [
    ...docs.filter((d) => d.type !== doc.type),
    doc,
  ]);

export const useRemoveRiderDocument = () =>
  useDocumentMutation(ridersApi.removeDocument, (docs, _r, id) => docs.filter((d) => d.id !== id));
