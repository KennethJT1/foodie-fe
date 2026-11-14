import { env } from '@/lib/env';

const INTERVAL_MS = 30_000;

/** Fire-and-forget GET to the health endpoint; failures are ignored (the backend may be waking up). */
function ping(url) {
  // no-cors: we only need the request to reach the server, not to read the response.
  fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store', keepalive: true }).catch(
    () => {},
  );
}

/**
 * Pings the backend health endpoint immediately and then every 30s so a host that sleeps
 * when idle (Render free tier) is awake by the time the UI needs data. Pauses while the tab
 * is hidden and pings again as soon as it becomes visible. Returns a stop function.
 */
export function startKeepAlive(url = env.healthUrl, intervalMs = INTERVAL_MS) {
  if (!url || typeof window === 'undefined') return () => {};

  let timer = null;
  const start = () => {
    if (timer) return;
    ping(url);
    timer = setInterval(() => ping(url), intervalMs);
  };
  const stop = () => {
    clearInterval(timer);
    timer = null;
  };
  const onVisibility = () => (document.hidden ? stop() : start());

  document.addEventListener('visibilitychange', onVisibility);
  if (!document.hidden) start();

  return () => {
    stop();
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
