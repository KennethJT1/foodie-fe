import { create } from 'zustand';

import { registerAuthBridge } from '@/lib/api-client';
import { connectSocket, disconnectSocket } from '@/lib/socket';

/**
 * Client-side session only: the user and the short-lived access token (kept in memory, never
 * in localStorage). The refresh token lives in an httpOnly cookie the browser sends for us.
 * status: 'idle' (not checked yet) | 'authenticated' | 'anonymous'
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  status: 'idle',

  setSession: ({ user, accessToken }) => {
    set({ user, accessToken, status: 'authenticated' });
    connectSocket(accessToken);
  },

  setUser: (user) => set({ user }),

  setAnonymous: () => set({ user: null, accessToken: null, status: 'anonymous' }),

  logout: () => {
    disconnectSocket();
    set({ user: null, accessToken: null, status: 'anonymous' });
  },

  isAuthenticated: () => get().status === 'authenticated',
}));

registerAuthBridge({
  getAccessToken: () => useAuthStore.getState().accessToken,
  setAccessToken: (accessToken, user) => {
    const state = useAuthStore.getState();
    state.setSession({ user: user ?? state.user, accessToken });
  },
  onSessionExpired: () => useAuthStore.getState().logout(),
});
