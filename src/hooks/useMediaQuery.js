import { useSyncExternalStore } from 'react';

/** True while the CSS media query matches, e.g. useMediaQuery('(min-width: 640px)'). */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
