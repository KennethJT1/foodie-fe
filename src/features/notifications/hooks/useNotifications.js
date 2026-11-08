import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { queryKeys } from '@/constants/query-keys';
import { connectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

import { notificationsApi } from '../api/notifications.api';

/** Unread count for the bell. Polls, and refreshes at once on a `notification:new` push. */
export const useUnreadCount = () => {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const socket = getSocket() ?? connectSocket(accessToken);
    if (!socket) return undefined;
    const onNew = () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [isAuthenticated, accessToken, qc]);

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
