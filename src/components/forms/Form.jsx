import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { normaliseError } from '@/lib/api-error';
import { cn } from '@/lib/cn';

/** useForm with the Zod resolver and our defaults. */
export function useZodForm(schema, options = {}) {
  return useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    mode: 'onTouched',
    ...options,
  });
}

/**
 * Form wrapper. Validates with `schema`, calls `onSubmit(values, form)` and maps server
 * `fieldErrors` onto the matching inputs. Other server errors show above the fields.
 * Pass your own `form` (from useZodForm) when you need watch/setValue outside the form.
 */
export function Form({
  schema,
  defaultValues,
  onSubmit,
  form: externalForm,
  className,
  children,
  id,
  ...props
}) {
  const internalForm = useZodForm(schema, { defaultValues });
  const form = externalForm ?? internalForm;

  const submit = form.handleSubmit(async (values) => {
    form.clearErrors('root.server');
    try {
      await onSubmit?.(values, form);
    } catch (error) {
      const e = normaliseError(error);
      const fields = Object.entries(e.fieldErrors ?? {});
      fields.forEach(([name, message], i) =>
        form.setError(name, { type: 'server', message }, { shouldFocus: i === 0 }),
      );
      if (!fields.length || e.status !== 422)
        form.setError('root.server', { type: 'server', message: e.message });
    }
  });

  return (
    <FormProvider {...form}>
      <form id={id} noValidate onSubmit={submit} className={cn('space-y-4', className)} {...props}>
        <FormRootError />
        {children}
      </form>
    </FormProvider>
  );
}

function FormRootError() {
  const { formState } = useFormContext();
  const message = formState.errors.root?.server?.message;
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-danger-50 p-3 text-sm text-red-700"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </div>
  );
}

/** Submit button that shows loading and blocks double submits. */
export function FormSubmit({ children, ...props }) {
  const { formState } = useFormContext();
  return (
    <Button type="submit" loading={formState.isSubmitting} {...props}>
      {children}
    </Button>
  );
}

/** Reads the error message for a (possibly nested) field name. */
export function useFieldError(name) {
  const { formState } = useFormContext();
  return name.split('.').reduce((e, k) => e?.[k], formState.errors)?.message;
}
