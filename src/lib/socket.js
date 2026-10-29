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

/**
 * Same interface as a socket.io socket. Listeners and emits made before the library has loaded
 * are replayed once it connects.
 */
function createLazySocket(accessToken) {
  const listeners = [];
  const queue = [];
  let real = null;
  let closed = false;
  import('socket.io-client').then(({ io }) => {
    if (closed) return;
    real = io(env.socketUrl, { auth: { token: accessToken }, transports: ['websocket'] });
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
      if (real) real.emit(...args);
      else queue.push(args);
      return this;
    },
    disconnect() {
      closed = true;
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
