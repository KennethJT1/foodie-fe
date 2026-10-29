import { useEffect } from 'react';

/** Calls `handler` when a pointer goes down outside every given ref. */
export function useClickOutside(refs, handler, isActive = true) {
  useEffect(() => {
    if (!isActive) return undefined;
    const list = Array.isArray(refs) ? refs : [refs];
    const onDown = (e) => {
      if (list.some((r) => r.current?.contains(e.target))) return;
      handler(e);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [refs, handler, isActive]);
}
