import { useState } from 'react';

import { toast } from '@/components/feedback';
import { Button, Card, CardTitle, Select, Switch } from '@/components/ui';

import { DELIVERY_RADIUS_OPTIONS, PREP_TIME_OPTIONS } from '../../constants';
import { useUpdateStore } from '../../hooks/useStore';

/** Pause orders, delivery radius and usual preparation time (FR-VEN-03). */
export function StoreBasics({ store }) {
  const [radius, setRadius] = useState(String(store.deliveryRadiusKm));
  const [prep, setPrep] = useState(String(store.prepTimeMins));
  const update = useUpdateStore();
  const pause = useUpdateStore();

  return (
    <Card header={<CardTitle title="Orders and delivery" />}>
      <div className="space-y-4">
        <Switch
          size="lg"
          label="Pause new orders"
          description={
            store.isPaused
              ? "Paused. Customers can see your store but can't order."
              : 'Turn on when the kitchen is too busy or you are out of stock.'
          }
          checked={store.isPaused}
          disabled={pause.isPending}
          onChange={(isPaused) =>
            pause.mutate(
              { isPaused },
              {
                onSuccess: () =>
                  toast.success(isPaused ? 'New orders paused' : 'You are taking orders again'),
                onError: (e) => toast.error(e),
              },
            )
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Delivery radius"
            options={
              DELIVERY_RADIUS_OPTIONS.some((o) => o.value === radius)
                ? DELIVERY_RADIUS_OPTIONS
                : [...DELIVERY_RADIUS_OPTIONS, { value: radius, label: `${radius} km` }]
            }
            value={radius}
            onValueChange={setRadius}
          />
          <Select
            label="Usual preparation time"
            options={PREP_TIME_OPTIONS}
            value={prep}
            onValueChange={setPrep}
          />
        </div>
        <Button
          loading={update.isPending}
          onClick={() =>
            update.mutate(
              { deliveryRadiusKm: Number(radius), prepTimeMins: Number(prep) },
              {
                onSuccess: () => toast.success('Delivery settings saved'),
                onError: (e) => toast.error(e),
              },
            )
          }
        >
          Save delivery settings
        </Button>
      </div>
    </Card>
  );
}
