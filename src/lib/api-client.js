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

/** The current access token (the socket reads it on every (re)connect). */
export const getAccessToken = () => authBridge.getAccessToken();

/** Ends the session, e.g. when the socket is refused for a banned account. */
export const endSession = () => authBridge.onSessionExpired();

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

/**
 * A 2xx whose body is not the JSON envelope means the request never reached the API, e.g.
 * VITE_API_URL is a relative path on a static host and the SPA rewrite answered with
 * index.html. Treat it as a network error so screens show their error state.
 */
function assertJsonEnvelope(response) {
  const body = response.data;
  if (response.status === 204 || (body && typeof body === 'object')) return response;
  return Promise.reject({
    isApiError: true,
    status: 0,
    code: 'BAD_RESPONSE',
    message: "We couldn't reach KJT Foodie. Please try again in a moment.",
    fieldErrors: {},
  });
}

api.interceptors.response.use(assertJsonEnvelope, async (error) => {
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
});

/** Unwraps `{ success, data }` → data. */
export const unwrap = (response) => response?.data?.data;

/** Keeps `{ data, meta }` for paginated lists; `data` is always an array. */
export const unwrapList = (response) => {
  const list = response?.data?.data;
  return { data: Array.isArray(list) ? list : [], meta: response?.data?.meta ?? {} };
};
