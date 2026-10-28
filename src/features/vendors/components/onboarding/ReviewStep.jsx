import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { toast } from '@/components/feedback';
import { StepCard } from '@/components/forms';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { VENDOR_TYPE_LABELS } from '@/constants/statuses';
import { formatAddress } from '@/features/auth';
import { formatPhone } from '@/lib/format';

import { useSubmitOnboarding } from '../../hooks/useOnboarding';
import { missingDocuments } from '../../lib/onboarding';

function Section({ title, onEdit, children }) {
  return (
    <section className="border-b border-surface-border py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button
          variant="link"
          size="sm"
          onClick={onEdit}
          aria-label={`Edit ${title.toLowerCase()}`}
        >
          Edit
        </Button>
      </div>
      <div className="space-y-1 text-sm text-ink-muted">{children}</div>
    </section>
  );
}

/** Everything the vendor entered, with an edit link per section, then submit for approval. */
export function ReviewStep({ data, onBack, onEdit }) {
  const submit = useSubmitOnboarding();
  const navigate = useNavigate();
  const missing = missingDocuments(data);
  const isComplete = missing.length === 0 && data.bank?.verified && data.name && data.lat != null;

  const send = () =>
    submit.mutate(undefined, {
      onSuccess: () => {
        toast.success("Thanks! We'll review your store within 1–2 working days.");
        navigate(ROUTES.vendor.status);
      },
      onError: (e) => toast.error(e),
    });

  return (
    <StepCard
      title="Check your details"
      description="Our team reviews these before your store goes live."
      onBack={onBack}
      onContinue={send}
      continueLabel="Submit for review"
      isSaving={submit.isPending}
      canContinue={Boolean(isComplete)}
    >
      <Section title="Vendor type" onEdit={() => onEdit('type')}>
        <p className="text-ink">{VENDOR_TYPE_LABELS[data.type] ?? 'Not picked yet'}</p>
      </Section>
      <Section title="Business details" onEdit={() => onEdit('business')}>
        <div className="flex items-center gap-3">
          {data.logo && (
            <img
              src={data.logo}
              alt={`${data.name} logo`}
              className="h-12 w-12 rounded-full object-cover"
            />
          )}
          <div>
            <p className="font-medium text-ink">{data.name || 'No name yet'}</p>
            <p>{formatPhone(data.phone)}</p>
          </div>
        </div>
        {data.description && <p>{data.description}</p>}
      </Section>
      <Section title="Location" onEdit={() => onEdit('location')}>
        <p className="text-ink">{formatAddress(data.address) || 'No address yet'}</p>
        <p>
          Delivers within {data.deliveryRadiusKm} km · usually ready in {data.prepTimeMins} min
        </p>
      </Section>
      <Section title="Documents" onEdit={() => onEdit('documents')}>
        <ul className="space-y-1">
          {data.requiredDocuments.map((d) => {
            const isMissing = missing.some((m) => m.type === d.type);
            return (
              <li key={d.type} className="flex items-center gap-2">
                {isMissing ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                )}
                <span className={isMissing ? 'text-danger' : 'text-ink'}>
                  {d.label}
                  {isMissing && ' (missing)'}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>
      <Section title="Bank account" onEdit={() => onEdit('bank')}>
        {data.bank ? (
          <>
            <p className="font-medium text-ink">{data.bank.accountName}</p>
            <p>
              {data.bank.bankName} · {data.bank.accountNumber}
            </p>
          </>
        ) : (
          <p className="text-danger">No bank account yet</p>
        )}
      </Section>
    </StepCard>
  );
}
