import { toast } from '@/components/feedback';
import { Form, FormInput, FormSubmit } from '@/components/forms';
import { Input } from '@/components/ui';
import { formatPhone } from '@/lib/format';

import { useSession, useUpdateMe } from '../hooks/useAuth';
import { profileSchema } from '../schemas/account.schemas';

/** Edit name and email (FR-ACC-04). The phone number is the login, so it is read-only. */
export function ProfileForm() {
  const { user } = useSession();
  const update = useUpdateMe();
  if (!user) return null;
  return (
    <Form
      schema={profileSchema}
      defaultValues={{
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
      }}
      onSubmit={async (values) => {
        await update.mutateAsync(values);
        toast.success('Profile saved');
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput name="firstName" label="First name" autoComplete="given-name" />
        <FormInput name="lastName" label="Last name" autoComplete="family-name" />
      </div>
      <FormInput name="email" label="Email (optional)" type="email" autoComplete="email" />
      <Input
        label="Phone number"
        value={formatPhone(user.phone)}
        readOnly
        disabled
        hint="Your phone number is how you log in. Contact support to change it."
      />
      <FormSubmit>Save changes</FormSubmit>
    </Form>
  );
}
