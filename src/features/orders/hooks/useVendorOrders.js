import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { toast } from '@/components/feedback';
import { queryKeys } from '@/constants/query-keys';
import { formatNaira, formatOrderNumber } from '@/lib/format';
import { connectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

import { ordersApi } from '../api/orders.api';
import { playNewOrderSound } from '../lib/new-order-sound';

const useVendorOrderMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (order) => {
      qc.setQueryData(queryKeys.orders.detail(order.id), order);
      qc.invalidateQueries({ queryKey: [...queryKeys.orders.all, 'list'] });
      qc.invalidateQueries({ queryKey: queryKeys.vendorMe.all });
    },
  });
};

export const useAcceptOrder = () => useVendorOrderMutation(ordersApi.accept);
export const useRejectOrder = () => useVendorOrderMutation(ordersApi.reject);
export const useMarkPreparing = () => useVendorOrderMutation(ordersApi.markPreparing);
export const useMarkReady = () => useVendorOrderMutation(ordersApi.markReady);

/**
 * While a vendor is signed in: tells the server they are at the dashboard (`vendor:subscribe`),
 * and on `vendor:order:new` plays a sound, shows a toast and refreshes the queue.
 */
export function useNewOrderAlerts() {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const vendorId = useAuthStore((s) => s.user?.vendor?.id);

  useEffect(() => {
    if (!vendorId) return undefined;
    const socket = getSocket() ?? connectSocket(accessToken);
    if (!socket) return undefined;
    const onNewOrder = (event) => {
      if (event?.vendorId !== vendorId) return;
      playNewOrderSound();
      toast.success(`New order ${formatOrderNumber(event.code)} – ${formatNaira(event.total)}`, {
        description: 'Accept it before the timer runs out.',
      });
      qc.invalidateQueries({ queryKey: [...queryKeys.orders.all, 'list'] });
      qc.invalidateQueries({ queryKey: queryKeys.vendorMe.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    };
    socket.on('vendor:order:new', onNewOrder);
    socket.emit('vendor:subscribe', { vendorId });
    return () => {
      socket.off('vendor:order:new', onNewOrder);
      socket.emit('vendor:unsubscribe', { vendorId });
    };
  }, [vendorId, accessToken, qc]);
}

/** Dispatch moves an order to another rider before pickup. */
export const useReassignOrder = () => useVendorOrderMutation(ordersApi.reassign);
