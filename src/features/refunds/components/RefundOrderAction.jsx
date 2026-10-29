import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui';
import { ORDER_STATUS } from '@/constants/order-status';
import { ROUTES } from '@/constants/routes';

import { RefundRequestDialog } from './RefundRequestDialog';

/** "Request a refund" on a delivered order, or a link to the existing request. */
export function RefundOrderAction({ order }) {
  const [open, setOpen] = useState(false);
  if (order.refund) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to={ROUTES.account.refund(order.refund.id)}>View refund</Link>
      </Button>
    );
  }
  if (order.status !== ORDER_STATUS.DELIVERED) return null;
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Request a refund
      </Button>
      {open && <RefundRequestDialog order={order} open onClose={() => setOpen(false)} />}
    </>
  );
}
