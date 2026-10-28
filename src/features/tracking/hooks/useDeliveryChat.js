import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { queryKeys } from '@/constants/query-keys';
import { connectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

import { chatApi } from '../api/chat.api';

const append = (data, message) =>
  data && !data.messages.some((m) => m.id === message.id)
    ? { ...data, messages: [...data.messages, message] }
    : data;

/** Customer–rider chat for one order; new messages arrive over `chat:message`. */
export function useDeliveryChat(orderId, { enabled = true } = {}) {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const key = queryKeys.chat(orderId);
  const query = useQuery({
    queryKey: key,
    queryFn: () => chatApi.get(orderId),
    enabled: enabled && Boolean(orderId),
  });

  useEffect(() => {
    if (!enabled || !orderId) return undefined;
    const socket = getSocket() ?? connectSocket(accessToken);
    if (!socket) return undefined;
    const onMessage = (m) => {
      if (m?.orderId !== orderId) return;
      qc.setQueryData(queryKeys.chat(orderId), (data) => append(data, m));
    };
    socket.on('chat:message', onMessage);
    return () => socket.off('chat:message', onMessage);
  }, [orderId, enabled, accessToken, qc]);

  const send = useMutation({
    mutationFn: chatApi.send,
    onSuccess: (m) => qc.setQueryData(key, (data) => append(data, m)),
  });
  return { ...query, send };
}
