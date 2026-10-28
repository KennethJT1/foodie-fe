import { useState } from 'react';

import { toast } from '@/components/feedback';
import { Button, Input, Modal, Textarea } from '@/components/ui';
import { formatOrderNumber } from '@/lib/format';

import { useOpenTicket } from '../hooks/useMySupport';

/** Ask the support team a question, optionally about one order. */
export function NewTicketDialog({ open, onClose, order, onCreated }) {
  const [value, setValue] = useState({ subject: '', body: '' });
  const [errors, setErrors] = useState({});
  const openTicket = useOpenTicket();
  const set = (patch) => setValue((v) => ({ ...v, ...patch }));
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ask for help"
      description={
        order
          ? `About order ${formatOrderNumber(order.code)}`
          : 'We usually reply within a few hours.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={openTicket.isPending}
            onClick={() =>
              openTicket.mutate(
                { ...value, orderId: order?.id },
                {
                  onSuccess: (t) => {
                    toast.success(
                      `Ticket #${t.number} sent. We'll reply here and by notification.`,
                    );
                    setValue({ subject: '', body: '' });
                    onCreated?.(t);
                  },
                  onError: (e) => (e.fieldErrors ? setErrors(e.fieldErrors) : toast.error(e)),
                },
              )
            }
          >
            Send to support
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="What is it about?"
          placeholder="Payment debited but no order"
          maxLength={120}
          value={value.subject}
          error={errors.subject}
          onChange={(e) => set({ subject: e.target.value })}
        />
        <Textarea
          label="Tell us what happened"
          rows={4}
          maxLength={2000}
          value={value.body}
          error={errors.body}
          onChange={(e) => set({ body: e.target.value })}
        />
      </div>
    </Modal>
  );
}
