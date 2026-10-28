import { io } from 'socket.io-client';

import { env } from './env';

/**
 * One real-time connection per session. In mock mode a fake emitter with the same
 * on/off/emit interface is used (src/mocks/socket.js), so hooks never know the difference.
 */
let socket = null;
let mockFactory = null;

/** Lets the mock layer supply its fake socket without the production bundle importing it. */
export function registerMockSocket(factory) {
  mockFactory = factory;
}

export function connectSocket(accessToken) {
  if (socket) return socket;
  if (env.useMocks && mockFactory) {
    socket = mockFactory(accessToken);
  } else if (env.socketUrl) {
    socket = io(env.socketUrl, { auth: { token: accessToken }, transports: ['websocket'] });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export const getSocket = () => socket;
