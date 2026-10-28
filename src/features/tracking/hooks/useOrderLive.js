import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { queryKeys } from '@/constants/query-keys';
import { connectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

import { applyLocationEvent, applyStatusEvent } from '../lib/live-events';

/**
 * Subscribes to `order:status` and `rider:location` for one order and writes the changes
 * straight into the React Query cache, so the page re-renders without refetching.
 */
export function useOrderLive(orderId, { enabled = true } = {}) {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!enabled || !orderId) return undefined;
    const socket = getSocket() ?? connectSocket(accessToken);
    if (!socket) return undefined;
    const key = queryKeys.orders.detail(orderId);

    const onStatus = (event) => {
      if (event?.orderId !== orderId) return;
      qc.setQueryData(key, (order) => applyStatusEvent(order, event));
      qc.invalidateQueries({ queryKey: [...queryKeys.orders.all, 'list'] });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    };
    const onLocation = (event) => {
      if (event?.orderId !== orderId) return;
      qc.setQueryData(key, (order) => applyLocationEvent(order, event));
    };

    socket.on('order:status', onStatus);
    socket.on('rider:location', onLocation);
    socket.emit('order:subscribe', { orderId });
    return () => {
      socket.off('order:status', onStatus);
      socket.off('rider:location', onLocation);
      socket.emit('order:unsubscribe', { orderId });
    };
  }, [orderId, enabled, accessToken, qc]);
}
