import { Printer } from 'lucide-react';

import { Button, Modal } from '@/components/ui';
import { PAYMENT_CHANNEL_LABELS } from '@/features/payments';
import { formatDateTime, formatOrderNumber } from '@/lib/format';

import { OrderTotals } from './OrderTotals';

/** Printable receipt (FR-ORD-06). */
export function OrderReceipt({ order, open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Receipt"
      footer={
        <Button leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
          Print receipt
        </Button>
      }
    >
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-heading text-lg font-semibold">KJT Foodie</p>
          <p className="text-ink-muted">Order {formatOrderNumber(order.code)}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
          <dt className="text-ink-muted">Date</dt>
          <dd>{formatDateTime(order.createdAt)}</dd>
          <dt className="text-ink-muted">Vendor</dt>
          <dd>{order.vendorName}</dd>
          <dt className="text-ink-muted">Customer</dt>
          <dd>{order.customerName}</dd>
          {order.payment && (
            <>
              <dt className="text-ink-muted">Paid with</dt>
              <dd>{PAYMENT_CHANNEL_LABELS[order.payment.channel] ?? order.payment.channel}</dd>
              <dt className="text-ink-muted">Reference</dt>
              <dd className="break-all font-mono text-xs">{order.payment.reference}</dd>
            </>
          )}
        </dl>
        <OrderTotals order={order} />
      </div>
    </Modal>
  );
}
