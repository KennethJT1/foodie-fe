import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { toast } from '@/components/feedback';
import { Form, FormSubmit, OtpInput, useZodForm } from '@/components/forms';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { formatPhone } from '@/lib/format';
import { v } from '@/lib/validation';

import { AuthCard } from './AuthCard';
import { useRequestOtp, useVerifyOtp } from '../hooks/useAuth';
import { resolveNextPath } from '../lib/next-path';

const schema = z.object({ code: v.otp() });
const RESEND_AFTER = 30;

/** Enter the 6-digit SMS code. Submits by itself when all digits are in. */
export function VerifyOtpForm() {
  const [params] = useSearchParams();
  const phone = params.get('phone');
  const purpose = params.get('purpose') ?? 'login';
  const next = params.get('next');
  const navigate = useNavigate();
  const verify = useVerifyOtp();
  const resend = useRequestOtp();
  const [seconds, setSeconds] = useState(RESEND_AFTER);
  const form = useZodForm(schema, { defaultValues: { code: '' } });

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  if (!phone) {
    return (
      <AuthCard title="Verify your phone" description="Start again to get a new code.">
        <Button asChild fullWidth>
          <Link to={ROUTES.login}>Back to log in</Link>
        </Button>
      </AuthCard>
    );
  }

  const submit = async ({ code }) => {
    const session = await verify.mutateAsync({ phone, code, purpose });
    if (purpose === 'verify') toast.success('Phone confirmed. Welcome to KJT Foodie 🎉');
    navigate(resolveNextPath(session.user, next), { replace: true });
  };

  return (
    <AuthCard
      title="Enter your code"
      description={`We sent a 6-digit code to ${formatPhone(phone)}.`}
    >
      <Form id="otp-form" form={form} onSubmit={submit}>
        <OtpInput
          name="code"
          label="Verification code"
          focusOnMount
          // Submit as soon as the last digit is in (after the field value is stored)
          onComplete={() =>
            setTimeout(() => document.getElementById('otp-form')?.requestSubmit(), 0)
          }
        />
        <FormSubmit fullWidth>Verify</FormSubmit>
      </Form>
      <div className="text-center text-sm text-ink-muted">
        {seconds > 0 ? (
          <span>Resend code in {seconds} s</span>
        ) : (
          <Button
            variant="link"
            loading={resend.isPending}
            onClick={() =>
              resend.mutate(
                { phone, purpose },
                {
                  onSuccess: () => {
                    toast.success('We sent you a new code');
                    setSeconds(RESEND_AFTER);
                  },
                  onError: (e) => toast.error(e),
                },
              )
            }
          >
            Resend code
          </Button>
        )}
      </div>
      <p className="text-center text-sm">
        <Link to={ROUTES.login} className="text-primary-700 hover:underline">
          Use a different number
        </Link>
      </p>
    </AuthCard>
  );
}
