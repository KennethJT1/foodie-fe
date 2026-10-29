import { Power } from 'lucide-react';

import { toast } from '@/components/feedback';
import { cn } from '@/lib/cn';

import { useSetOnline } from '../hooks/useRider';

/** The big go online / go offline button, easy to hit on the move. */
export function OnlineSwitch({ isOnline, hasActiveDelivery }) {
  const setOnline = useSetOnline();
  const toggle = () =>
    setOnline.mutate(
      { isOnline: !isOnline },
      {
        onSuccess: (p) =>
          toast.success(
            p.isOnline ? "You're online. Jobs are on the way." : "You're offline. Rest well.",
          ),
        onError: (e) => toast.error(e),
      },
    );
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <button
        type="button"
        role="switch"
        aria-checked={isOnline}
        aria-label={isOnline ? 'Go offline' : 'Go online'}
        disabled={setOnline.isPending || (isOnline && hasActiveDelivery)}
        onClick={toggle}
        className={cn(
          'flex h-36 w-36 flex-col items-center justify-center gap-1 rounded-full font-heading text-lg font-bold shadow-pop transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:opacity-60',
          isOnline
            ? 'bg-secondary text-white hover:bg-secondary-600'
            : 'bg-ink text-white hover:bg-ink/90',
        )}
      >
        <Power className="h-8 w-8" aria-hidden="true" />
        {setOnline.isPending ? 'Please wait' : isOnline ? 'Online' : 'Go online'}
      </button>
      <p className="text-sm text-ink-muted" aria-live="polite">
        {isOnline
          ? hasActiveDelivery
            ? 'Finish your delivery before you go offline.'
            : 'Tap to go offline when you stop for the day.'
          : 'You are offline. Go online to get delivery jobs.'}
      </p>
    </div>
  );
}
