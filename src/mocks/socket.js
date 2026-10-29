/**
 * Fake Socket.IO connection with the same on/off/emit/disconnect interface as socket.io-client.
 * Mock handlers push server events with `serverEmit(event, payload)`; client emits are routed
 * to listeners registered with `onClientEmit` (e.g. a rider sending `rider:location`).
 */
const clientListeners = new Map(); // event -> Set(handler) registered by app code
const serverListeners = new Map(); // event -> Set(handler) registered by mock "server"
let connected = false;

const add = (map, event, fn) => {
  if (!map.has(event)) map.set(event, new Set());
  map.get(event).add(fn);
};

export function createMockSocket() {
  connected = true;
  return {
    id: 'mock-socket',
    get connected() {
      return connected;
    },
    on(event, fn) {
      add(clientListeners, event, fn);
      return this;
    },
    off(event, fn) {
      if (fn) clientListeners.get(event)?.delete(fn);
      else clientListeners.delete(event);
      return this;
    },
    emit(event, payload, ack) {
      // Simulate the network hop
      setTimeout(() => {
        serverListeners.get(event)?.forEach((fn) => fn(payload, ack));
      }, 20);
      return this;
    },
    disconnect() {
      connected = false;
      clientListeners.clear();
    },
  };
}

/** Sends an event from the "server" to the app. */
export function serverEmit(event, payload) {
  clientListeners.get(event)?.forEach((fn) => fn(payload));
}

/** Lets mock code react to events the app emits. Returns an unsubscribe function. */
export function onClientEmit(event, fn) {
  add(serverListeners, event, fn);
  return () => serverListeners.get(event)?.delete(fn);
}
