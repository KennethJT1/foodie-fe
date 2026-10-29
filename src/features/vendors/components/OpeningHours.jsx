import { cn } from '@/lib/cn';
import { DAY_NAMES, lagosClock, weeklyHours } from '@/lib/opening-hours';

/** Weekly hours table, today highlighted. Times are Lagos time. */
export function OpeningHours({ hours, className }) {
  const today = DAY_NAMES[lagosClock().day];
  return (
    <dl className={cn('grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm', className)}>
      {weeklyHours(hours).map((d) => (
        <div key={d.day} className="contents">
          <dt className={cn('text-ink-muted', d.name === today && 'font-semibold text-ink')}>
            {d.name}
          </dt>
          <dd className={cn(d.name === today && 'font-semibold')}>{d.label}</dd>
        </div>
      ))}
    </dl>
  );
}
