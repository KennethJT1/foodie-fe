import { useState } from 'react';

import { toast } from '@/components/feedback';
import { ImageUploadControl, StepCard } from '@/components/forms';
import { compressImage } from '@/lib/image';

import {
  useRemoveDocument,
  useSaveOnboardingStep,
  useUploadDocument,
} from '../../hooks/useOnboarding';

const shortLabel = (label) => label.split(' (')[0];

/** One upload box per document the vendor type needs (FR-VEN-01). */
export function DocumentsStep({ data, onNext, onBack }) {
  const save = useSaveOnboardingStep();
  const upload = useUploadDocument();
  const remove = useRemoveDocument();
  const [errors, setErrors] = useState({});

  const submit = () =>
    save.mutate(
      { step: 'documents' },
      { onSuccess: onNext, onError: (e) => setErrors(e.fieldErrors ?? {}) },
    );

  return (
    <StepCard
      title="Upload your documents"
      description="Clear photos or scans. Our team checks them before your store goes live."
      onBack={onBack}
      onContinue={submit}
      isSaving={save.isPending}
    >
      <ul className="grid gap-6 sm:grid-cols-2">
        {data.requiredDocuments.map((d) => {
          const doc = data.documents.find((x) => x.type === d.type);
          return (
            <li key={d.type}>
              <ImageUploadControl
                label={d.label}
                itemLabel={shortLabel(d.label)}
                aspect="aspect-[3/2]"
                hint="JPG, PNG or WebP, under 2 MB."
                value={doc?.url ?? null}
                error={errors[d.type]}
                onUpload={async (file) => {
                  const { dataUrl } = await compressImage(file);
                  const saved = await upload.mutateAsync({ type: d.type, url: dataUrl });
                  setErrors((e) => ({ ...e, [d.type]: undefined }));
                  return saved.url;
                }}
                onChange={(url) => {
                  if (url || !doc) return;
                  remove.mutate(doc.id, { onError: (e) => toast.error(e) });
                }}
              />
            </li>
          );
        })}
      </ul>
    </StepCard>
  );
}
