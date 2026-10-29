import { useEffect } from 'react';

let locks = 0;

/** Stops the page behind a modal from scrolling. Nested modals share one lock. */
export function useLockBodyScroll(isLocked) {
  useEffect(() => {
    if (!isLocked) return undefined;
    locks += 1;
    document.body.style.overflow = 'hidden';
    return () => {
      locks -= 1;
      if (locks === 0) document.body.style.overflow = '';
    };
  }, [isLocked]);
}
