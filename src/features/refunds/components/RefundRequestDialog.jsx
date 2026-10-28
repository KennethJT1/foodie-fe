import { useNavigate } from 'react-router-dom';

import { toast } from '@/components/feedback';
import { Form, FormSelect, FormTextarea, ImageUpload, MoneyInput } from '@/components/forms';
import { Button, Modal } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { formatNaira, koboToNaira, nairaToKobo } from '@/lib/format';

import { REFUND_REASONS } from '../constants';
import { useRequestRefund } from '../hooks/useRefunds';
import { refundRequestSchema } from '../schemas/refund.schema';

/** Ask the vendor for a refund on a delivered order (BR-REF-02). */
export function RefundRequestDialog({ order, open, onClose }) {
  const request = useRequestRefund();
  const navigate = useNavigate();
  const formId = `refund-${order.id}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request a refund"
      description={`${order.vendorName} will respond within 48 hours. Refunds for food are paid by the vendor.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={request.isPending}>
            Send request
          </Button>
        </>
      }
    >
      <Form
        id={formId}
        schema={refundRequestSchema(order.subtotal)}
        defaultValues={{ reason: '', details: '', amount: koboToNaira(order.subtotal), photos: [] }}
        onSubmit={async (values) => {
          const refund = await request.mutateAsync({
            orderId: order.id,
            reason: values.reason,
            details: values.details,
            amount: nairaToKobo(values.amount),
            photos: values.photos,
          });
          toast.success('Refund request sent to the vendor');
          onClose();
          navigate(ROUTES.account.refund(refund.id));
        }}
      >
        <FormSelect
          name="reason"
          label="What went wrong?"
          placeholder="Pick a reason"
          options={REFUND_REASONS.map((r) => ({ value: r, label: r }))}
        />
        <MoneyInput
          name="amount"
          label="Amount"
          hint={`Up to ${formatNaira(order.subtotal)}, the food subtotal`}
        />
        <FormTextarea name="details" label="Tell us more (optional)" rows={3} maxLength={500} />
        <ImageUpload name="photos" label="Photos (optional)" max={3} hint="Up to 3 photos" />
      </Form>
    </Modal>
  );
}
