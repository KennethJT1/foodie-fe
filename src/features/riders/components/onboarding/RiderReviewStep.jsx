import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { toast } from '@/components/feedback';
import { StepCard } from '@/components/forms';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { formatPhone } from '@/lib/format';

import { VEHICLE_LABELS } from '../../constants';
import { useSubmitRiderOnboarding } from '../../hooks/useRiderOnboarding';

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

export function RiderReviewStep({ data, onBack, onEdit }) {
  const submit = useSubmitRiderOnboarding();
  const navigate = useNavigate();
  const missing = data.requiredDocuments.filter(
    (d) => !data.documents.some((x) => x.type === d.type),
  );
  const isComplete = data.vehicleType && data.guarantor && data.bank?.verified && !missing.length;
  return (
    <StepCard
      title="Check your details"
      description="Our team reviews these before you can take jobs."
      onBack={onBack}
      continueLabel="Submit for review"
      isSaving={submit.isPending}
      canContinue={Boolean(isComplete)}
      onContinue={() =>
        submit.mutate(undefined, {
          onSuccess: () => {
            toast.success("Thanks! We'll review your details within 1–2 working days.");
            navigate(ROUTES.rider.status);
          },
          onError: (e) => toast.error(e),
        })
      }
    >
      <Section title="Vehicle and licence" onEdit={() => onEdit('vehicle')}>
        <p className="text-ink">{VEHICLE_LABELS[data.vehicleType] ?? 'Not picked yet'}</p>
        {data.plateNumber && <p>Plate {data.plateNumber}</p>}
        <p>Licence {data.licenceNumber || '—'}</p>
      </Section>
      <Section title="Guarantor" onEdit={() => onEdit('guarantor')}>
        {data.guarantor ? (
          <>
            <p className="text-ink">
              {data.guarantor.name} ({data.guarantor.relationship})
            </p>
            <p>{formatPhone(data.guarantor.phone)}</p>
          </>
        ) : (
          <p className="text-danger">No guarantor yet</p>
        )}
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
