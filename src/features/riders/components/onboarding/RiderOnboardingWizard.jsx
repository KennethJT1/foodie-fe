import { XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { PageHeader } from '@/components/data';
import { ErrorState, Skeleton, SkeletonText } from '@/components/feedback';
import { WizardProgress } from '@/components/forms';
import { ROUTES } from '@/constants/routes';

import { GuarantorStep } from './GuarantorStep';
import { RiderBankStep } from './RiderBankStep';
import { RiderDocumentsStep } from './RiderDocumentsStep';
import { RiderReviewStep } from './RiderReviewStep';
import { VehicleStep } from './VehicleStep';
import { RIDER_ONBOARDING_STEPS as STEPS } from '../../constants';
import { useRiderOnboarding } from '../../hooks/useRiderOnboarding';

const COMPONENTS = {
  vehicle: VehicleStep,
  guarantor: GuarantorStep,
  documents: RiderDocumentsStep,
  bank: RiderBankStep,
  review: RiderReviewStep,
};
const KEYS = STEPS.map((s) => s.key);

/** Rider onboarding: vehicle and licence → guarantor → documents → bank → review. */
export function RiderOnboardingWizard() {
  const { data, isLoading, isError, error, refetch } = useRiderOnboarding();
  const [step, setStep] = useState(null);
  const topRef = useRef(null);

  if (isLoading)
    return (
      <div role="status" aria-label="Loading your application" className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <SkeletonText lines={6} />
      </div>
    );
  if (isError)
    return <ErrorState title="We couldn't load your application" error={error} onRetry={refetch} />;
  if (!['draft', 'rejected'].includes(data.approvalStatus))
    return <Navigate to={ROUTES.rider.status} replace />;

  const reached =
    data.step === 'submitted' ? KEYS.length - 1 : Math.max(0, KEYS.indexOf(data.step));
  const current = step ?? KEYS[reached];
  const index = KEYS.indexOf(current);
  const goTo = (key) => {
    setStep(key);
    topRef.current?.scrollIntoView({ block: 'start' });
  };
  const Step = COMPONENTS[current];

  return (
    <div ref={topRef} className="mx-auto max-w-2xl scroll-mt-20">
      <PageHeader
        title="Become a KJT Foodie rider"
        description="Five short steps. We save your progress as you go."
      />
      {data.approvalStatus === 'rejected' && (
        <div role="alert" className="mb-4 flex gap-3 rounded-card bg-danger-50 p-4 text-sm">
          <XCircle className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p className="font-semibold text-red-700">We couldn&apos;t approve you yet</p>
            <p className="text-ink">{data.rejectionReason}</p>
          </div>
        </div>
      )}
      <WizardProgress
        steps={STEPS}
        label="Onboarding steps"
        current={current}
        reached={reached}
        onSelect={goTo}
      />
      <Step
        key={current}
        data={data}
        onNext={() => goTo(KEYS[Math.min(index + 1, KEYS.length - 1)])}
        onBack={index === 0 ? undefined : () => goTo(KEYS[index - 1])}
        onEdit={goTo}
      />
    </div>
  );
}
