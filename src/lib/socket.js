import { endSession, getAccessToken, refreshAccessToken } from './api-client';
import { env } from './env';

/**
 * One real-time connection per session. In mock mode a fake emitter with the same
 * on/off/emit interface is used (src/mocks/socket.js), so hooks never know the difference.
 * socket.io-client is downloaded only when a real connection is first needed.
 */
let socket = null;
let mockFactory = null;

/** Lets the mock layer supply its fake socket without the production bundle importing it. */
export function registerMockSocket(factory) {
  mockFactory = factory;
}

/** `order:subscribe` → `order:unsubscribe`; `admin:live-map:subscribe` → `admin:live-map:unsubscribe`. */
const ROOM_EVENT = /^(.+):(subscribe|unsubscribe)$/;
const roomKey = (prefix, payload) => `${prefix}|${JSON.stringify(payload ?? null)}`;

/**
 * Same interface as a socket.io socket. Listeners and emits made before the library has loaded
 * are replayed once it connects.
 *
 * Real connections can drop and reconnect, which the mock never does, so this also:
 * - sends the current access token on every (re)connect, not the one from login;
 * - on `connect_error` UNAUTHENTICATED (expired token) refreshes once and reconnects;
 * - on ACCOUNT_BANNED / ACCOUNT_SUSPENDED ends the session;
 * - re-joins every room still subscribed after a reconnect (the server forgets them).
 */
function createLazySocket(initialToken) {
  const listeners = [];
  const queue = [];
  const rooms = new Map(); // roomKey → emit args, for rooms subscribed and not yet unsubscribed
  let real = null;
  let closed = false;
  let hasConnected = false;
  let refreshing = false;

  const trackRoom = ([event, payload]) => {
    const match = typeof event === 'string' && ROOM_EVENT.exec(event);
    if (!match) return;
    const key = roomKey(match[1], payload);
    if (match[2] === 'subscribe') rooms.set(key, [event, payload]);
    else rooms.delete(key);
  };

  import('socket.io-client').then(({ io }) => {
    if (closed) return;
    real = io(env.socketUrl, {
      // A function so each (re)connect sends the freshest token
      auth: (cb) => cb({ token: getAccessToken() ?? initialToken }),
      transports: ['websocket'],
    });
    real.on('connect', () => {
      // socket.io sends emits buffered while disconnected itself; rooms joined before the drop
      // must be joined again because the server dropped them with the old connection
      if (hasConnected) rooms.forEach(([event, payload]) => real.emit(event, payload));
      hasConnected = true;
    });
    real.on('connect_error', (error) => {
      if (closed) return;
      if (error?.message === 'UNAUTHENTICATED' && !refreshing) {
        refreshing = true;
        refreshAccessToken()
          .then(() => !closed && real.connect())
          .catch(() => endSession())
          .finally(() => {
            refreshing = false;
          });
      } else if (error?.message === 'ACCOUNT_BANNED' || error?.message === 'ACCOUNT_SUSPENDED') {
        endSession();
      }
    });
    listeners.forEach(([event, fn]) => real.on(event, fn));
    queue.forEach((args) => real.emit(...args));
    queue.length = 0;
  });

  return {
    get connected() {
      return Boolean(real?.connected);
    },
    on(event, fn) {
      listeners.push([event, fn]);
      real?.on(event, fn);
      return this;
    },
    off(event, fn) {
      for (let i = listeners.length - 1; i >= 0; i -= 1)
        if (listeners[i][0] === event && (!fn || listeners[i][1] === fn)) listeners.splice(i, 1);
      real?.off(event, fn);
      return this;
    },
    emit(...args) {
      trackRoom(args);
      if (real) real.emit(...args);
      else queue.push(args);
      return this;
    },
    disconnect() {
      closed = true;
      rooms.clear();
      real?.disconnect();
    },
  };
}

export function connectSocket(accessToken) {
  if (socket) return socket;
  if (env.useMocks && mockFactory) {
    socket = mockFactory(accessToken);
  } else if (env.socketUrl) {
    socket = createLazySocket(accessToken);
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export const getSocket = () => socket;
