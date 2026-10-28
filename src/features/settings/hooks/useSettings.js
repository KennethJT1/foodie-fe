import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/feedback';
import { queryKeys } from '@/constants/query-keys';
import { useSyncSession } from '@/features/auth';

import { settingsApi } from '../api/settings.api';

export const usePlatformSettings = () =>
  useQuery({ queryKey: queryKeys.settings.all, queryFn: settingsApi.get });

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.update,
    onSuccess: (settings) => {
      qc.setQueryData(queryKeys.settings.all, settings);
      qc.invalidateQueries({ queryKey: queryKeys.plans.all });
    },
  });
}

export const useAdminUsers = (params) =>
  useQuery({
    queryKey: queryKeys.adminUsers.list(params),
    queryFn: () => settingsApi.adminUsers(params),
    placeholderData: keepPreviousData,
  });

const useAdminUserMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminUsers.all }),
  });
};
export const useAddAdmin = () => useAdminUserMutation(settingsApi.addAdmin);
export const useUpdateAdmin = () => useAdminUserMutation(settingsApi.updateAdmin);

export const useRoles = () =>
  useQuery({ queryKey: queryKeys.roles.all, queryFn: settingsApi.roles });

/** Saving a role refreshes the session too, in case it is the signed-in admin's own role. */
const useRoleMutation = (mutationFn, message) => {
  const qc = useQueryClient();
  const sync = useSyncSession();
  return useMutation({
    mutationFn,
    onSuccess: async (role) => {
      qc.invalidateQueries({ queryKey: queryKeys.roles.all });
      toast.success(message(role));
      await sync().catch(() => null);
    },
    onError: (e) => toast.error(e),
  });
};
export const useUpdateRole = () =>
  useRoleMutation(settingsApi.updateRole, () => 'Permissions saved');
export const useResetRole = () =>
  useRoleMutation(settingsApi.resetRole, () => 'Permissions reset to the defaults');

export const useAuditLog = (params) =>
  useQuery({
    queryKey: queryKeys.auditLog.list(params),
    queryFn: () => settingsApi.auditLog(params),
    placeholderData: keepPreviousData,
  });
