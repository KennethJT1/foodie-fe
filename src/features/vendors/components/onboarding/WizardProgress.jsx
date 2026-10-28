import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';

import { ONBOARDING_STEPS } from '../../constants';

/**
 * Step pills: done steps can be reopened, the current one is a filled orange pill.
 * Phones get "Step 2 of 6" and a progress bar instead of the full list.
 */
export function WizardProgress({ current, reached, onSelect }) {
  const index = ONBOARDING_STEPS.findIndex((s) => s.key === current);
  const percent = Math.round(((index + 1) / ONBOARDING_STEPS.length) * 100);
  return (
    <nav aria-label="Onboarding steps" className="mb-4 md:mb-6">
      <div className="sm:hidden">
        <p className="text-sm font-medium">
          Step {index + 1} of {ONBOARDING_STEPS.length} · {ONBOARDING_STEPS[index].label}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <ol className="hidden flex-wrap gap-2 sm:flex">
        {ONBOARDING_STEPS.map((s, i) => {
          const isCurrent = s.key === current;
          const isOpen = i <= reached;
          return (
            <li key={s.key}>
              <button
                type="button"
                disabled={!isOpen}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onSelect(s.key)}
                className={cn(
                  'inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-50',
                  isCurrent
                    ? 'border-primary bg-primary font-semibold text-ink'
                    : 'border-surface-border bg-surface text-ink hover:border-ink',
                )}
              >
                {i < reached && !isCurrent ? (
                  <Check className="h-4 w-4 text-secondary" aria-hidden="true" />
                ) : (
                  <span aria-hidden="true">{i + 1}.</span>
                )}
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
