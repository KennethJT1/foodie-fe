import { Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { formatCountdown, secondsLeft } from '@/lib/countdown';

/** Time left to accept before the order is auto-rejected (BR-PAY-04). Calls `onExpire` once. */
export function AcceptCountdown({ deadline, onExpire, className }) {
  const [left, setLeft] = useState(() => secondsLeft(deadline));
  const expired = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setLeft(secondsLeft(deadline)), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  useEffect(() => {
    if (left > 0 || expired.current) return;
    expired.current = true;
    onExpire?.();
  }, [left, onExpire]);

  const urgent = left <= 60;
  return (
    <span
      role="timer"
      aria-label={`${formatCountdown(left)} left to accept`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums',
        urgent ? 'bg-danger-50 text-red-700' : 'bg-warning-50 text-amber-800',
        className,
      )}
    >
      <Timer className="h-3.5 w-3.5" aria-hidden="true" />
      {left > 0 ? `${formatCountdown(left)} to accept` : 'Time is up'}
    </span>
  );
}
