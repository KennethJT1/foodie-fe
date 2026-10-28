import { useParams } from 'react-router-dom';

import { AdminOrderDetail } from '@/features/orders';

export default function OrderDetailPage() {
  const { orderId } = useParams();
  return (
    <div className="px-4 py-6 md:px-6">
      <AdminOrderDetail id={orderId} />
    </div>
  );
}
