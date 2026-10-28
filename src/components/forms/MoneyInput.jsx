import { Input } from '@/components/ui/Input';

import { FormField } from './fields';

/**
 * Naira amount. The form holds naira (as typed); convert with nairaToKobo before calling the API.
 * Use standalone with `value`/`onChange`, or inside a Form with `name`.
 */
export function MoneyInput({ name, value, onChange, ...props }) {
  const render = (val, change, error) => (
    <Input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      leftIcon={<span className="text-sm font-medium text-ink">₦</span>}
      value={val ?? ''}
      error={error}
      onChange={(e) => change(e.target.value.replace(/[^\d.]/g, ''))}
      {...props}
    />
  );
  if (!name) return render(value, onChange, props.error);
  return (
    <FormField name={name}>
      {(field, error) => render(field.value, field.onChange, error)}
    </FormField>
  );
}
