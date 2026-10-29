import {
  Form,
  FormCheckbox,
  FormInput,
  FormSelect,
  FormSwitch,
  MoneyInput,
  useZodForm,
} from '@/components/forms';
import { Button, Modal } from '@/components/ui';

import { useSavePlan } from '../../hooks/useAdminSubscriptions';
import { planSchema, toPlanBody, toPlanForm } from '../../schemas/plan.schema';

const FEATURED = [
  { value: 'none', label: 'Standard placement' },
  { value: 'occasional', label: 'Featured now and then' },
  { value: 'priority', label: 'Priority placement' },
];
const ANALYTICS = [
  { value: 'basic', label: 'Basic sales' },
  { value: 'full', label: 'Full sales and engagement' },
  { value: 'export', label: 'Full with CSV export' },
];

/** Create or edit a plan: price, limits, placement, analytics, popular and retired (BR-SUB-07). */
export function PlanEditorDialog({ plan, onClose }) {
  const save = useSavePlan();
  const form = useZodForm(planSchema, { defaultValues: toPlanForm(plan) });
  const unlimited = form.watch('unlimitedItems');
  return (
    <Modal
      open
      onClose={onClose}
      title={plan ? `Edit ${plan.name}` : 'Add a plan'}
      description="New prices apply from each vendor's next renewal."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="plan-editor" loading={form.formState.isSubmitting}>
            Save plan
          </Button>
        </>
      }
    >
      <Form
        id="plan-editor"
        form={form}
        onSubmit={async (values) => {
          await save.mutateAsync({ id: plan?.id, ...toPlanBody(values) });
          onClose();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput name="name" label="Plan name" />
          <MoneyInput name="monthlyPrice" label="Monthly price" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormInput
            name="menuItems"
            label="Menu items"
            type="number"
            min={1}
            disabled={unlimited}
          />
          <FormInput name="photosPerItem" label="Photos per item" type="number" min={1} max={10} />
          <FormInput name="staff" label="Staff logins" type="number" min={1} />
        </div>
        <FormCheckbox name="unlimitedItems" label="Unlimited menu items" />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect name="featured" label="Search placement" options={FEATURED} />
          <FormSelect name="analytics" label="Analytics" options={ANALYTICS} />
        </div>
        <FormSwitch name="isPopular" label="Mark as most popular" />
        <FormSwitch
          name="isRetired"
          label="Retire this plan"
          description="Retired plans can't be chosen. Vendors already on it keep it."
        />
      </Form>
    </Modal>
  );
}
