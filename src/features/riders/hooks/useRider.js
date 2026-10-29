import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { queryKeys } from '@/constants/query-keys';
import { useSyncSession } from '@/features/auth';
import { connectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

import { ridersApi } from '../api/riders.api';

const K = queryKeys.riderMe;

export const useRiderProfile = () => useQuery({ queryKey: K.profile, queryFn: ridersApi.me });

/** Online/offline; refreshes the session so the rest of the app sees the change. */
export function useSetOnline() {
  const qc = useQueryClient();
  const sync = useSyncSession();
  return useMutation({
    mutationFn: ridersApi.setStatus,
    onSuccess: async (profile) => {
      qc.setQueryData(K.profile, profile);
      if (!profile.isOnline) qc.setQueryData(K.offers, []);
      await sync().catch(() => null);
    },
  });
}

export const useJobOffers = ({ enabled }) =>
  useQuery({ queryKey: K.offers, queryFn: ridersApi.offers, enabled });

/**
 * While online: tells the server this rider is at the app (`rider:subscribe`) and drops new
 * `rider:job:offer` events straight into the offers cache.
 */
export function useRiderSocket({ riderId, isOnline }) {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  useEffect(() => {
    if (!riderId || !isOnline) return undefined;
    const socket = getSocket() ?? connectSocket(accessToken);
    if (!socket) return undefined;
    const onOffer = (offer) => {
      if (offer?.riderId !== riderId) return;
      qc.setQueryData(K.offers, (list = []) => [offer, ...list.filter((o) => o.id !== offer.id)]);
      navigator.vibrate?.([200, 100, 200]);
    };
    socket.on('rider:job:offer', onOffer);
    socket.emit('rider:subscribe', { riderId });
    return () => {
      socket.off('rider:job:offer', onOffer);
      socket.emit('rider:unsubscribe', { riderId });
    };
  }, [riderId, isOnline, accessToken, qc]);
}

/** Sends `rider:location` every `everyMs` (5–10 s) while online and the position is known. */
export function useLocationBroadcast({ riderId, enabled, position, everyMs = 8000 }) {
  const latest = useRef(position);
  latest.current = position;
  const hasPosition = Boolean(position);
  useEffect(() => {
    if (!enabled || !riderId || !hasPosition) return undefined;
    const send = () => {
      const p = latest.current;
      if (p) getSocket()?.emit('rider:location', { riderId, ...p });
    };
    send();
    const timer = setInterval(send, everyMs);
    return () => clearInterval(timer);
  }, [enabled, riderId, hasPosition, everyMs]);
}

export function useAcceptOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ridersApi.acceptOffer,
    onSuccess: (delivery) => {
      qc.setQueryData(K.activeDelivery, delivery);
      qc.setQueryData(K.offers, []);
    },
    onError: () => qc.invalidateQueries({ queryKey: K.offers }),
  });
}

export function useDeclineOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ridersApi.declineOffer,
    onSettled: (_data, _error, id) =>
      qc.setQueryData(K.offers, (list = []) => list.filter((o) => o.id !== id)),
  });
}

export const useActiveDelivery = (options = {}) =>
  useQuery({ queryKey: K.activeDelivery, queryFn: ridersApi.activeDelivery, ...options });

export function usePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ridersApi.pickup,
    onSuccess: (delivery) => qc.setQueryData(K.activeDelivery, delivery),
  });
}

export function useCompleteDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ridersApi.complete,
    onSuccess: () => {
      qc.setQueryData(K.activeDelivery, null);
      qc.invalidateQueries({ queryKey: K.all });
    },
  });
}

export const useTrips = (params) =>
  useQuery({
    queryKey: K.trips(params),
    queryFn: () => ridersApi.trips(params),
    placeholderData: keepPreviousData,
  });

export const useEarnings = () => useQuery({ queryKey: K.earnings, queryFn: ridersApi.earnings });
export const useStatements = () =>
  useQuery({ queryKey: K.statements, queryFn: ridersApi.statements });
