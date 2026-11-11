import { useEffect, useState } from 'react';
import { z } from 'zod';

import { toast } from '@/components/feedback';
import { Form, FormSubmit, OtpInput, PhoneInput, useZodForm } from '@/components/forms';
import { Button, Modal } from '@/components/ui';
import { formatPhone } from '@/lib/format';
import { v } from '@/lib/validation';

import { useRequestPhoneChange, useVerifyPhoneChange } from '../hooks/useAuth';

const phoneSchema = z.object({ phone: v.phone() });
const codeSchema = z.object({ code: v.otp() });
const RESEND_AFTER = 30;

/**
 * Change (or add) the phone number. Step 1 sends a code to the new number; step 2 checks it.
 * The number is only saved once the code is right, so a typo can't lock anyone out.
 */
export function ChangePhoneModal({ open, onClose, currentPhone }) {
  const [phone, setPhone] = useState(null); // normalised new number once a code was sent
  const [seconds, setSeconds] = useState(0);
  const request = useRequestPhoneChange();
  const verify = useVerifyPhoneChange();
  const codeForm = useZodForm(codeSchema, { defaultValues: { code: '' } });

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const close = () => {
    setPhone(null);
    setSeconds(0);
    codeForm.reset({ code: '' });
    onClose();
  };

  const sendCode = async (next) => {
    const sent = await request.mutateAsync({ phone: next });
    setPhone(sent.phone);
    setSeconds(RESEND_AFTER);
  };

  const confirm = async ({ code }) => {
    await verify.mutateAsync({ phone, code });
    toast.success(currentPhone ? 'Phone number changed' : 'Phone number added');
    close();
  };

  const title = currentPhone ? 'Change phone number' : 'Add a phone number';

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      description={
        phone
          ? `We sent a 6-digit code to ${formatPhone(phone)}.`
          : "We'll text a code to the new number to confirm it's yours."
      }
      size="sm"
    >
      {phone ? (
        <div className="space-y-4">
          <Form id="change-phone-code" form={codeForm} onSubmit={confirm}>
            <OtpInput
              name="code"
              label="Verification code"
              focusOnMount
              onComplete={() =>
                setTimeout(() => document.getElementById('change-phone-code')?.requestSubmit(), 0)
              }
            />
            <FormSubmit fullWidth>Confirm number</FormSubmit>
          </Form>
          <div className="flex items-center justify-between text-sm text-ink-muted">
            <Button variant="link" onClick={() => setPhone(null)}>
              Use a different number
            </Button>
            {seconds > 0 ? (
              <span>Resend in {seconds} s</span>
            ) : (
              <Button
                variant="link"
                loading={request.isPending}
                onClick={() =>
                  sendCode(phone).then(
                    () => toast.success('We sent you a new code'),
                    (e) => toast.error(e),
                  )
                }
              >
                Resend code
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Form
          schema={phoneSchema}
          defaultValues={{ phone: '' }}
          onSubmit={({ phone: p }) => sendCode(p)}
        >
          <PhoneInput name="phone" label="New phone number" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <FormSubmit>Send code</FormSubmit>
          </div>
        </Form>
      )}
    </Modal>
  );
}
