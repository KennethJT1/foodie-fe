import { Controller, useFormContext } from 'react-hook-form';

import { Checkbox } from '@/components/ui/Checkbox';
import { Combobox } from '@/components/ui/Combobox';
import { Input } from '@/components/ui/Input';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';

import { useFieldError } from './Form';

/** Generic Controller wrapper: `children(field, error)` renders any control. */
export function FormField({ name, children, rules }) {
  const { control } = useFormContext();
  const error = useFieldError(name);
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => children(field, error)}
    />
  );
}

export function FormInput({ name, ...props }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  return <Input {...register(name)} error={error} {...props} />;
}

export function FormSelect({ name, ...props }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  return <Select {...register(name)} error={error} {...props} />;
}

export function FormTextarea({ name, ...props }) {
  return (
    <FormField name={name}>
      {(field, error) => <Textarea {...field} value={field.value ?? ''} error={error} {...props} />}
    </FormField>
  );
}

export function FormSwitch({ name, ...props }) {
  return (
    <FormField name={name}>
      {(field) => <Switch checked={Boolean(field.value)} onChange={field.onChange} {...props} />}
    </FormField>
  );
}

export function FormCheckbox({ name, ...props }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  return <Checkbox {...register(name)} error={error} {...props} />;
}

export function FormRadioGroup({ name, ...props }) {
  return (
    <FormField name={name}>
      {(field, error) => (
        <RadioGroup
          name={name}
          value={field.value}
          onChange={field.onChange}
          error={error}
          {...props}
        />
      )}
    </FormField>
  );
}

export function FormCombobox({ name, ...props }) {
  return (
    <FormField name={name}>
      {(field, error) => (
        <Combobox value={field.value} onChange={field.onChange} error={error} {...props} />
      )}
    </FormField>
  );
}
