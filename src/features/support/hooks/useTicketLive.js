import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { connectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

/** Fallback refresh for an open thread when the socket is down or the push went elsewhere. */
export const TICKET_POLL_MS = 10_000;

/**
 * Refetches an open ticket as soon as the other side writes. Every reply already pushes a
 * `notification:new` to the person it is for (the user, or the agents), so we listen for that.
 */
export function useTicketLive(queryKey, enabled) {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const key = JSON.stringify(queryKey);

  useEffect(() => {
    if (!enabled || !accessToken) return undefined;
    const socket = getSocket() ?? connectSocket(accessToken);
    if (!socket) return undefined;
    const onNew = () => qc.invalidateQueries({ queryKey: JSON.parse(key) });
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [enabled, accessToken, key, qc]);
}
