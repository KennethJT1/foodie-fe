import { useState } from 'react';

import { toast } from '@/components/feedback';
import { Button } from '@/components/ui';
import { ORDER_STATUS } from '@/constants/order-status';
import { formatOrderNumber } from '@/lib/format';

import { RejectOrderDialog } from './RejectOrderDialog';
import { useAcceptOrder, useMarkPreparing, useMarkReady } from '../../hooks/useVendorOrders';

const S = ORDER_STATUS;

/** The next step the vendor can take on an order: accept / reject, start preparing, mark ready. */
export function VendorOrderActions({ order, size = 'md', className }) {
  const [rejecting, setRejecting] = useState(false);
  const accept = useAcceptOrder();
  const preparing = useMarkPreparing();
  const ready = useMarkReady();
  const code = formatOrderNumber(order.code);
  const run = (mutation, message) =>
    mutation.mutate(order.id, {
      onSuccess: () => toast.success(message),
      onError: (e) => toast.error(e),
    });

  return (
    <div className={className}>
      {order.status === S.PAID && (
        <div className="flex gap-2">
          <Button
            size={size}
            variant="secondary"
            className="flex-1"
            loading={accept.isPending}
            onClick={() => run(accept, `Order ${code} accepted`)}
          >
            Accept order
          </Button>
          <Button size={size} variant="outline" onClick={() => setRejecting(true)}>
            Reject order
          </Button>
        </div>
      )}
      {order.status === S.ACCEPTED && (
        <Button
          size={size}
          fullWidth
          loading={preparing.isPending}
          onClick={() => run(preparing, `Order ${code} is being prepared`)}
        >
          Start preparing
        </Button>
      )}
      {order.status === S.PREPARING && (
        <Button
          size={size}
          fullWidth
          variant="secondary"
          loading={ready.isPending}
          onClick={() => run(ready, `Order ${code} is ready. We're finding a rider.`)}
        >
          Mark as ready
        </Button>
      )}
      <RejectOrderDialog order={order} open={rejecting} onClose={() => setRejecting(false)} />
    </div>
  );
}
