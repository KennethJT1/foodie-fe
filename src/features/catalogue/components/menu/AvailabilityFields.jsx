import { useFormContext } from 'react-hook-form';

import { FormField, FormInput, FormSwitch, useFieldError } from '@/components/forms';
import { cn } from '@/lib/cn';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** On sale today, which days and (optionally) which hours the dish is served. */
export function AvailabilityFields() {
  const { watch } = useFormContext();
  const limitHours = watch('limitHours');
  const daysError = useFieldError('availableDays');
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium">Availability</legend>
      <FormSwitch
        name="isAvailable"
        label="On sale"
        description="Turn off when it sells out today."
      />
      <FormField name="availableDays">
        {(field) => (
          <div>
            <p className="mb-2 text-sm text-ink-muted">Days you sell it</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Days you sell it">
              {DAYS.map((label, day) => {
                const on = field.value.includes(day);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      field.onChange(
                        on ? field.value.filter((d) => d !== day) : [...field.value, day].sort(),
                      )
                    }
                    className={cn(
                      'min-h-[40px] rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
                      on
                        ? 'border-primary bg-primary text-ink'
                        : 'border-surface-border bg-surface text-ink-muted',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {daysError && (
              <p className="mt-1 text-sm text-danger" role="alert">
                {daysError}
              </p>
            )}
          </div>
        )}
      </FormField>
      <FormSwitch
        name="limitHours"
        label="Only at certain hours"
        description="For example, breakfast from 7 am to 11 am."
      />
      {limitHours && (
        <div className="grid grid-cols-2 gap-3">
          <FormInput name="availableFrom" type="time" label="From" />
          <FormInput name="availableTo" type="time" label="To" />
        </div>
      )}
    </fieldset>
  );
}
