import axios from 'axios';

import { normaliseError } from './api-error';
import { env } from './env';

/**
 * The one Axios instance. Only this file knows where the API lives, so the app runs on
 * mocks or the real backend by changing VITE_API_URL / VITE_USE_MOCKS.
 */
export const api = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true, // refresh token travels in an httpOnly cookie
  timeout: 20000,
});

// The auth store registers itself here to avoid a circular import.
let authBridge = {
  getAccessToken: () => null,
  setAccessToken: () => {},
  onSessionExpired: () => {},
};

/** Called once by the auth store. */
export function registerAuthBridge(bridge) {
  authBridge = { ...authBridge, ...bridge };
}

api.interceptors.request.use((config) => {
  const token = authBridge.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

/** Calls /auth/refresh once; parallel callers wait on the same promise. */
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${env.apiUrl}/auth/refresh`, null, { withCredentials: true })
      .then((r) => {
        const { accessToken, user } = r.data.data;
        authBridge.setAccessToken(accessToken, user);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const NO_REFRESH = ['/auth/login', '/auth/refresh', '/auth/register', '/auth/otp'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const skip = NO_REFRESH.some((p) => original?.url?.startsWith(p));

    if (status === 401 && original && !original._retried && !skip) {
      original._retried = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        authBridge.onSessionExpired();
      }
    }
    return Promise.reject(normaliseError(error));
  },
);

/** Unwraps `{ success, data }` → data. */
export const unwrap = (response) => response.data.data;

/** Keeps `{ data, meta }` for paginated lists. */
export const unwrapList = (response) => ({ data: response.data.data, meta: response.data.meta });
