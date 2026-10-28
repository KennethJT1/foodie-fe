import { useParams } from 'react-router-dom';

import { OrderConfirmation } from '@/features/orders';

export default function OrderConfirmedPage() {
  const { orderId } = useParams();
  return (
    <div className="px-4 py-8 md:px-6">
      <OrderConfirmation id={orderId} />
    </div>
  );
}
