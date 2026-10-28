import { getOrderStatusMeta, ORDER_STATUS, ORDER_STATUS_FLOW } from '@/constants/order-status';
import { formatDateTime } from '@/lib/format';

const ENDED = [ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED];

/**
 * statusHistory → Timeline items: what happened (done), where it is now (current) and what
 * is still to come (upcoming). Cancelled or rejected orders end in a danger step.
 */
export function orderTimeline(order) {
  const history = order.statusHistory ?? [];
  const items = history.map((h, i) => {
    const isLast = i === history.length - 1;
    const ended = ENDED.includes(h.status);
    return {
      id: `${h.status}-${i}`,
      title: getOrderStatusMeta(h.status).label,
      description: isLast ? getOrderStatusMeta(h.status).customer : undefined,
      time: formatDateTime(h.at),
      state: ended ? 'danger' : isLast && h.status !== ORDER_STATUS.DELIVERED ? 'current' : 'done',
    };
  });
  const last = history.at(-1)?.status;
  if (!ENDED.includes(last)) {
    const reached = ORDER_STATUS_FLOW.indexOf(last);
    ORDER_STATUS_FLOW.slice(reached + 1).forEach((s) =>
      items.push({ id: s, title: getOrderStatusMeta(s).label, state: 'upcoming' }),
    );
  }
  return items;
}
