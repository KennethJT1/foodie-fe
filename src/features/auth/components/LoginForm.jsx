import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Form, FormInput, FormSubmit, PhoneInput } from '@/components/forms';
import { Tabs } from '@/components/ui';
import { ROUTES } from '@/constants/routes';

import { AuthCard } from './AuthCard';
import { GoogleButton, OrDivider } from './GoogleButton';
import { useLogin, useRequestOtp } from '../hooks/useAuth';
import { resolveNextPath } from '../lib/next-path';
import { emailLoginSchema, phoneLoginSchema } from '../schemas/auth.schemas';

/** Log in with phone + OTP or email + password (FR-ACC-01). */
export function LoginForm() {
  const [method, setMethod] = useState('phone');
  const [params] = useSearchParams();
  const next = params.get('next');
  const navigate = useNavigate();
  const login = useLogin();
  const requestOtp = useRequestOtp();

  const goOn = ({ user }) => navigate(resolveNextPath(user, next), { replace: true });

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to order, track and manage your food."
      footer={
        <>
          New to KJT Foodie?{' '}
          <Link
            to={ROUTES.signup('customer')}
            className="font-medium text-primary-700 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <Tabs
        variant="pills"
        aria-label="Log in with"
        value={method}
        onChange={setMethod}
        items={[
          { value: 'phone', label: 'Phone number' },
          { value: 'email', label: 'Email' },
        ]}
        className="justify-center"
      />

      {method === 'phone' ? (
        <Form
          key="phone"
          schema={phoneLoginSchema}
          defaultValues={{ phone: '' }}
          onSubmit={async ({ phone }) => {
            await requestOtp.mutateAsync({ phone, purpose: 'login' });
            const q = new URLSearchParams({ phone, purpose: 'login', ...(next ? { next } : {}) });
            navigate(`${ROUTES.verifyOtp}?${q}`);
          }}
        >
          <PhoneInput name="phone" />
          <FormSubmit fullWidth>Send code</FormSubmit>
        </Form>
      ) : (
        <Form
          key="email"
          schema={emailLoginSchema}
          defaultValues={{ email: '', password: '' }}
          onSubmit={async (values) => goOn(await login.mutateAsync(values))}
        >
          <FormInput name="email" label="Email" type="email" autoComplete="email" />
          <FormInput
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
          />
          <div className="text-right text-sm">
            <Link to={ROUTES.forgotPassword} className="text-primary-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <FormSubmit fullWidth>Log in</FormSubmit>
        </Form>
      )}

      <OrDivider />
      <GoogleButton onSignedIn={goOn} />
    </AuthCard>
  );
}
