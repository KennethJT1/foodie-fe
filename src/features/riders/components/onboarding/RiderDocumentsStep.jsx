import { useState } from 'react';

import { toast } from '@/components/feedback';
import { ImageUploadControl, StepCard } from '@/components/forms';
import { compressImage } from '@/lib/image';

import {
  useRemoveRiderDocument,
  useSaveRiderStep,
  useUploadRiderDocument,
} from '../../hooks/useRiderOnboarding';

export function RiderDocumentsStep({ data, onNext, onBack }) {
  const save = useSaveRiderStep();
  const upload = useUploadRiderDocument();
  const remove = useRemoveRiderDocument();
  const [errors, setErrors] = useState({});

  return (
    <StepCard
      title="Upload your documents"
      description="Clear photos or scans. Our team checks them before you can take jobs."
      onBack={onBack}
      isSaving={save.isPending}
      onContinue={() =>
        save.mutate(
          { step: 'documents' },
          { onSuccess: onNext, onError: (e) => setErrors(e.fieldErrors ?? {}) },
        )
      }
    >
      <ul className="grid gap-6 sm:grid-cols-2">
        {data.requiredDocuments.map((d) => {
          const doc = data.documents.find((x) => x.type === d.type);
          return (
            <li key={d.type}>
              <ImageUploadControl
                label={d.label}
                itemLabel={d.label}
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
