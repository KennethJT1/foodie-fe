import { Input } from '@/components/ui/Input';

import { FormField } from './fields';

/** Nigerian phone number with a fixed +234 prefix. The value is what the person typed. */
export function PhoneInput({ name, value, onChange, label = 'Phone number', ...props }) {
  const render = (val, change, error) => (
    <Input
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      label={label}
      placeholder="803 123 4567"
      leftIcon={<span className="text-sm font-medium text-ink">+234</span>}
      inputClassName="pl-14"
      value={val ?? ''}
      error={error}
      onChange={(e) => change(e.target.value.replace(/[^\d\s+]/g, ''))}
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
