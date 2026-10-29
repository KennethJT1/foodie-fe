import { useEffect, useState } from 'react';

/**
 * Keeps the screen on while `enabled` (Screen Wake Lock API). Browsers drop the lock when the
 * tab is hidden, so it is taken again when the page comes back.
 * Returns `{ isSupported, isActive }` so the UI can ask the person to keep the screen on.
 */
export function useWakeLock(enabled) {
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const [isActive, setActive] = useState(false);

  useEffect(() => {
    if (!enabled || !isSupported) return undefined;
    let lock = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
        if (cancelled) return lock.release();
        setActive(true);
        lock.addEventListener('release', () => setActive(false));
      } catch {
        setActive(false);
      }
    };
    const onVisible = () => document.visibilityState === 'visible' && request();
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => null);
      setActive(false);
    };
  }, [enabled, isSupported]);

  return { isSupported, isActive };
}
