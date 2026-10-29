import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useAuthStore } from '@/stores/auth-store';

import { notificationsApi } from '../api/notifications.api';

export const useUnreadCount = () => {
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  return useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: notificationsApi.unreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
};

export const useNotifications = (params) =>
  useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => notificationsApi.list(params),
    placeholderData: keepPreviousData,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
};
