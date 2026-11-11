import { useState } from 'react';

import { toast } from '@/components/feedback';
import { Form, FormInput, FormSubmit } from '@/components/forms';
import { Button, Input } from '@/components/ui';
import { formatPhone } from '@/lib/format';

import { ChangePhoneModal } from './ChangePhoneModal';
import { useSession, useUpdateMe } from '../hooks/useAuth';
import { profileSchema } from '../schemas/account.schemas';

/**
 * Edit name and email (FR-ACC-04). The phone number is the login, so it changes through its own
 * OTP step (ChangePhoneModal), never by typing over it here.
 */
export function ProfileForm() {
  const { user } = useSession();
  const update = useUpdateMe();
  const [changingPhone, setChangingPhone] = useState(false);
  if (!user) return null;
  return (
    <>
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
          value={user.phone ? formatPhone(user.phone) : 'Not added yet'}
          readOnly
          disabled
          inputClassName="pr-28"
          rightSlot={
            <Button type="button" variant="link" size="sm" onClick={() => setChangingPhone(true)}>
              {user.phone ? 'Change' : 'Add phone'}
            </Button>
          }
          hint={
            user.phone
              ? `${user.phoneVerified ? 'Verified. ' : ''}We text a code to the new number to confirm any change.`
              : 'Add a number so you can log in with it and riders can reach you.'
          }
        />
        <FormSubmit>Save changes</FormSubmit>
      </Form>
      {/* Outside the form: a submit inside the modal would bubble (through the portal) to this one */}
      <ChangePhoneModal
        open={changingPhone}
        onClose={() => setChangingPhone(false)}
        currentPhone={user.phone}
      />
    </>
  );
}
