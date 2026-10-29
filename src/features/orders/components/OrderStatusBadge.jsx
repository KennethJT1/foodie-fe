import { Badge } from '@/components/ui';
import { getOrderStatusMeta } from '@/constants/order-status';

/** The same status always looks the same everywhere. */
export function OrderStatusBadge({ status, className }) {
  const meta = getOrderStatusMeta(status);
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  );
}
