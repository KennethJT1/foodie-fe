import { toast } from '@/components/feedback';
import { Form, FormTextarea } from '@/components/forms';
import { Button, Modal } from '@/components/ui';

import { useDisputeRefund } from '../hooks/useRefunds';
import { disputeSchema } from '../schemas/refund.schema';

/** The customer disputes a refund; KJT Foodie support steps in (BR-REF-04). */
export function DisputeDialog({ refund, open, onClose }) {
  const dispute = useDisputeRefund();
  const formId = `dispute-${refund.id}`;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dispute this refund"
      description="Our support team will look into it and contact you and the vendor."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} variant="danger" loading={dispute.isPending}>
            Send dispute
          </Button>
        </>
      }
    >
      <Form
        id={formId}
        schema={disputeSchema}
        defaultValues={{ reason: '' }}
        onSubmit={async ({ reason }) => {
          await dispute.mutateAsync({ id: refund.id, reason });
          toast.success("Dispute sent. We'll be in touch.");
          onClose();
        }}
      >
        <FormTextarea name="reason" label="What went wrong?" rows={3} maxLength={500} />
      </Form>
    </Modal>
  );
}
