import { Form, FormInput, FormTextarea, ImageUpload, PhoneInput } from '@/components/forms';

import { StepCard } from './StepCard';
import { useSaveOnboardingStep } from '../../hooks/useOnboarding';
import { businessSchema } from '../../schemas/onboarding.schemas';

export function BusinessStep({ data, onNext, onBack }) {
  const save = useSaveOnboardingStep();
  const defaultValues = {
    name: data.name ?? '',
    description: data.description ?? '',
    phone: data.phone ? data.phone.replace(/^\+234/, '0') : '',
    logo: data.logo ?? null,
    cover: data.cover ?? null,
  };

  return (
    <StepCard
      title="Tell customers about your business"
      description="This is what people see on your store page."
      onBack={onBack}
      form="business-step"
      isSaving={save.isPending}
    >
      <Form
        id="business-step"
        schema={businessSchema}
        defaultValues={defaultValues}
        onSubmit={async (values) => {
          await save.mutateAsync({ step: 'business', ...values });
          onNext();
        }}
      >
        <FormInput name="name" label="Business name" placeholder="Mama Put Kitchen" />
        <FormTextarea
          name="description"
          label="Short description (optional)"
          placeholder="Smoky jollof, grills and small chops for every occasion."
          rows={3}
          maxLength={300}
          hint="Up to 300 characters."
        />
        <PhoneInput
          name="phone"
          label="Store phone number"
          hint="Riders and customers call this."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUpload
            name="logo"
            label="Logo (optional)"
            itemLabel="logo"
            aspect="aspect-square"
          />
          <ImageUpload
            name="cover"
            label="Cover photo (optional)"
            itemLabel="cover photo"
            aspect="aspect-video"
          />
        </div>
      </Form>
    </StepCard>
  );
}
