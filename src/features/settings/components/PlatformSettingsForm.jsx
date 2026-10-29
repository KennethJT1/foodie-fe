import { ErrorState, SkeletonText, toast } from '@/components/feedback';
import {
  Form,
  FormInput,
  FormSelect,
  FormSubmit,
  FormTextarea,
  MoneyInput,
  useZodForm,
} from '@/components/forms';
import { Card, CardTitle } from '@/components/ui';
import { formatNaira, nairaToKobo } from '@/lib/format';

import { ServiceAreasField } from './ServiceAreasField';
import { usePlatformSettings, useUpdateSettings } from '../hooks/useSettings';
import { previewDeliveryFee } from '../lib/delivery-fee';
import { settingsSchema, toSettingsBody, toSettingsForm } from '../schemas/settings.schema';

const MISSED_ACTIONS = [
  { value: 'escalate', label: 'Escalate to the support team' },
  { value: 'warn', label: 'Warn the vendor' },
  { value: 'suspend', label: 'Suspend the vendor' },
];
const TEMPLATE_LABELS = {
  order_paid: 'Order received (customer)',
  order_on_the_way: 'Order on the way (customer)',
  vendor_new_order: 'New order (vendor)',
  subscription_reminder: 'Plan renews soon (vendor)',
};

function Section({ title, description, children }) {
  return (
    <Card header={<CardTitle title={title} description={description} />}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </Card>
  );
}

function FeePreview({ form }) {
  const [base, perKm, max] = form.watch(['deliveryBaseFee', 'deliveryPerKm', 'deliveryMaxFee']);
  const fees = {
    base: nairaToKobo(base || 0),
    perKm: nairaToKobo(perKm || 0),
    max: nairaToKobo(max || 0),
  };
  return (
    <p className="text-sm text-ink-muted sm:col-span-2 lg:col-span-3" aria-live="polite">
      A 2 km trip costs {formatNaira(previewDeliveryFee(fees, 2))}; a 6 km trip costs{' '}
      {formatNaira(previewDeliveryFee(fees, 6))}.
    </p>
  );
}

function SettingsForm({ settings }) {
  const update = useUpdateSettings();
  const form = useZodForm(settingsSchema, { defaultValues: toSettingsForm(settings) });
  const templates = form.watch('notificationTemplates');
  return (
    <Form
      form={form}
      onSubmit={async (values) => {
        const saved = await update.mutateAsync(toSettingsBody(values));
        form.reset(toSettingsForm(saved));
        toast.success('Settings saved. Changes apply from now on.');
      }}
      className="space-y-4"
    >
      <Section title="Delivery fee" description="Base fee plus a rate per km, capped (BR-PAY-07).">
        <MoneyInput name="deliveryBaseFee" label="Base fee" />
        <MoneyInput name="deliveryPerKm" label="Per km" />
        <MoneyInput name="deliveryMaxFee" label="Maximum fee" />
        <FeePreview form={form} />
      </Section>
      <Section title="Riders and orders">
        <FormInput
          name="riderPayoutPct"
          type="number"
          label="Rider payout (% of delivery fee)"
          hint="Applies to deliveries after you save."
        />
        <FormInput name="riderOfferTimeoutSec" type="number" label="Job offer timeout (seconds)" />
        <FormInput
          name="vendorAcceptTimeoutMin"
          type="number"
          label="Vendor accept time (minutes)"
          hint="Orders not accepted in time are refunded."
        />
      </Section>
      <Section title="Subscriptions">
        <FormInput name="trialDays" type="number" label="Free trial (days)" />
        <FormInput
          name="graceDays"
          type="number"
          label="Grace period after a failed payment (days)"
        />
        <FormInput name="yearlyDiscountPct" type="number" label="Yearly discount (%)" />
      </Section>
      <Section title="Refunds">
        <FormInput
          name="refundDeadlineHours"
          type="number"
          label="Vendor must answer within (hours)"
        />
        <FormSelect
          name="refundMissedAction"
          label="If they don't answer in time"
          options={MISSED_ACTIONS}
        />
      </Section>
      <Card
        header={<CardTitle title="Service areas" description="Cities customers can order in." />}
      >
        <ServiceAreasField />
      </Card>
      <Card
        header={
          <CardTitle
            title="Notification templates"
            description="Use {{name}}, {{orderNumber}}, {{vendor}}, {{code}}, {{plan}} and {{date}}."
          />
        }
      >
        <div className="space-y-4">
          {templates.map((t, i) => (
            <fieldset key={t.key} className="space-y-2">
              <legend className="text-sm font-medium">
                {TEMPLATE_LABELS[t.key] ?? t.key} · {t.channel.toUpperCase()}
              </legend>
              {t.channel === 'email' && (
                <FormInput name={`notificationTemplates.${i}.subject`} label="Subject" />
              )}
              <FormTextarea name={`notificationTemplates.${i}.body`} label="Message" rows={2} />
            </fieldset>
          ))}
        </div>
      </Card>
      <div className="flex justify-end">
        <FormSubmit>Save settings</FormSubmit>
      </div>
    </Form>
  );
}

/** Platform settings: fees, payout %, timeouts, trial/grace, refunds, cities, templates. */
export function PlatformSettingsForm() {
  const { data, isLoading, isError, error, refetch } = usePlatformSettings();
  if (isLoading) return <SkeletonText lines={10} />;
  if (isError)
    return <ErrorState title="We couldn't load the settings" error={error} onRetry={refetch} />;
  return <SettingsForm settings={data} />;
}
