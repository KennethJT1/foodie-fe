import { cn } from '@/lib/cn';
import { formatNaira } from '@/lib/format';

import { groupHint, toggleOption } from '../lib/options';

/** Radios for single-choice groups, checkboxes (capped at `max`) for the rest. */
export function OptionGroupsPicker({ groups = [], value = {}, onChange, errors = {}, className }) {
  if (!groups.length) return null;
  return (
    <div className={cn('space-y-4', className)}>
      {groups.map((g) => {
        const selected = value[g.id] ?? [];
        const single = g.max === 1;
        const full = !single && g.max && selected.length >= g.max;
        return (
          <fieldset key={g.id} className="space-y-2" aria-describedby={`${g.id}-hint`}>
            <legend className="text-sm font-semibold text-ink">{g.name}</legend>
            <p id={`${g.id}-hint`} className="text-xs text-ink-muted">
              {groupHint(g)}
            </p>
            <div className="divide-y divide-surface-border rounded-lg border border-surface-border">
              {g.options.map((o) => {
                const checked = selected.includes(o.id);
                const disabled = !checked && Boolean(full);
                return (
                  <label
                    key={o.id}
                    className={cn(
                      'flex min-h-tap cursor-pointer items-center gap-3 px-3 text-sm',
                      disabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <input
                      type={single ? 'radio' : 'checkbox'}
                      name={g.id}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => onChange(toggleOption(value, g, o.id))}
                      className={cn(
                        'h-5 w-5 border-surface-border text-primary focus:ring-primary',
                        !single && 'rounded',
                      )}
                    />
                    <span className="flex-1">{o.name}</span>
                    <span className="text-ink-muted">
                      {o.price ? `+${formatNaira(o.price)}` : 'Free'}
                    </span>
                  </label>
                );
              })}
            </div>
            {errors[g.id] && (
              <p className="text-sm text-danger" role="alert">
                {errors[g.id]}
              </p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
