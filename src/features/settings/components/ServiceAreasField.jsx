import { X } from 'lucide-react';
import { useState } from 'react';

import { FormField } from '@/components/forms';
import { Button, Input } from '@/components/ui';

/** Cities KJT Foodie serves, as removable chips. */
export function ServiceAreasField({ name = 'serviceAreas' }) {
  const [city, setCity] = useState('');
  return (
    <FormField name={name}>
      {(field, error) => {
        const add = () => {
          const value = city.trim();
          if (value && !field.value.includes(value)) field.onChange([...field.value, value]);
          setCity('');
        };
        return (
          <div className="space-y-3">
            <ul className="flex flex-wrap gap-2" aria-label="Service areas">
              {field.value.map((c) => (
                <li
                  key={c}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-50 py-1 pl-3 pr-1 text-sm"
                >
                  {c}
                  <button
                    type="button"
                    aria-label={`Remove ${c}`}
                    onClick={() => field.onChange(field.value.filter((x) => x !== c))}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-end gap-2">
              <Input
                label="Add a city"
                value={city}
                error={error}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    add();
                  }
                }}
              />
              <Button variant="outline" onClick={add}>
                Add city
              </Button>
            </div>
          </div>
        );
      }}
    </FormField>
  );
}
