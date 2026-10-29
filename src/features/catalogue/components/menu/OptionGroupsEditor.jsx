import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { FormCheckbox, FormInput, MoneyInput, useFieldError } from '@/components/forms';
import { Button, IconButton } from '@/components/ui';

function OptionsList({ groupIndex }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `optionGroups.${groupIndex}.options`,
  });
  const error = useFieldError(`optionGroups.${groupIndex}.options`);
  return (
    <div className="space-y-2">
      {fields.map((f, j) => (
        <div key={f.id} className="grid grid-cols-[1fr_120px_44px] items-start gap-2">
          <FormInput
            name={`optionGroups.${groupIndex}.options.${j}.name`}
            label="Option"
            labelHidden={j > 0}
            placeholder="Chicken"
          />
          <MoneyInput
            name={`optionGroups.${groupIndex}.options.${j}.price`}
            label="Extra cost"
            labelHidden={j > 0}
            placeholder="0"
          />
          <IconButton
            icon={Trash2}
            label={`Remove option ${j + 1}`}
            className={j === 0 ? 'mt-7' : undefined}
            onClick={() => remove(j)}
          />
        </div>
      ))}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button
        size="sm"
        variant="ghost"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={() => append({ name: '', price: '0' })}
      >
        Add option
      </Button>
    </div>
  );
}

/** Choice groups customers pick from, e.g. Protein (required, pick 1) or Extras (up to 3). */
export function OptionGroupsEditor() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'optionGroups' });
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Choices (optional)</legend>
      <p className="text-sm text-ink-muted">Let customers pick a protein, size or extras.</p>
      {fields.map((f, i) => (
        <div key={f.id} className="space-y-3 rounded-card border border-surface-border p-3">
          <div className="grid grid-cols-[1fr_96px_44px] items-start gap-2">
            <FormInput name={`optionGroups.${i}.name`} label="Group name" placeholder="Protein" />
            <FormInput
              name={`optionGroups.${i}.max`}
              label="Pick up to"
              type="number"
              min={1}
              inputMode="numeric"
            />
            <IconButton
              icon={Trash2}
              label={`Remove group ${i + 1}`}
              className="mt-7"
              onClick={() => remove(i)}
            />
          </div>
          <FormCheckbox name={`optionGroups.${i}.required`} label="Customers must choose one" />
          <OptionsList groupIndex={i} />
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={() =>
          append({ name: '', required: false, max: 1, options: [{ name: '', price: '0' }] })
        }
      >
        Add a choice group
      </Button>
    </fieldset>
  );
}
