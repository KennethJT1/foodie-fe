import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { toast } from '@/components/feedback';
import { Form, FormInput, FormSubmit, OtpInput } from '@/components/forms';
import { ROUTES } from '@/constants/routes';

import { AuthCard } from './AuthCard';
import { useForgotPassword, useResetPassword } from '../hooks/useAuth';
import { forgotSchema, resetSchema } from '../schemas/auth.schemas';

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const navigate = useNavigate();
  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email or phone number and we'll send you a reset code."
      footer={
        <Link to={ROUTES.login} className="text-primary-700 hover:underline">
          Back to log in
        </Link>
      }
    >
      <Form
        schema={forgotSchema}
        defaultValues={{ identifier: '' }}
        onSubmit={async ({ identifier }) => {
          await forgot.mutateAsync({ identifier });
          navigate(`${ROUTES.resetPassword}?${new URLSearchParams({ identifier })}`);
        }}
      >
        <FormInput name="identifier" label="Email or phone number" autoComplete="username" />
        <FormSubmit fullWidth>Send reset code</FormSubmit>
      </Form>
    </AuthCard>
  );
}

export function ResetPasswordForm() {
  const [params] = useSearchParams();
  const identifier = params.get('identifier') ?? '';
  const reset = useResetPassword();
  const navigate = useNavigate();
  return (
    <AuthCard
      title="Set a new password"
      description={identifier ? `If ${identifier} has an account, we sent it a code.` : undefined}
    >
      <Form
        schema={resetSchema}
        defaultValues={{ code: '', password: '', confirmPassword: '' }}
        onSubmit={async ({ code, password }) => {
          await reset.mutateAsync({ identifier, code, password });
          toast.success('Password changed. Log in with your new password.');
          navigate(ROUTES.login, { replace: true });
        }}
      >
        <OtpInput name="code" label="Reset code" />
        <FormInput
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
        />
        <FormInput
          name="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
        />
        <FormSubmit fullWidth>Change password</FormSubmit>
      </Form>
    </AuthCard>
  );
}
