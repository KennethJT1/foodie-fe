import { useState } from 'react';

import { toast } from '@/components/feedback';
import { Button, Card, CardTitle, Checkbox, Input } from '@/components/ui';

import { useUpdateStore } from '../../hooks/useStore';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Opening and closing time for each day, or closed (FR-VEN-03). */
export function OpeningHoursEditor({ hours: initial }) {
  const [hours, setHours] = useState(initial);
  const [error, setError] = useState(null);
  const update = useUpdateStore();
  const set = (day, patch) =>
    setHours((h) => h.map((x) => (x.day === day ? { ...x, ...patch } : x)));

  const save = () => {
    const bad = hours.find((h) => !h.closed && (!h.open || !h.close || h.open >= h.close));
    if (bad) return setError(`Check ${DAYS[bad.day]}: closing time must be after opening time`);
    setError(null);
    update.mutate(
      { openingHours: hours },
      {
        onSuccess: () => toast.success('Opening hours saved'),
        onError: (e) => setError(e.fieldErrors?.openingHours ?? e.message),
      },
    );
  };

  return (
    <Card
      header={
        <CardTitle
          title="Opening hours"
          description="Customers can only order now while you are open."
        />
      }
    >
      <ul className="space-y-3">
        {hours.map((h) => (
          <li
            key={h.day}
            className="grid grid-cols-[1fr_auto] items-end gap-2 sm:grid-cols-[120px_1fr_1fr_auto]"
          >
            <span className="text-sm font-medium sm:self-center">{DAYS[h.day]}</span>
            <Checkbox
              label="Closed"
              checked={h.closed}
              onChange={(e) => set(h.day, { closed: e.target.checked })}
              className="sm:order-last sm:self-center"
            />
            {!h.closed && (
              <>
                <Input
                  type="time"
                  label={`${DAYS[h.day]} opens`}
                  labelHidden
                  value={h.open}
                  onChange={(e) => set(h.day, { open: e.target.value })}
                />
                <Input
                  type="time"
                  label={`${DAYS[h.day]} closes`}
                  labelHidden
                  value={h.close}
                  onChange={(e) => set(h.day, { close: e.target.value })}
                />
              </>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      <Button className="mt-4" loading={update.isPending} onClick={save}>
        Save hours
      </Button>
    </Card>
  );
}
