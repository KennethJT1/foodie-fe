import { XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { PageHeader } from '@/components/data';
import { ErrorState, Skeleton, SkeletonText } from '@/components/feedback';
import { WizardProgress } from '@/components/forms';
import { ROUTES } from '@/constants/routes';
import { APPROVAL_STATUS } from '@/constants/statuses';

import { BankStep } from './BankStep';
import { BusinessStep } from './BusinessStep';
import { DocumentsStep } from './DocumentsStep';
import { LocationStep } from './LocationStep';
import { ReviewStep } from './ReviewStep';
import { TypeStep } from './TypeStep';
import { ONBOARDING_STEPS } from '../../constants';
import { useOnboarding } from '../../hooks/useOnboarding';
import { nextStep, prevStep, reachedIndex } from '../../lib/onboarding';

const STEP_COMPONENTS = {
  type: TypeStep,
  business: BusinessStep,
  location: LocationStep,
  documents: DocumentsStep,
  bank: BankStep,
  review: ReviewStep,
};

const EDITABLE = [APPROVAL_STATUS.DRAFT, APPROVAL_STATUS.REJECTED];

/** Vendor onboarding: type → business → location → documents → bank → review (FR-VEN-01). */
export function OnboardingWizard() {
  const { data, isLoading, isError, error, refetch } = useOnboarding();
  const [step, setStep] = useState(null);
  const topRef = useRef(null);

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading your application" className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <SkeletonText lines={6} />
      </div>
    );
  }
  if (isError)
    return <ErrorState title="We couldn't load your application" error={error} onRetry={refetch} />;
  if (!EDITABLE.includes(data.approvalStatus))
    return <Navigate to={ROUTES.vendor.status} replace />;

  const reached = reachedIndex(data.step);
  const current = step ?? ONBOARDING_STEPS[reached].key;
  const goTo = (key) => {
    setStep(key);
    topRef.current?.scrollIntoView({ block: 'start' });
  };
  const Step = STEP_COMPONENTS[current];

  return (
    <div ref={topRef} className="mx-auto max-w-3xl scroll-mt-20">
      <PageHeader
        title="Set up your store"
        description="Six short steps. We save your progress as you go."
      />
      {data.approvalStatus === APPROVAL_STATUS.REJECTED && (
        <div role="alert" className="mb-4 flex gap-3 rounded-card bg-danger-50 p-4 text-sm">
          <XCircle className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p className="font-semibold text-red-700">We couldn&apos;t approve your store yet</p>
            <p className="text-ink">{data.rejectionReason}</p>
            <p className="mt-1 text-ink-muted">Fix the details below and submit again.</p>
          </div>
        </div>
      )}
      <WizardProgress
        steps={ONBOARDING_STEPS}
        label="Onboarding steps"
        current={current}
        reached={reached}
        onSelect={goTo}
      />
      <Step
        key={current}
        data={data}
        onNext={() => goTo(nextStep(current))}
        onBack={current === 'type' ? undefined : () => goTo(prevStep(current))}
        onEdit={goTo}
      />
    </div>
  );
}
