import { useParams } from 'react-router-dom';

import { OrderDetail } from '@/features/orders';
import { RefundOrderAction } from '@/features/refunds';
import { RateOrderCard } from '@/features/reviews';
import { LiveOrderTracker } from '@/features/tracking';

export default function OrderDetailPage() {
  const { orderId } = useParams();
  return (
    <div className="px-4 py-6 md:px-6">
      <OrderDetail
        id={orderId}
        live={(order) => <LiveOrderTracker order={order} />}
        afterStatus={(order) => <RateOrderCard order={order} />}
        actions={(order) => <RefundOrderAction order={order} />}
      />
    </div>
  );
}
