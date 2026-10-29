import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { queryKeys } from '@/constants/query-keys';
import { connectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

import { liveMapApi } from '../api/live-map.api';

/** Online riders and active deliveries; `admin:live-map` pushes fresh snapshots into the cache. */
export function useLiveMap() {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const query = useQuery({
    queryKey: queryKeys.liveMap,
    queryFn: liveMapApi.snapshot,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const socket = getSocket() ?? connectSocket(accessToken);
    if (!socket) return undefined;
    const onSnapshot = (snapshot) => qc.setQueryData(queryKeys.liveMap, snapshot);
    socket.on('admin:live-map', onSnapshot);
    socket.emit('admin:live-map:subscribe');
    return () => {
      socket.off('admin:live-map', onSnapshot);
      socket.emit('admin:live-map:unsubscribe');
    };
  }, [accessToken, qc]);

  return query;
}
