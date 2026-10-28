import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { queryKeys } from '@/constants/query-keys';
import { refreshAccessToken } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';

import { authApi } from '../api/auth.api';

/** Current session from the store (client state). */
export const useSession = () => {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  return {
    user,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'idle',
  };
};

/** Tries a silent refresh once when the app loads (refresh token is an httpOnly cookie). */
export function useSessionBootstrap() {
  const status = useAuthStore((s) => s.status);
  useEffect(() => {
    if (status !== 'idle') return;
    refreshAccessToken().catch(() => useAuthStore.getState().setAnonymous());
  }, [status]);
}

const useStartSession = () => {
  const qc = useQueryClient();
  return (data) => {
    qc.clear();
    useAuthStore.getState().setSession(data);
    return data;
  };
};

export const useLogin = () => {
  const start = useStartSession();
  return useMutation({ mutationFn: (body) => authApi.login(body).then(start) });
};

export const useGoogleSignIn = () => {
  const start = useStartSession();
  return useMutation({ mutationFn: (body) => authApi.google(body).then(start) });
};

export const useVerifyOtp = () => {
  const start = useStartSession();
  return useMutation({ mutationFn: (body) => authApi.verifyOtp(body).then(start) });
};

export const useRequestOtp = () => useMutation({ mutationFn: authApi.requestOtp });
export const useRegister = () => useMutation({ mutationFn: authApi.register });
export const useForgotPassword = () => useMutation({ mutationFn: authApi.forgotPassword });
export const useResetPassword = () => useMutation({ mutationFn: authApi.resetPassword });

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout().catch(() => null),
    onSettled: () => {
      useAuthStore.getState().logout();
      useCartStore.getState().clear();
      qc.clear();
    },
  });
};

/** Fresh user from the API; keeps the store's copy in sync (e.g. after approval). */
export const useMe = (options = {}) => {
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
    enabled: isAuthenticated,
    ...options,
  });
  useEffect(() => {
    if (query.data) useAuthStore.getState().setUser(query.data);
  }, [query.data]);
  return query;
};

export const useUpdateMe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      qc.setQueryData(queryKeys.me, user);
    },
  });
};

export const useDeleteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.deleteMe,
    onSuccess: () => {
      useAuthStore.getState().logout();
      useCartStore.getState().clear();
      qc.clear();
    },
  });
};
