import { Bike, ShoppingBag, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Form, FormCheckbox, FormInput, FormSubmit, PhoneInput } from '@/components/forms';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/cn';

import { AuthCard } from './AuthCard';
import { GoogleButton, OrDivider } from './GoogleButton';
import { useRegister } from '../hooks/useAuth';
import { signupSchema } from '../schemas/auth.schemas';

const ROLE_COPY = {
  customer: {
    title: 'Create your account',
    description: 'Order jollof, suya and more from vendors near you.',
    icon: ShoppingBag,
    label: 'Order food',
  },
  vendor: {
    title: 'Sell on KJT Foodie',
    description: 'One monthly fee, no commission on your orders.',
    icon: Store,
    label: 'Sell food',
  },
  rider: {
    title: 'Ride with KJT Foodie',
    description: 'Deliver orders and get paid every month.',
    icon: Bike,
    label: 'Deliver food',
  },
};

/** Separate sign-up for customers, vendors and riders (FR-ACC-02). */
export function SignupForm({ role }) {
  const navigate = useNavigate();
  const register = useRegister();
  const copy = ROLE_COPY[role] ?? ROLE_COPY.customer;

  return (
    <AuthCard
      title={copy.title}
      description={copy.description}
      footer={
        <>
          Already have an account?{' '}
          <Link to={ROUTES.login} className="font-medium text-primary-700 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <nav aria-label="Sign up as" className="grid grid-cols-3 gap-2">
        {Object.entries(ROLE_COPY).map(([key, c]) => {
          const Icon = c.icon;
          return (
            <Link
              key={key}
              to={ROUTES.signup(key)}
              replace
              aria-current={key === role ? 'page' : undefined}
              className={cn(
                'flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg border text-xs font-medium',
                key === role
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-surface-border text-ink hover:border-primary-600',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {c.label}
            </Link>
          );
        })}
      </nav>

      <Form
        key={role}
        schema={signupSchema}
        defaultValues={{
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          acceptTerms: false,
        }}
        onSubmit={async (values) => {
          // eslint-disable-next-line no-unused-vars
          const { confirmPassword, acceptTerms, ...body } = values;
          const res = await register.mutateAsync({ ...body, email: body.email || undefined, role });
          navigate(
            `${ROUTES.verifyOtp}?${new URLSearchParams({ phone: res.phone, purpose: 'verify' })}`,
          );
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput name="firstName" label="First name" autoComplete="given-name" />
          <FormInput name="lastName" label="Last name" autoComplete="family-name" />
        </div>
        <PhoneInput name="phone" hint="We'll text you a code to confirm it." />
        <FormInput
          name="email"
          label={role === 'customer' ? 'Email (optional)' : 'Email'}
          type="email"
          autoComplete="email"
        />
        <FormInput
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
        />
        <FormInput
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
        />
        <FormCheckbox
          name="acceptTerms"
          label={`I agree to the ${role === 'customer' ? 'customer' : role} terms and the privacy policy`}
          description={
            role === 'customer'
              ? 'Refunds for food are agreed between you and the vendor.'
              : undefined
          }
        />
        <FormSubmit fullWidth>Create account</FormSubmit>
      </Form>

      {role === 'customer' && (
        <>
          <OrDivider />
          <GoogleButton
            onSignedIn={() => navigate('/', { replace: true })}
            label="Sign up with Google"
          />
        </>
      )}
    </AuthCard>
  );
}
